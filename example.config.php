<?php

// This is a sample config file. To install this app in your server, *copy* (NOT rename) this file to config.php and modify values accordingly. Please *DO NOT* put config.php under version control.
// The default values here are suitable for development.

$config = array();

// This line in config.php ensures that configurations are always set at least to the default value even if config.php is out of date.
require_once('example.config.php');

$config['db']['hostname'] = 'localhost';
$config['db']['username'] = 'root';
$config['db']['password'] = '';
$config['db']['db_name'] = '';

// Enable HTML5 offline storage. Setting this to FALSE during debugging can make your life much easier.
// Note that upon switching from TRUE to FALSE you need to flush the app cache manually in your browser. See google "[your browser] disable app cache html5 manifest".
$config['manifest_cache_enable'] = FALSE;

// Enable javascript packing (minification and aggregation).
$config['javascript_optimize'] = FALSE;

