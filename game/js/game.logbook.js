goog.provide('game.logbook');
goog.require('lime.Label');
goog.require('lime.Button');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Sprite');
goog.require('lime.Sprite');
goog.require('lime.fill.Image');
goog.require('lime.transitions.SlideInUp');

goog.require('game.world');
goog.require('game.sound');


game.logbook.make = function() {
    var logbookScene;
    var logbookLayer;
    var scenes;
    var sceneStackSize = 0;
    
	var logbookBackIcon = function() {
		var button = game.ui.makeCustomButtonIcon('backIcon.png', 50, 50).setPosition(screen_left/2 - 40, screen_top - 150);
		goog.events.listen(button, ['mousedown','touchend'],function(e){
		if (sceneStackSize <= 0) {
                game.sound.effects.BOOK_CLOSE.play();
                world.director.replaceScene(world.dialogScene, lime.transitions.SlideInUp, game.world.TRANSITION_DURATION);
            }
            else {
                world.director.popScene();
                sceneStackSize--;
            }
		});
		return button;
	}

	var logbookFrontIcon = function(scene) {
		var button = game.ui.makeCustomButtonIcon('frontIcon.png', 50, 50).setPosition(screen_left/2 + 40, screen_top - 150);
		goog.events.listen(button, ['mousedown','touchend'],function(e){
			sceneStackSize++;
			world.director.pushScene(scene);
		});
		return button;
	}

	var create_logbook_page = function(heading) {
		var logbookScene = new lime.Scene(),
		logbookLayer = new lime.Layer().setPosition(screen_left/2, screen_top/2);
		var backgroundImagePath = "img/logbook2.jpg";
		var bgSprite = new lime.Sprite().setAnchorPoint(0, 0).setSize(screen_left, screen_top).setPosition(0,0).setFill(new lime.fill.Image(backgroundImagePath));
		var headingLabel = new lime.Label().setText(heading).setFontWeight("bold").setFontSize(80).setPosition(0, -screen_top/2 +55);
		logbookLayer.appendChild(headingLabel);
		var backIcon = logbookBackIcon();
		
		logbookScene.appendChild(bgSprite);
		logbookScene.appendChild(logbookLayer);	
		logbookScene.appendChild(backIcon);
		return logbookScene;
	}

	logbookScene = create_logbook_page("Select Chapter");

	var create_chapter_button = function(chapter_id, scene) {
        var position;
		 if (chapter_id < total/2) {
			position = screen_top/2 - (total/2 - parseInt(chapter_id)) * 100;
		} else {
			position = screen_top/2 + (parseInt(chapter_id) - total/2) * 100;
		}
        var chapterButton = new lime.RoundedRect().setSize(280,100).setFill(20, 8, 4).setRadius(50).setPosition(screen_left/2, position),
        lbl = new lime.Label().setFontSize(55).setFontColor("#FFFFFF").setText("Chapter  " + chapter_id).setPosition(screen_left/2,position);
        
		goog.events.listen(chapterButton, ['mousedown','touchend'],function(e){
			console.log(scenes);
			console.log(chapter_id);
			world.director.pushScene(scenes[chapter_id][0]);
            sceneStackSize++;
		});
		console.log(scene);
		scene.appendChild(chapterButton);
		scene.appendChild(lbl);
	}

	var render_clues = function(chapter_id) {
        console.log('chapter '+chapter_id);
        var clue;
        var chapter_clues = new Array();
        for (clue in world.state.clues) {
			if (chapter_id == parseInt(world.state.clues[clue].charAt(0)))
				chapter_clues.push(world.model.clues[world.state.clues[clue]]);
		}
		if (chapter_clues.length == 0) {
			var selectChapterText = new lime.Label().setText("You have no clues for this chapter!").setFontColor("red").setFontWeight("bold").setFontSize(40).setPosition(screen_left/2, screen_top/2);		
			var noClueScene = create_logbook_page("Chapter  " + chapter_id);
			noClueScene.appendChild(selectChapterText);
			var noClueSceneArray = new Array();
			noClueSceneArray.push(noClueScene);
			return noClueSceneArray;
		}
		console.log(chapter_clues);
		var clueScenes = new Array();
        for (clue in chapter_clues) {
			var clueScene = create_logbook_page("Chapter  " + chapter_id);
			var clueObj = chapter_clues[clue];
/*			console.log(chapter_clues.length);
			if (clue < chapter_clues.length/2) {
				position = screen_top/2 - (chapter_clues.length/2 - clue) * 300;
			} else {
				position = screen_top/2 + (clue - chapter_clues.length/2) * 300;
			}
*/			
            console.log(clueObj);
            var clueHeading = new lime.Label().setFontSize(30).setText(clueObj.name).setPosition(screen_left/2, 140).setFontWeight("bold").setSize(screen_left, 20);
			var clueBody = new lime.Label().setFontSize(30).setText(clueObj.description).setPosition(screen_left/2, screen_top - 280).setSize(screen_left - 100, screen_top).setAlign('left');
			clueScene.appendChild(clueHeading);
			clueScene.appendChild(clueBody);
			console.log(clue);
			if (clue > 0) {
				clueScenes[clue - 1].appendChild(logbookFrontIcon(clueScene));
			}
			clueScenes.push(clueScene);
		}
		return clueScenes;
	}


	var create_chapter_scene = function(chapter_id) {
		var chapter_scene = create_logbook_page("Chapter  " + chapter_id);
		return chapter_scene;
	}


	
	if (!(world.state.clues && (world.state.currentLine || world.state.nextLineId))) {
		var selectChapterText = new lime.Label().setText("You have no clues!").setFontColor("red").setFontWeight("bold").setFontSize(60).setPosition(screen_left/2, screen_top/2);		
		logbookScene.appendChild(selectChapterText);
		return logbookScene;
	}
	if (world.state.currentLine) 
		current_stage_id = world.state.currentLine.id.charAt(0);
	else 
		current_stage_id = world.state.nextLineId.charAt(0);
	var total = parseInt(current_stage_id);
	scenes = new Array();
	for (var i = 1; i <= total; i++) {
		scenes[i] = new Array();
		var clueScenes = render_clues(i);
		for (scene in clueScenes) {
			scenes[i].push(clueScenes[scene]);
		}
		create_chapter_button(i, logbookScene);
	}
	return logbookScene;
};
//goog.inherits(game.logbook, lime.helper.PauseScene);  
//goog.inherits(game.logbook, lime.Scene);  
