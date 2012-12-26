goog.provide('game');
goog.provide('main');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.RoundedRect');
goog.require('lime.Label');
goog.require('lime.fill.Image');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');
goog.require('game.logbook');
goog.require('game.scene.dialog');
goog.require('game.world');

screen_left = 640;
screen_top = 960;


main.loadScript_ = function(stage_id, needed_line_id) {
    world.loadModel(stage_id, function() {
        if (needed_line_id && !world.model.lines[needed_line_id]) {
            // line still not loaded
            main.loadScript_(parseInt(stage_id)+1, needed_line_id);
        }
        else {
            main.isScriptLoaded_ = true;
        }
    });
}

main.tryToStartGame_ = function() {
    if (main.isScriptLoaded_) {
        game.world.logbook = game.logbook.make();
        var id = config.script_default_id ? config.script_default_id : world.model.stages[config.script_default_stage_id].first_line_id;
        //console.log(id);
        world.replaceScene(game.scene.dialog.make(world.model.lines[id].stage_id, id));
    }
}

// entrypoint
main.start = function(){
    /*
    console.log("before load");
    console.log(world.state);
    game.world.loadState();
	console.log("after load");
    console.log(world.state);
    */
   
    if (world.state.currentLine) {
        main.loadScript_(config.script_default_stage_id, world.state.currentLine.id);
    }
    else {
        main.loadScript_(config.script_default_stage_id, config.script_default_id);
    }
    
    world.director = new lime.Director(document.body,screen_left,screen_top);
    var homeScreen = new lime.Scene(),

        target = new lime.Layer().setPosition(screen_left/2, screen_top*.75),
        playButton = new lime.RoundedRect().setSize(500,150).setFill(20, 8, 4).setRadius(50),
        background = new lime.Sprite().setFill(new lime.fill.Image("img/firstpage.jpg")).setSize(screen_left, screen_top).setPosition(0, 0).setAnchorPoint(0, 0),
        lbl = new lime.Label().setSize(300,50).setFontSize(75).setFontColor("#FFFFFF").setText('Play!').setPosition(0,0);
    //title = new lime.Label().setSize(800,70).setFontSize(60).setText('Now move me around!')
    //  .setOpacity(0).setPosition(512,80).setFontColor('#999').setFill(200,100,0,.1);

    //load sample json
        
	homeScreen.appendChild(background);
    //add circle and label to target object
    target.appendChild(playButton);
    target.appendChild(lbl);

    //add target and title to the scene
    homeScreen.appendChild(target);
    //playScene.appendChild(title);

    world.director.makeMobileWebAppCapable();
	world.director.setDisplayFPS(false);
    //add some interaction
    goog.events.listen(target,['mousedown','touchstart'],function(e){

        //animate
        var a = new lime.animation.Spawn(
            new lime.animation.FadeTo(.5).setDuration(.1),
            new lime.animation.ScaleTo(1.5).setDuration(.1)
            );
        target.runAction(a);
        goog.events.listenOnce(a, 'stop', function() {game.sound.effects.CHAPTER_TRANSIT.extPlay(); main.tryToStartGame_();});
    //renderScene();
    //goog.director.replaceScene(renderScene(object_model))
    });

    // set current scene active
    world.director.replaceScene(homeScreen);

};

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('main.start', main.start);
