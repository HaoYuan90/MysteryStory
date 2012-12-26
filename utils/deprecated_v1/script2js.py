'''Script to convert CSV novel scripts to parseable Javascript/JSON.

Accepts CSV format via stdin, and outputs JSON via stdout. Alternatively, the --scan option will cause the script to scan through the current directory for all .csv files and generate corresponding .json files out of them.
'''

from __future__ import print_function, unicode_literals

import csv, sys, re, sre_constants, glob
from collections import defaultdict
import json

def csv_read(infile, reader_cls=csv.reader, skip_header=True):
    dialect = csv.Sniffer().sniff(infile.read())
    infile.seek(0)
    reader = reader_cls(infile, dialect)
    if skip_header:
        reader.next()
    return reader

def log(level, s):
    msg = '(%s) row %d: %s\n' % (level, log.line_no, s)
    sys.stderr.write(msg.encode('ascii', errors='replace'))

class LazySceneEncodee(object):
    '''This class acts as a dummy for references to scenes in MCQs, because the scene data (title) is not fully realised when the reference is made. SpecialJSONEncoder intercepts instances of this class and encodes the proper realised scene data.'''

    def __init__(self, scene_id, scenes):
        self.scene_id = scene_id
        self.scenes = scenes
    
    def __getstate__(self):
        return self.scenes[self.scene_id]

class SpecialJSONEncoder(json.JSONEncoder):
    def default(self, o):
        try:
            if o.__class__.__name__ == 'LazySceneEncodee':
                return o.__getstate__()
        except:
            pass
        return json.JSONEncoder.default(self, o)

class Processor(object):
    '''Interface for Processors.'''
    def process_row(self, row):
        pass
    def emit(self):
        return {}

class CharacterProcessor(Processor):
    def __init__(self):
        self.chars = {}
        self.default_main_char_id = None
        self.process_row(['*', 'Engine'])
    
    def process_row(self, row):
        # Index by initials.
        self.chars[row[0]] = {'name': row[1], 'pics': set(), 'appear_count': 0}
        if len(row) > 2 and 'main' in row[2]:
            self.default_main_char_id = row[0]
    
    def inc_appear_count(self, char_id):
        self.chars[char_id]['appear_count'] += 1
        
    def emit(self):
        # Remove characters that do not appear in any of the scenes.
        chars = {}
        for k, v in self.chars.iteritems():
            if v['appear_count'] > 0:
                del(v['appear_count'])
                v['pics'] = sorted(v['pics']) # convert set to a list, since set is not JSON serializable
                chars[k] = v
        return chars


class SceneProcessor(Processor):
    def __init__(self, char_processor):
        self.scenes = defaultdict(dict)
        self.scene_actions = defaultdict(list)
        self.this_scene = None
        self.init_scene = None
        self.terminal_scene = None
        self.incomplete_scenes = [] # stores scenes that do not yet have a progression (does not end with a actionset_change action)
        self.char_processor = char_processor

    def process_row(self, row):
        script= row[1]
        if len(script) == 0:
            return
        action = self.script_to_action(script)
        scenes, scene_actions, incomplete_scenes = self.scenes, self.scene_actions, self.incomplete_scenes

        def append_to_current_scene(a):
            scene_actions[self.this_scene].append(a)

        if action[0] == '*':
            # This signifies that the action needs further processing.
            if action[1] == 'actionset_change':
                self.this_scene = action[2]
                this_scene = self.this_scene

                if not self.init_scene:
                    self.init_scene = this_scene

                if this_scene not in incomplete_scenes:
                    # Add implicit progression for every scene that does not end with a actionset_change action
                    for scene in incomplete_scenes:
                        if not scene_actions[scene][-1][1].startswith('actionset_change'):
                            log('I', 'adding implicit progression from scene "%s" to scene "%s"' % (scene, this_scene))
                            scene_actions[scene].append(['*', 'actionset_change', this_scene])
                    self.incomplete_scenes = [this_scene]
                scenes[this_scene] = {'id': this_scene, 'title': action[3].strip()}
            elif action[1] == 'actionset_change_mcq':
                incomplete_scenes.extend(action[2])
                action[2] = [LazySceneEncodee(scid, scenes) for scid in action[2]]
                append_to_current_scene(action)
            # these actions actually do not need further processing, but the actor needs to be '*'
            elif action[1] in ('clue_get'):
                append_to_current_scene(action)
            else: # fallback for action[1] == 'error'
                log('W', 'ignoring incomprehensible row: %s' % (script))
            
        else:
           append_to_current_scene(action)
        
        last_action_verb = action[1]
    
    def script_to_action(self, script):
        '''Constructs an action from a script line.

        An action is a list in the form of [actor, verb, parameter 1, parameter 2...]. A scene is a list of actions.
        '''
        chars = self.char_processor.chars
        initials_re = '|'.join(re.escape(s) for s in chars.keys())

        def change_pic(m):
            initial = m.group(1)
            pic = m.group(3).strip()
            chars[initial]['pics'].add(pic)
            return [initial, 'pic_change', pic]
        
        # This list contains tuples of (regexp pattern, function that returns an action list)
        # The actor of '*' signifies that it is special and needs further processing in process()
        script2js = [
            # say
            (r'^(%s): (.*)$' % initials_re, lambda m: [m.group(1), 'say', format_html(m.group(2).strip())]),
            # change picture
            (r'^(%s)pic( -|:) (.*)$' % initials_re, change_pic),
            # player-facing MCQ that changes scene
            (r'^choice( -|:) (.* or .*)$', lambda m: ['*', 'actionset_change_mcq', [s.strip().lower() for s in re.split('or', m.group(2), flags=re.IGNORECASE)]]),
            # clue received
            (r'^clue received( -|:) (.*)$', lambda m: ['*', 'clue_get', m.group(2).strip()]),
            # change scene (with scene name)
            (r'^([0-9]+[0-9A-Z ]*)( -|:) (.*)$', lambda m: ['*', 'actionset_change', m.group(1).lower(), m.group(3)]),
            # change scene (without scene name)
            # scene names start with a number and contains only numbers, a-z (case insensitive) and space
            (r'^[0-9]+[0-9A-Z ]*', lambda m: ['*', 'actionset_change', m.group(0).lower(), '']),

        ]
        for pattern, fun in script2js:
            m = re.match(pattern, script, re.IGNORECASE)
            if m is not None:
                retval = fun(m)
                chars[retval[0]]['appear_count'] += 1
                return retval
        # No pattern match.
        return ['*', 'error', script]

    def emit(self):
        sa = dict(self.scene_actions)
        terminal_scene = self.terminal_scene or self.this_scene
        sa[terminal_scene].append(['*', 'actionset_change_terminal'])
        
        scenes = dict(self.scenes)
        for k, v in scenes.iteritems():
            if 'main_char_id' not in v:
                v['main_char_id'] = self.char_processor.default_main_char_id
        
        return {
            'actionsets': self.scenes,
            'actions': sa,
            'init': self.init_scene,
            'terminal': terminal_scene,
        }


def process(infile, outfile):
    char_processor = CharacterProcessor()
    processors = [
        ('char', char_processor, r'^character.*'),
        ('actionset', SceneProcessor(char_processor), r'^scene.*'),
    ]
    current_p = processors[0]

    log.line_no = 0
    for row in csv_read(infile, skip_header=False):
        log.line_no += 1
        row = [unicode(col.strip(), encoding='utf8', errors='replace') for col in row]
        if row[0] == '*':
            for p in processors:
                if re.match(p[2], row[1], re.IGNORECASE):
                    current_p = p
                    log('I', 'Entering section "%s"' % current_p[0])
                    break
            else:
                # Loop fell through without finding a correct processor
                log('W', 'Unknown section "%s"' % row[1])
        else:
            current_p[1].process_row(row)

    out = {}#{'chars': chars, 'scene': processor.emit()}
    for key, processor, _ in processors:
        out[key] = processor.emit()

    encoded = SpecialJSONEncoder(indent=4, separators=(',', ':'), sort_keys=True).encode(out)
    outfile.write(encoded)
    

def format_html(s):
    subs = [
        (r'/(.*)/', r'<em>\1</em>'), # note that this must be done first since HTML contains slashes
        (r'\*(.*)\*', r'<strong>\1</strong>'),
        (r'_(.*)_', r'<u>\1</u>'),
        (r'=(.*)=', r'<del>\1</del>'),
    ]
    for pattern, repl in subs:
        s = re.sub(pattern, repl, s)
    return s
        
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] in ('-s', '--scan'):
        for fn in [s[:-4] for s in glob.glob('*.csv') if s != 'characters.csv']:
            print('processing', fn)
            with open(fn+'.csv', 'r') as infile, open(fn+'.json', 'w') as outfile:
                    process(infile, outfile)
    else:
        process(sys.stdin, sys.stdout)
