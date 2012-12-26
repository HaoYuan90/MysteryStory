<?php

require_once('../common.php');

rb_init();

/*
 * Example params:
 * getjson.php?stage_id=2
 */
function dump_v2($sid) {
    //R::debug(TRUE);
    $o = array(
        'stage_id' => $sid,
        'stages' => R::findAndExport('script_stages', '1 ORDER BY id'), // load ALL stages
        'lines' => R::findAndExport('script_lines', 'stage_id = ?', array($sid)),
        'clues' => R::findAndExport('script_clues', 'id IN (SELECT received_clue_id FROM script_lines WHERE stage_id = ?)', array($sid)),
        'characters' => R::findAndExport('script_characters', 'id IN (SELECT character_id FROM script_lines WHERE stage_id = ?)', array($sid)),
        'mcqs' => R::findAndExport('script_mcqs', 'id IN (SELECT next_mcq_id FROM script_lines WHERE stage_id = ?)', array($sid)),
    );
    $mcq_ids = array_keys($o['mcqs']);
    if (!empty($mcq_ids)) {
        $o['mcq_options'] = R::findAndExport('script_mcq_options', 'mcq_id IN (' . R::genSlots($mcq_ids) .')', $mcq_ids);
    }
    
    foreach ($o['lines'] as $k => $line) {
        // stage_id is always the same. We remove this here to reduce the file size.
        unset($o['lines'][$k]['stage_id']);
        
        // remove elements (columns) where the values are NULL
        foreach ($line as $line_k => $line_v) {
            if ($line_v === NULL) {
                unset($o['lines'][$k][$line_k]);
            }
        }
    }
    //TODO: we can compress the line ID here a la URL shortening services, although it's probably not worth the effort
    return $o;
}

if (isset($_GET['stage_id']) && is_numeric($_GET['stage_id'])) {
    $o_dump = json_encode(dump_v2($_GET['stage_id']));
    header('Content-type: text/plain');
    print($o_dump);
}

// Below is deprecated v1 JSON

/*
 *  Example params:
 * getjson.php?id=7 -> uses internal auto_increment ID
 * getjson.php?script_id=protoscript1 -> uses human-readable script ID
 */
// TODO: add security mechanism
if (isset($_GET['script_id'])) {
    $json_content = R::getCell('SELECT json_content FROM script WHERE script_id = ? AND enabled = ? ORDER BY created DESC LIMIT 1', array($_GET['script_id'], TRUE));
    print($json_content);
}
else if (isset($_GET['id'])) {
    print(R::getCell('SELECT json_content FROM script WHERE id = ?', array($_GET['id'])));
}
