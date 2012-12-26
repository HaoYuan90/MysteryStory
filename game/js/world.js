/*
 * The world is the global state of the game. All items inside game.world.state are serialized while saving the game and are restored while loading.
 * 
 * This file also describes persistence methods for the global state.
 */
goog.require('goog.net.XhrIo');
goog.require('goog.Uri');

goog.require('lime.Director');
//goog.require('lime.transitions.Dissolve');
goog.require('lime.transitions.SlideInRight');
goog.require('lime.transitions.SlideInLeft');

goog.provide('game.world');
goog.provide('game.world.state');
// provide a global variable
world = game.world;

game.world.TRANSITION_DURATION = 0.6;

game.world.initFromModel = function(model) {
    // restore stage_id which is not loaded by getjson.php
    for (var i in model.lines) {
        model.lines[i].stage_id = model.stage_id;
    }
    
    if (typeof world.model === 'undefined') {
        world.model = model;
    }
    else {
        world.mergeRecursive(world.model, model);
    }
};

game.world.loadModel = function(stage_id, callback) {
    var m = world.model;
    // Do not load stage if stage_id is invalid
    if (m && m.stages && !m.stages[stage_id]) {
        console.log('Invalid stage_id', stage_id);
        // Note that callback is never called.
        return;
    }
    if (m && m.stages && m.stages[stage_id].loaded_) {
        console.log('Not re-downloading', stage_id);
        return
    }
    
    var jsonLoader = new goog.net.XhrIo();
    goog.events.listen(jsonLoader, goog.net.EventType.COMPLETE, function(event) {
        var model = event.target.getResponseJson();
        world.initFromModel(model);
        world.model.stages[stage_id].loaded_ = true;
        if (typeof callback === 'function') {
            callback(model);
        }
    });
    jsonLoader.send('getjson.php?stage_id='+stage_id);
}

game.world.setStage = function(stage_id) {
    world.model.stage = world.model.stages[stage_id];
}

game.world.replaceScene = function(scene, direction) {
    // if direction is not given, will slide right
    world.director.replaceScene(scene, direction == 'backward' ? lime.transitions.SlideInLeft : lime.transitions.SlideInRight, game.world.TRANSITION_DURATION);
}


/// MISCELLANEOUS UTILITY FUNCTIONS ///

/**
 * Adds all members/properties of obj2 to obj1 (obj1 is modified). Returns obj1.
 */

game.world.mergeRecursive = function(obj1, obj2) {
    for (var p in obj2) {
        if( obj2.hasOwnProperty(p)){
            obj1[p] = (typeof obj1[p] === 'object') && (typeof obj2[p] === 'object') ? world.mergeRecursive(obj1[p], obj2[p]) : obj2[p];
        }
    }
    return obj1;
}

game.world.saveState = function() {
	localStorage.setItem('world.state', JSON.stringify(world.state));
}

game.world.loadState = function() {
	if (localStorage.getItem('world.state'))
		world.state = JSON.parse(localStorage.getItem('world.state'));
	if (!world.state) {
		world.state = new Object();
		return false;
	}
	return true;
}
