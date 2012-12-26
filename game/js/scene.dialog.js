
goog.provide('game.scene.dialog');

goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.fill.Image');
goog.require('lime.RoundedRect');
goog.require('lime.Label');
goog.require('lime.Button');
goog.require('lime.Circle');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');
goog.require('lime.Renderer');
goog.require('lime.transitions.Dissolve');
goog.require('lime.transitions.SlideInDown');


goog.require('game.ui');
goog.require('game.world');
goog.require('game.sound');
goog.require('game.logbook');

var mcq_layers;
var mcq_flag;
var first_line_flag = true;
var backgroundSprite;
game.scene.dialog.make = function(stageId, lineId) {
    game.sound.effects.CHAPTER_TRANSIT.extPlay();
    
    if (world.model.stages[parseInt(stageId) + 1]) {
        // load next chapter
        world.loadModel(parseInt(stageId) + 1);
    }
    
    var transitionScene = new lime.Scene();
    world.setStage(stageId);
    transitionScene.appendChild(game.ui.makeBlackScreen());
    transitionScene.appendChild(new lime.Label().setFontSize(70).setFontWeight("bold").setAnchorPoint(0,0).setFontColor('#ddd').setSize(screen_left - 20, screen_top).setPosition(0, screen_left/2).setText('').extSetHTML(world.model.stages[stageId].name, true));
    
    var called = false;
    var replaceWithRealScene = function() {
        if (!called) {
            called = true;
            var dialogScene = new lime.Scene();
            dialogScene.appendChild(game.ui.makeBlackScreen());
            world.currentScene = dialogScene;
            world.dialogScene = dialogScene;
            world.state.currentLine = world.model.lines[world.model.stage.first_line_id];
            world.saveState();
            game.scene.dialog.startStage(stageId, lineId);
            world.director.replaceScene(dialogScene, lime.transitions.Dissolve);
            game.sound.effects.CHAPTER_TRANSIT.stop();
        }
    }
    
    goog.events.listenOnce(transitionScene, ['mouseup', 'touchend'], replaceWithRealScene);
    setTimeout(replaceWithRealScene, 2400);
    return transitionScene;
}

game.scene.dialog.startStage = function(stageId, lineId) {
    //Instantiate the handlers (currently de-facto singletons).
    var createInstances = function(h) {
        var result = new Object();
        for (var key in h) {
            var cls = h[key];
            result[key] = new cls();
        }
        return result;
    }
    
    var lineHandlers = createInstances(game.scene.dialog.lineHandlers);
    var advancers = game.scene.dialog.advancers;
    
    // This callback function will be called by the appropriate action handler. Once called it will advance the story.
    var processOneStep = function(lineId) {
        var currentLine = world.model.lines[lineId];
        world.state.currentLine = currentLine;
        world.saveState();
        
        console.log(lineId, currentLine);
        
        for (var i in lineHandlers) {
            lineHandlers[i].process(currentLine, function() {
                for (var i in advancers) {
                    if (advancers[i].qualifies(currentLine)) {
                        console.log('Advancing using advancer', i);
                        advancers[i].advance(currentLine, function(a) {
                            //console.log(game.sound.effects.CLICK);
                            game.sound.effects.CLICK.extPlay();
                            processOneStep(a);
                        });
                        break;
                    }
                }
            });
        }
    };
    var logbook = game.ui.makeButtonIcon('logbookIcon.png').setPosition(screen_left - 50, screen_top - 50);
    world.currentScene.appendChild(logbook);
    goog.events.listen(logbook, ['mousedown','touchend'],function(e){
        game.sound.effects.BOOK_OPEN.play();
		console.log("clicked");
        world.director.replaceScene(game.world.logbook, lime.transitions.SlideInDown, world.TRANSITION_DURATION);
		console.log(e);
	});

    processOneStep(lineId);
}


/*
 * A map where the key is arbitrary and the value is a class/constructor for the handler.
 * 
 * A handler should have process(line, callback) method that processes the line and optionally call callback in order to advance the story progression. Currently only "conversation" calls callback, because the only way to continue / progress the story is to click during conversation.
 */
game.scene.dialog.lineHandlers = {
    conversation: function() {
        var MARGIN = 20;
        var N_LINES = 5;
        var BUBBLE_TOP = 0, BUBBLE_BOTTOM = 1, ANIM_DURATION = 0.3;
        
        var makeBubble = function(facePos, yPos) {
            var bubble = game.ui.makeLabelWithFace(screen_left - MARGIN, N_LINES, '', facePos).setPosition(screen_left/2, yPos);
            bubble.setHidden(true);
            bubble.labelLayer.label.setText('');
            world.currentScene.appendChild(bubble);
            return bubble;
        }
        
        this.bubbles = Array();
        this.bubbles[BUBBLE_TOP] = makeBubble('right', 120);
        this.bubbles[BUBBLE_BOTTOM] = makeBubble('left', 750);
       
        this.makeLabelAnim_ = function(q) {
            var qOpacity = q;
            var qScale = q;

            return new lime.animation.Spawn(new lime.animation.FadeTo(qOpacity), new lime.animation.ScaleTo(1, qScale)).setDuration(ANIM_DURATION);
        }
        
        this.animateBubble_ = function(bubble, type) {
            var qOpacity = type == 'in' ? 0.75 : 0;
            var qScale = type == 'in' ? 1 : 0;
            
            var animBorder = new lime.animation.Spawn(new lime.animation.FadeTo(qOpacity), new lime.animation.ScaleTo(qScale)).setDuration(ANIM_DURATION);
            var animLabel = this.makeLabelAnim_(qScale);
            var pause = new lime.animation.Delay().setDuration(ANIM_DURATION);
            if (type == 'in') {
                animLabel = new lime.animation.Sequence(pause, animLabel);
            }
            else {
                animBorder = new lime.animation.Sequence(pause, animBorder);
            }
            
            bubble.labelLayer.border.runAction(animBorder);
            bubble.labelLayer.label.runAction(animLabel);
        }
        
        this.getBubbleIdByContentBubble_ = function(content_bubble) {
            return content_bubble == 'lower' ? BUBBLE_BOTTOM : BUBBLE_TOP;
        }
        
        this.wrapText_ = function(text) {
            return text;
        }
        
        this.updateLabel_ = function(lines_obj) {
            var bubbleId = this.getBubbleIdByContentBubble_(lines_obj.content_bubble);
            this.bubbles[bubbleId].labelLayer.label.extSetHTML(this.wrapText_(lines_obj.content));
            //console.log(this_handler.bubbles[bubbleId].labelLayer);
            var imagePath = "img/" + world.model.characters[lines_obj.character_id].default_portrait_filename +".png";
            if (lines_obj.portrait_filename != undefined)
                imagePath = "img/"+lines_obj.portrait_filename +".png";

            this.bubbles[bubbleId].faceLayer.face.setFill(new lime.fill.Image(imagePath));

        };
        
        this.process = function(lines_obj, callback) {
            var bubbleId = this.getBubbleIdByContentBubble_(lines_obj.content_bubble);
            var anim;
            if (this.lastBubbleId_ != bubbleId) {
                // a different bubble is being used
                this.bubbles[bubbleId].setHidden(false);
                
                var handler = this;
                var lastBubbleId_ = this.lastBubbleId_; // "close" (as in "closure") lastBubbleId_ so that it won't get the latest value (which is the bubble to be shown) when update() is called via setTimeout
                var update = function() {
                    handler.updateLabel_(lines_obj);
                    if (handler.bubbles[lastBubbleId_]) {
                        anim = handler.animateBubble_(handler.bubbles[handler.lastBubbleId_], 'out');
                    }
                    handler.animateBubble_(handler.bubbles[bubbleId], 'in');
                }
                
                if (typeof this.lastBubbleId_ === 'undefined') {
                    // In the very first run, the DOM probably has not been initialized properly yet, so the HTML text may not set properly. I think this function must return first before the HTML can be updated. To workaround this we update the label in a separate "thread" (10 miliseconds later).
                    setTimeout(update, 10);
                }
                else {
                    update();
                }
            }
            else {
                // the same bubble is being used
                // hide the text...
                anim = this.makeLabelAnim_(0);
                this.bubbles[bubbleId].labelLayer.label.runAction(anim);
                var this_handler = this;
                goog.events.listenOnce(anim, 'stop', function(e) {
                    // update the text...
                    this_handler.updateLabel_(lines_obj);
                    // and then show the updated text
                    this_handler.bubbles[bubbleId].labelLayer.label.runAction(this_handler.makeLabelAnim_(1));
                });
            }
            
            this.lastBubbleId_ = bubbleId;
            //this.lastCharId_ = action[0];
            // listenOnce() instead of listen() is crucial here, since we don't want this to listen all the way until world.currentScene_ is destroyed.
            goog.events.listenOnce(world.dialogScene, ['mousedown','touchend'], callback);
        }; // function step()
    }, // end conversation handler
    
    background: function() {
        var lastFilename = world.model.lines[world.model.stage.first_line_id].bg_filename;
        var backgroundImagePath = "img/"+lastFilename+".jpg";
        var bgSprite = new lime.Sprite().setAnchorPoint(0, 0).setSize(screen_left, screen_top).setPosition(0,0).setFill(new lime.fill.Image(backgroundImagePath));
        var nextBgSprite = new lime.Sprite().setAnchorPoint(0, 0).setSize(screen_left, screen_top).setPosition(0,0);
        
        world.currentScene.appendChild(bgSprite);
        world.currentScene.setChildIndex(bgSprite, 1);
        world.currentScene.appendChild(nextBgSprite);
        world.currentScene.setChildIndex(nextBgSprite, 1);
        
        this.process = function(line, callback) {
            if (line.bg_filename && line.bg_filename != lastFilename) {
                //console.log(bgSprite, nextBgSprite);
                nextBgSprite.setFill(new lime.fill.Image("img/"+line.bg_filename+".jpg")).setOpacity(0);
                bgSprite.runAction(new lime.animation.FadeTo(0).setDuration(0.5));
                var fadeIn = new lime.animation.FadeTo(1).setDuration(0.5);
                nextBgSprite.runAction(fadeIn);
                goog.events.listen(fadeIn, 'stop', function() {
                    var temp = bgSprite;
                    bgSprite = nextBgSprite;
                    nextBgSprite = temp;
                });
                lastFilename = line.bg_filename;
            }
            
        };
    }, // end background handler
    
    tooltip: function() {
        var tooltip = game.ui.makeAnyKeyTooltip();
        var callCount = 0;
        
        if (!world.state.sawClue) {
            world.currentScene.appendChild(tooltip);
        }
        
        this.process = function(line, callback) {
            callCount++;
            if (callCount == 2) {
                world.currentScene.removeChild(tooltip);
                world.state.sawClue = true;
            }
        }
    }, // end tooltip handler
    
    clue_receive: function() {
        if (!world.state.clues) {
            world.state.clues = [];
        }
        
        var tooltip;
        world.state.clues = [];
        
        this.process = function(line, callback) {
            world.currentScene.removeChild(tooltip);
            if (line.received_clue_id && (world.state.clues.indexOf(line.received_clue_id) == -1)) {
                game.sound.effects.BOOK_OPEN.play();
                
				//console.log("clue here");
				//console.log(world.model.script_clues);
				//console.log(world.model.clues[line.received_clue_id]);
                var clue = world.model.clues[line.received_clue_id];
                tooltip = game.ui.makeClueReceiveTooltip('Clue received: '+clue.name);
                world.currentScene.appendChild(tooltip);
                world.state.clues.push(line.received_clue_id);
                world.saveState(); // TODO: why save state here? Not the correct place.
                game.world.logbook = game.logbook.make();
			}
        }
    }
    
};


game.scene.dialog.helpers_ = {
    is_line_mcq: function(line) {
        return line.next_mcq_id && !line.next_id;
    },
    get_options: function(mcq_option_id) {
        var options = [];
        for (var option in world.model.mcq_options) {
				
            if (world.model.mcq_options[option].mcq_id == mcq_option_id) {
                options.push(world.model.mcq_options[option]);
            }
        }
        return options;
    }
};

game.scene.dialog.advancers = {
    regular: {
        qualifies: function(line) {
            return line.next_id && !line.next_mcq_id && !game.scene.dialog.advancers.stageChange.qualifies(line);
        },
        
        advance: function(line, callback) {
            callback(line.next_id);
        }
    },
    
    mcq_choose_one: {
        qualifies: function(line) {
            return game.scene.dialog.helpers_.is_line_mcq(line) && (world.model.mcqs[line.next_mcq_id].behaviour == 'choose_one');
        },
        
        advance: function(line, callback) {
            game.sound.effects.QUESTION.extPlay();
            var tooltip = game.ui.makePressButtonTooltip();
            world.currentScene.appendChild(tooltip);
            var mcq_option_id = line.next_mcq_id;
            //mcq_option_id = toString(mcq_option_id);
            var options,
                optionText = new Array();
            options = game.scene.dialog.helpers_.get_options(mcq_option_id);
            
            //world.model.mcq_options[world.model.script_mcqs[mcq_id]],
			
            for (var option in options) {
                optionText.push(options[option].content);
            }
            var mcq_flag = true;
            var mcq_layers = game.ui.makeList(optionText);
            for (var layer in mcq_layers) {
                // denormalize next_id
                mcq_layers[layer].next_id_ = options[layer].next_id;
                world.currentScene.appendChild(mcq_layers[layer]);
                goog.events.listenOnce(mcq_layers[layer], ['mousedown','touchend'],function(e){
                    mcq_flag = false;
                    world.currentScene.removeChild(tooltip);
                    callback(e.target.next_id_);
                    
                    for (var layer in mcq_layers) {
                        mcq_layers[layer].removeAllChildren();
                        mcq_layers[layer].releaseDependencies();
                    }
                });
                
            }
        } // end this.advance()
        
    }, // end mcq
    
    mcq_repeat_for_each: {
        qualifies: function(line) {
            return game.scene.dialog.helpers_.is_line_mcq(line) && (world.model.mcqs[line.next_mcq_id].behaviour == 'repeat_for_each');
        },
        
        advance: function(line, callback) {
            // TODO
            game.scene.dialog.advancers.mcq_choose_one.advance(line, callback);
        }
    }, // end mcq_repeat_for_each
    
    mcq_random: {
        qualifies: function(line) {
            return game.scene.dialog.helpers_.is_line_mcq(line) && (world.model.mcqs[line.next_mcq_id].behaviour == 'random');
        },
        
        advance: function(line, callback) {
            var options = game.scene.dialog.helpers_.get_options(line.next_mcq_id);
            callback(options[Math.floor(Math.random()*options.length)].next_id);
        }
    }, // end mcq_random
    
    stageChange: {
        qualifies: function(line) {
            return line.next_id && (world.model.lines[line.next_id].stage_id != line.stage_id);
        },
        
        advance: function(line, callback) {
            game.sound.effects.FANFARE.extPlay();
            world.currentScene.extAppendNamedChild('fader', game.ui.makeFadeInToBlack(true, 0.5));
            
            var chapterLabel = new lime.Label().setFontSize(40).setAnchorPoint(0,0).setFontColor('#ddd').setSize(screen_left - 40, screen_top).setPosition(0, 240).extSetHTML(world.model.stage.name, true).setOpacity(0);
            
            world.currentScene.extAppendNamedAnimatedChild(
                'chapterLabel',
                new lime.animation.Sequence(
                    new lime.animation.Delay().setDuration(0.6),
                    new lime.animation.FadeTo(1).setDuration(0.5)
                ),
                chapterLabel
            );
            
            world.currentScene.extAppendNamedAnimatedChild(
                'completeLabel',
                new lime.animation.Sequence(
                    new lime.animation.Delay().setDuration(1.5),
                    new lime.animation.FadeTo(1).setDuration(0.5)
                ),
                new lime.Label().setFontSize(70).setFontWeight("bold").setAnchorPoint(0,0).setFontColor('#ddd').setSize(screen_left - 20, screen_top).setPosition(0, 400).setText('COMPLETE').setOpacity(0)
            );
           
            var fadeInChoices = new lime.animation.Sequence(
                    new lime.animation.Delay().setDuration(4),
                    new lime.animation.FadeTo(1).setDuration(0.5)
            );
            
            var clickChoices = ['Continue to the next chapter', 'Replay this chapter'];
            var clickCallbacks = [
                function() {
                    var nextLine = world.model.lines[line.next_id];
                    var scene = game.scene.dialog.make(nextLine.stage_id, nextLine.id);
                    world.replaceScene(scene);
                },
                function() {
                    var scene = game.scene.dialog.make(line.stage_id, world.model.stages[line.stage_id].first_line_id);
                    world.replaceScene(scene, 'backward');
                }
            ];
            
            var choices = game.ui.makeList(clickChoices);
            for (var i in choices) {
                choices[i].extSetPositionRelative(0, 250);
                world.currentScene.extAppendNamedAnimatedChild('choice'+i, fadeInChoices, choices[i].setOpacity(0));
                goog.events.listenOnce(choices[i], ['mousedown', 'touchend'], clickCallbacks[i]);
            }

        // end here, callback not called
        }
    }, // end stageChange
    
    stageChangeBeta: {
        qualifies: function(line) {
            return false;
        },
        
        advance: function(line, callback) {
            // hack temporary end of chapter here
            world.currentScene.appendChild(game.ui.makeFadeInToBlack(true, 0.5));
            var label = new lime.Label().setFontSize(40).setFontWeight("bold").setAnchorPoint(0,0).setFontColor('#ddd').setSize(screen_left - 20, screen_top).setPosition(0, 240).setText(' '); // setText fixes setHTML
            world.currentScene.appendChild(label);
            setTimeout(function() {
                label.extSetHTML('Thanks for playing our game! Tell us what you think at <a href="http://bit.ly/mysterystory-survey">bit.ly/mysterystory-survey</a>!');
            }, 500);
            
        // end here, callback not called
        }
    } // end stageChangeBeta
};




