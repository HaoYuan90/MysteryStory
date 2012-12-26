<?php
require_once '../common.php';

$js_config = array(
    'script_default_stage_id' => '1',
    'sm2' => (object) array(
        'url' => 'static/sm2-swf/',
        'debugMode' => FALSE,
        'consoleOnly' => TRUE,
    ),
);
// TODO: security (might not be needed here, if it's in place for getjson.php)
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $js_config['script_default_id'] = $_GET['id'];
}
?>
<!DOCTYPE HTML>

<html>
<head>
    <title>Mystery Story</title>
    
    <link rel="shortcut icon" href="../favicon.ico">
    <link rel="apple-touch-icon" href="../static/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="72x72" href="../static/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="114x114" href="../static/apple-touch-icon-114x114.png">
    
    <script type="text/javascript">var config = <?php print json_encode($js_config) ?>;</script>
    <?php
    if ($config['javascript_optimize']) { 
        print '<script type="text/javascript" src="js/main.min.js"></script>';
    }
    else {
        print '
            <script type="text/javascript" src="../lime/closure/closure/goog/base.js"></script>
            <script type="text/javascript" src="js/main.js"></script>
        ';
    }
    ?>
    <script>world.mergeRecursive(soundManager, config.sm2);</script>
    
    <script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-26347000-1']);
        _gaq.push(['_trackPageview']);

        (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
    </script>
    <link href='http://fonts.googleapis.com/css?family=Expletus+Sans:400,400italic,700' rel='stylesheet' type='text/css'>
</head>

<body onload="main.start()"></body>

</html>
