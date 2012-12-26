<?php
require_once 'common.php';

$message = '<div><p>Subscribe to our list and be the first one to know about updates to the game:</p></div>';
$bigtext_at_message = TRUE;

if (isset($_GET['email'])) {
    $email = $_GET['email'];
    if (valid_email($_GET['email'])) {
        rb_init(FALSE);
        $bean_ar = R::findOrDispense('subscriptions', 'mail = ?', array($email));
        $bean = reset($bean_ar);
        // check whether the email already exists in the database
        if (!$bean->mail) {
            $bean->mail = $email;
            $bean->created = time();
            $bean->ip_address = $_SERVER['REMOTE_ADDR'];
            if (isset($_GET['referer'])) {
                $bean->referer = $_GET['referer'];
            }
            R::store($bean);
            $message = '<p>Thank you for signing up <em>' . htmlentities($email) . '</em>!</p>';
        }
        else {
            $message = '<p>Thank you for signing up! <em>' . htmlentities($email) . '</em> is already on our list.</p>';
        }
        $bigtext_at_message = FALSE;
    }
    else {
        $message = '<p>Sorry, the email address does not seem to be valid. Please try again.</p>';
        $bigtext_at_message = FALSE;
    }
}

?>
<!DOCTYPE html>
<!--[if lt IE 7 ]><html class="ie ie6" lang="en"> <![endif]-->
<!--[if IE 7 ]><html class="ie ie7" lang="en"> <![endif]-->
<!--[if IE 8 ]><html class="ie ie8" lang="en"> <![endif]-->
<!--[if (gte IE 9)|!(IE)]><!--><html lang="en"> <!--<![endif]-->
<head>

    <!-- Basic Page Needs
  ================================================== -->
    <meta charset="utf-8">
    <title>Mystery Story: a browser-based HTML5 game</title>
    <meta name="description" content="">
    <meta name="author" content="">
    <!--[if lt IE 9]>
        <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- Mobile Specific Metas
  ================================================== -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

    <!-- CSS
  ================================================== -->
    <?php print format_css(array('static/base.css', 'static/skeleton.css', 'static/layout.css')); ?>
    <link href='http://fonts.googleapis.com/css?family=Stardos+Stencil|Varela+Round' rel='stylesheet' type='text/css'>
    <style type="text/css">
    body {
        background: #ddd url('static/bg.jpg') repeat;
    }

    #banner {
        font-family: 'Stardos Stencil';
        text-transform: uppercase;
        margin-top: 1em;
        text-align: center;
        font-size: 300%;
        line-height: 1.3;
        color: #181818;
    }

    .center-text {
        text-align: center;
    }
    
    .footer {
        color: #666;
        margin-bottom: 3em;
    }
    </style>

    <!-- Favicons
    ================================================== -->
    <link rel="shortcut icon" href="favicon.ico">
    <link rel="apple-touch-icon" href="static/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="72x72" href="static/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="114x114" href="static/apple-touch-icon-114x114.png">
    
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
</head>
<body>



    <!-- Primary Page Layout
    ================================================== -->

    <!-- Delete everything in this .container and get started on your own site! -->

    <div class="container">
        <div class="sixteen columns center-text">
            <img src="static/header.png" width="940" height="140" alt="Mystery Story">
        </div>
        
        <div class="sixteen columns">
            <div class="row">
                <div class="eleven columns alpha bigtext" id="banner">
                    <div>Every face</div>
                    <div>has a story to tell.</div>
                    <div>People lie. Their faces can't.</div>
                </div>
                <div class="five columns omega" style="text-align:center">
                    <img src="static/main.png" width="280" height="345">
                </div>
            </div>
        </div>
        
        <div class="sixteen columns">
            <div class="row">
                <div class="three columns alpha">&nbsp;</div>
                <div class="ten columns" style="text-align: center">
                    <a class="button" style="font-size:250%;line-height:1.2;" href="game/">Play online now</a>
                </div>
                <div class="three columns omega">&nbsp;</div>
            </div>
        </div>
        
        <div class="sixteen columns">
            <div class="row">
                <div class="eight columns alpha">
                    <h2>The game</h2>
                    <p><em>Mystery Story</em> is a new adventure/puzzle game from Team7 Productions. Follow ace investigator and private detective Ace Jerome around as he solves crimes and brings the perpetrator to justice. Interrogate witnesses, find clues and crack the case! Only one thing is sure – everybody lies.</p>
                    <ul class="square">
                        <li><strong>Fully-scripted interactions and conversations</strong>: Crack the case by carefully interrogating all the witnesses and suspects involved.</li>
                        <li><strong>The logbook</strong>: Ace keeps track of every morsel of information he extracts from his witnesses.</li>
                        <li><strong>Return to the story any time</strong>: Take a break from gameplay and come back any time to the exact spot in the conversation.</li>
                        <li><strong>Learn real life-saving knowledge</strong> integrated into the game.</li>
            <lI>Play right in your browser, desktop or mobile. No installation required.</li>
                    </ul>
                </div>
                <div class="eight columns omega">
                    <h2>A glimpse on episode 1</h2>
                    <p>“People lie. I try not to forget that.
                    <p>“It was supposed to be a vacation. A nice little cruise down the river; sun-tan in the morning, buffet dinners and gambling at night. 
                    <p>“And then an old lady dies – apparently, she had a stroke. Apparently. And then in the middle of the night, her maid comes to me with a story that leaves me with more questions than answers…
                    <p>“So now I’m on the case. Unofficially. I’ve gotta figure out what happened before we get off the boat and the perpetrator runs away. It smells like a set-up. It smells like liars.
                    <p>“And it really, really sucks. It was supposed to be my vacation!” 
                </div>
            </div>    
        </div>
        
        <div class="sixteen columns">
            <div class="row">
                <div class="three columns alpha">&nbsp;</div>
                <div class="ten columns<?php print $bigtext_at_message ? ' bigtext' : '' ?>" style="text-align: center">
                    <?php print $message ?>
                    <form id="sub-form" method="get">
                        <input name="email" id="sub-form-email" type="text" size="30" style="width:100%;font-size:150%;" value="Your email">
                        <button type="submit" id="sub-form-submit" style="font-size:150%;line-height:1.2;">Sign me up!</button>
                    </form>
                </div>
                <div class="three columns omega">&nbsp;</div>
            </div>
        </div>
        
        <div class="sixteen columns footer">
            <p>Mystery Story is an HTML5-based game made by Team7: <a href="https://www.facebook.com/profile.php?id=699730879">D</a> <a href="https://www.facebook.com/profile.php?id=100000493784464">H</a> <a href="https://www.facebook.com/leontius">L</a> <a href="https://www.facebook.com/vaarnan">V</a>. <span class="fb-like" data-href="http://mysterystory.me/" data-send="false" data-width="450" data-show-faces="false"></span></p>
        </div>
        
    </div><!-- container -->
    
    <!-- JS
    ================================================== -->
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js"></script>
    <script src="static/bigtext.js"></script>
    <script>
        $(".bigtext").bigtext();
        $('#sub-form').submit(function() {
            _gaq.push(['_trackEvent', 'Subs', 'Form submit']);
        });
    $('#sub-form-email').focus(function() {$(this).select();});
    </script>
    
    <div id="fb-root"></div>
    <script>(function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_GB/all.js#xfbml=1&appId=210132215725210";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));</script>


<!-- End Document
================================================== -->
</body>
</html>

