<?php
// This file is not supposed to be run by the webserver.
if (php_sapi_name() != 'cli') {
    die();
}

print("Starting build...\n");
$start_time = microtime(TRUE);

system('node utils/r.js -o name=main out=scripts/main.min.js baseUrl=scripts');

printf("Build done in %.3f secs.\n", (microtime(TRUE) - $start_time));
