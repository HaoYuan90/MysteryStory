<?php

/*

Common include file that parses config.php and provides convenience functions.

Including this file provides the global variable $config.

*/

$config_filepath = dirname(__FILE__) . '/config.php';
if (!file_exists($config_filepath)) {
    die('Please see instructions at example.config.php.');
}

require_once($config_filepath);

/*
Provides the global variable $db. See http://sg.php.net/manual/en/mysqli.query.php for usage example.
*/
function db_init() {
    global $config;
    global $db;
    $db = new mysqli($config['db']['hostname'], $config['db']['username'], $config['db']['password'], $config['db']['db_name']);
    if ($db->connect_errno) {
        die('Could not connect: ' . $db->connect_error);
    }
    
}

function rb_init($freeze = TRUE) {
    require_once 'rb.php';
    global $config;
    R::setup(sprintf('mysql:host=%s;dbname=%s', $config['db']['hostname'], $config['db']['db_name']), $config['db']['username'], $config['db']['password']);
    // freeze by default -- we don't want the schema to change!
    R::freeze($freeze);
}

function format_css($filenames) {
    $o = '';
    foreach ($filenames as $fn) {
        $o .= '<link href="' . $fn . '" rel="stylesheet" type="text/css" />' . "\n";
    }
    return $o;
}


/**
Stolen from: http://www.linuxjournal.com/article/9585?page=0,3
Validate an email address.
Provide email address (raw input)
Returns true if the email address has the email 
address format and the domain exists.
*/
function valid_email($email) {
    $isValid = true;
    $atIndex = strrpos($email, "@");
    if (is_bool($atIndex) && !$atIndex) {
        $isValid = false;
    } else {
        $domain = substr($email, $atIndex + 1);
        $local = substr($email, 0, $atIndex);
        $localLen = strlen($local);
        $domainLen = strlen($domain);
        if ($localLen < 1 || $localLen > 64) {
            // local part length exceeded
            $isValid = false;
        } else if ($domainLen < 1 || $domainLen > 255) {
            // domain part length exceeded
            $isValid = false;
        } else if ($local[0] == '.' || $local[$localLen - 1] == '.') {
            // local part starts or ends with '.'
            $isValid = false;
        } else if (preg_match('/\\.\\./', $local)) {
            // local part has two consecutive dots
            $isValid = false;
        } else if (!preg_match('/^[A-Za-z0-9\\-\\.]+$/', $domain)) {
            // character not valid in domain part
            $isValid = false;
        } else if (preg_match('/\\.\\./', $domain)) {
            // domain part has two consecutive dots
            $isValid = false;
        } else if
        (!preg_match('/^(\\\\.|[A-Za-z0-9!#%&`_=\\/$\'*+?^{}|~.-])+$/', str_replace("\\\\", "", $local))) {
            // character not valid in local part unless 
            // local part is quoted
            if (!preg_match('/^"(\\\\"|[^"])+"$/', str_replace("\\\\", "", $local))) {
                $isValid = false;
            }
        }
        if ($isValid && !(checkdnsrr($domain, "MX") || checkdnsrr($domain, "A"))) {
            // domain not found in DNS
            $isValid = false;
        }
    }
    return $isValid;
}

