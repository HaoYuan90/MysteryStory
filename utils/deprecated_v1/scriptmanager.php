<?php

require_once '../common.php';
rb_init();

$base_url = basename(__FILE__);
$messages = array();
$header = '';

function scriptmanager_process_file($fn, $fn_by_user, $script_id, $note = '') {
    // See http://sg.php.net/manual/en/function.proc-open.php for reference
    $descriptorspec = array(
        0 => array('file', $fn, 'r'), // stdin
        1 => array('pipe', 'w'), // stdout
        2 => array('pipe', 'w'), // stderr
    );
    $process = proc_open('python2 script2js.py', $descriptorspec, $pipes, dirname(__FILE__));
    if (is_resource($process)) {
        $script = R::dispense('script');
        $script->script_id = strlen($script_id) > 0 ? $script_id : basename($fn_by_user, '.csv');
        $script->fn_by_user = $fn_by_user;
        $script->json_content = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $script->log_content = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        proc_close($process);
        $script->csv_content = file_get_contents($fn);
        $script->created = time();
        $script->enabled = TRUE;
        $script->note = $note;
        $id = R::store($script);
        global $header;
        $header .= '<h2>Log of last upload</h2><div>(I) = information, (W) = warning, (E) = error</div><pre style="white-space:normal;white-space:pre-wrap;">' . $script->log_content . '</pre>';
        return array('I', 'Script processed.');
    }
    else {
        return array('E', 'Error processing file...');
    }
}

function scriptmanager_view($id, $kind) {
    $script = R::findOne('script', 'id = ?', array($id));
    header('Content-type: text/plain');
    $map = array('json' => $script->json_content, 'csv' => $script->csv_content, 'log' => $script->log_content);
    print($map[$kind]);
    exit();
}

function scriptmanager_tabulate_scripts($enabled) {
    global $base_url;
    $o = '<table><tr><th>Script ID</th><th>Notes</th><th>Created</th><th>Actions</th><th>Internal ID</th><th>Original file name</th></tr>';
    $rows = R::find('script', 'enabled = ? ORDER BY created DESC', array($enabled));
    foreach ($rows as $row) {
        $render_ar = array(
            $row->script_id,
            $row->note,
            scriptmanager_format_date($row->created),
            '<form>
                <input type="hidden" name="q" value="set_enabled" /><input type="hidden" name="id" value="' . $row->id . '" /><input type="submit" name="button" value="' . ($enabled ? 'Disable' : 'Enable') . '" /> &bull;
                <a href="' . $base_url . '?q=view&id=' . $row->id . '&kind=csv">CSV</a> (' . scriptmanager_format_size($row->csv_content)  . ') &bull;
                <a href="' . $base_url . '?q=view&id=' . $row->id . '&kind=json">JSON</a> (' . scriptmanager_format_size($row->json_content)  . ') &bull;
                <a href="' . $base_url . '?q=view&id=' . $row->id . '&kind=log">log</a> (' . scriptmanager_format_size($row->log_content)  . ') &bull;
                <a href="../game/?id=' . $row->id . '">simulate</a>
            </form>',
            $row->id,
            $row->fn_by_user,
        );
        $o .= '<tr><td>' .  implode('</td><td>', $render_ar)  . '</td></tr>';
    }
    $o .= '</table>';
    return $o;
}

function scriptmanager_set_enabled($id, $enabled) {
    R::exec('UPDATE script SET enabled = ? WHERE id = ?', array($enabled, $id));
}

function scriptmanager_format_date($timestamp) {
    date_default_timezone_set('Asia/Singapore');
    return date('r', $timestamp);
}

function scriptmanager_format_size($s) {
    $lines = explode("\n", $s);
    return '<small>' . (count($lines) - 1) . ' lines</small>';
}

/**
 * Given a v1 JSON string, store the database representation as stage $stage_id.
 * Note that all current script lines, MCQs etc. from the stage with ID $stage_id will be deleted.
 */
function scriptmanager_convert_to_v2($json_content, $stage_id) {
    $json = json_decode($json_content, TRUE);
    //print_r($json);
    
    $stage = R::loadOrDispense('script_stages', $stage_id);
    
    // Update characters.
    $char_ids = array();
    foreach ($json['char'] as $initial => $char) {
        $char_bean_ar = R::findOrDispense('script_characters', 'initial = ?', array($initial));
        $char_bean = reset($char_bean_ar);
        $char_bean->name = $char['name'];
        $char_bean->initial = $initial;
        $char_bean->default_portrait_filename = $initial . 'default';
        $id = R::store($char_bean);
        $chars[$initial] = $char_bean;
    }
    
    R::exec('DELETE FROM script_mcqs WHERE id IN (SELECT next_mcq_id FROM script_lines WHERE stage_id = ?)', array($stage->id));
    R::exec('DELETE FROM script_lines WHERE stage_id = ?', array($stage->id));

    
    $actionset_id = $json['actionset']['init'];
    $lines = array();
    $as_firsts = array(); // array of the actioset id => first action of actionsets
    foreach ($json['actionset']['actions'] as $actionset_id => $actionset) {
        $as_firsts[$actionset_id] = R::dispense('script_lines');
    }
    
    foreach ($json['actionset']['actions'] as $actionset_id => $actionset) {
        $last_line = NULL;
        $first = TRUE;
        $portraits = array();
        foreach ($actionset as $action) {
            
            switch ($action[1]) {
                case 'say':
                    $line = NULL;
                    if ($first) {
                        $line = $as_firsts[$actionset_id];
                        $first = FALSE;
                    }
                    else {
                        $line = R::dispense('script_lines');
                    }
                    $lines[] = $line;
                    
                    $line->stage_id = $stage->id;
                    $current_char = $chars[$action[0]];
                    $line->character_id = $current_char->id;
                    $line->portrait_filename = isset($portraits[$action[0]]) ? $portraits[$action[0]] : NULL; //$current_char->default_portrait_filename;

                    $line->content = $action[2];
                    $line->content_bubble = ($action[0] == 'A') ? 'lower' : 'upper';
                    if ($last_line) {
                        $last_line->next = $line;
                    }
                    $last_line = $line;
                    R::store($line);
                    break;
                case 'actionset_change':
                    $line->next = $as_firsts[$action[2]];
                    break;
                case 'actionset_change_mcq':
                    $mcq = R::dispense('script_mcqs');
                    $mcq->behaviour = 'choose_one';
                    R::store($mcq);
                    $line->next_mcq = $mcq;
                    foreach ($action[2] as $item) {
                        $bean = R::dispense('script_mcq_options');
                        $bean->mcq = $mcq;
                        $bean->content = $item['title'];
                        $bean->next = $as_firsts[$item['id']];
                        R::store($bean);
                    }
                    R::store($line);
                    break;
                case 'pic_change':
                    $portraits[$action[0]] = $action[2];
                    break;
                case 'clue_receive':
                    break;
                default:
                    break;
            }
            

        }
    }
    
    foreach (array_reverse($lines) as $line) {
        R::store($line);
    }
    $stage->first_line_id = $lines[0]->id;
    $stage->last_line_id = $lines[count($lines)-1]->id;
    R::store($stage);
}

if (isset($_FILES['csv_file'])) {
    $file = $_FILES['csv_file'];
    $messages[] = scriptmanager_process_file($file['tmp_name'], $file['name'], $_POST['script_id'], $_POST['note']);
}
if (isset($_GET['q'])) {
    switch ($_GET['q']) {
        case 'set_enabled':
            scriptmanager_set_enabled($_GET['id'], $_GET['button'] == 'Enable' ? TRUE : FALSE);
            break;
        case 'view':
            scriptmanager_view($_GET['id'], $_GET['kind']);
    }
}


?>
<!DOCTYPE HTML>
<html>
<head>
    <title>Script Manager</title>
    <!-- css courtesy of http://www.blueprintcss.org/ -->
    <link rel="stylesheet" type="text/css" href="static/typography.css" />
    <style type="text/css">
        body {margin: 0 auto; width: 90%;}
    </style>
</head>

<body>
    <h1>Script manager</h1>
    <pre>
    <?php
        // This is an example code on how to use the function scriptmanager_convert_to_v2().
        /*
        $json_content = R::getCell('SELECT json_content FROM script WHERE id = ?', array(13));
        //R::debug(TRUE);
        scriptmanager_convert_to_v2($json_content, 2);
        //R::debug(FALSE);
        */
    ?>
    </pre>
    
    <?php print $header ?>
    <h2>Add script</h2>
    <form method="post" enctype="multipart/form-data">
        <div>Script ID: <input id="form-id" name="script_id" type="text" /> (if blank, will be taken from the file name)</div>
        <div>CSV file: <input id="form-csv-file" name="csv_file" type="file" /></div>
        <div>Notes: <input id="form-note" name="note" type="text" size="50" /> (write whatever stuff you want, does not affect anything)</div>
        <div><input type="submit" value="Submit" /></div>
    </form>
    
    
    <h2>Current or enabled scripts</h2>
    <div>Note that if there are two or more scripts with the same script ID enabled, the latest version (newest created date, or topmost one here) will be used.</div>
    <?php print scriptmanager_tabulate_scripts(TRUE) ?>
    <h2>Historical or disabled scripts</h2>
    <?php print scriptmanager_tabulate_scripts(FALSE) ?>
</body>

</html>

