
goog.provide('game.ui');

goog.require('lime.Layer');
goog.require('lime.RoundedRect');
goog.require('lime.Label');
goog.require('lime.Button');
goog.require('lime.Circle');
goog.require('lime.Sprite');
goog.require('lime.fill.Image');
goog.require('lime.fill.Stroke');
goog.require('lime.fill.LinearGradient');

goog.require('game.ext');

game.ui.FONT_SIZE = 30;
game.ui.LINE_HEIGHT = 1.2;
//game.ui.FONT_FAMILY = "Chewy";
game.ui.FONT_FAMILY = "Expletus Sans";
//game.ui.FONT_FAMILY = "Modern Antiqua";
//game.ui.FONT_FAMILY = "Cherry Cream Soda";
//game.ui.FONT_FAMILY = "Miltonian Tattoo, Helvetica, Arial, sans-serif";

lime.Label.defaultFont = game.ui.FONT_FAMILY;


game.ui.makeList = function(mcqOptions) {
	var layerList = game.ui.makeButtonLayers(mcqOptions),
	listNum = layerList.length;
	var optionW = screen_left - 20;
	var optionH = (screen_top/6)/listNum;
	var gap = 25;
	for (var layer in layerList) {
		layerList[layer].setSize(optionW, optionH);
		layerList[layer].setPosition(screen_left/2, (screen_top*.4)+(optionH*layer) + layer*gap);
        
        var gradient = new lime.fill.LinearGradient().
        setDirection(0,0,0,1).
        addColorStop(1,160,204,217,.85).
        addColorStop(0,219,247,255,.85);
        
		layerList[layer].getChildAt(0).setSize(optionW, optionH).setOpacity(1).setFill(gradient).setStroke(new lime.fill.Stroke(7, "rgb(255,255,255)"));
		layerList[layer].getChildAt(1).setSize(optionW, optionH).setAnchorPoint(.5, 0.25);
	}
	return layerList;
}

game.ui.makeButtonLayers = function(mcqOptions) {
	var layerArray = new Array();
	for (var option in mcqOptions) {
		layerArray.push(game.ui.makeButton(mcqOptions[option]));
	}
	return layerArray;
}

game.ui.makeButton = function(text) {
	var button = new lime.RoundedRect().setRadius(20).setOpacity(.75),
        label = new lime.Label().setFontSize(30).setFontWeight("bold").setText('').extSetHTML(text, true),
        layer = new lime.Layer().appendChild(button).appendChild(label);
	return layer;
}

game.ui.FACE_DIAMETER = 165;

game.ui.makeFace = function(face_url) {
    var layer = new lime.Layer().setPosition(0, 0);//.setPosition(screen_left*.19, screen_top*.65);
    layer.extAppendNamedChild('face', new lime.Circle().setSize(game.ui.FACE_DIAMETER, game.ui.FACE_DIAMETER).setFill(new lime.fill.Image(face_url)));
    return layer;
}

game.ui.makeButtonIcon = function(image_url) {
    //var layer = new lime.Layer().setPosition(0, 0);//.setPosition(screen_left*.19, screen_top*.65);
    //layer.extAppendNamedChild('buttonIcon', new lime.RoundedRect().setRadius(0).setSize(game.ui.FACE_DIAMETER, game.ui.FACE_DIAMETER).setFill(new lime.fill.Image('img/'+image_url)));
    return new lime.Sprite().setFill(new lime.fill.Image('img/'+image_url));
    //return game.ui.makeCustomButtonIcon(image_url, game.ui.FACE_DIAMETER, game.ui.FACE_DIAMETER);
}

game.ui.makeCustomButtonIcon = function(image_url, bWidth, bHeight) {
    var layer = new lime.Layer().setPosition(0, 0);//.setPosition(screen_left*.19, screen_top*.65);
    layer.extAppendNamedChild('buttonIcon', new lime.RoundedRect().setRadius(0).setSize(bWidth, bHeight).setFill(new lime.fill.Image('img/'+image_url)));
    return layer;
}

game.ui.LABEL_PADDING = 20;

game.ui.makeLabel = function(width, nLines) {
    var LABEL_PADDING = game.ui.LABEL_PADDING; // in pixels
    var layer = new lime.Layer();//.setSize(width, height);
    var height = nLines * game.ui.FONT_SIZE * game.ui.LINE_HEIGHT + LABEL_PADDING * 2;
    layer.extAppendNamedChild('border', new lime.RoundedRect().setRadius(15).setFill(255, 255, 255).setSize(width, height).setOpacity(0.75));
    // LABEL_PADDING is padding for one side of the label, so we multiply by 2 for the left and the right side
    layer.extAppendNamedChild('label', new lime.Label().setSize(width-2*LABEL_PADDING, height-2*LABEL_PADDING).setPosition(0, 0).setFontSize(game.ui.FONT_SIZE).setFontColor("black").setAlign('left').setRenderer(lime.Renderer.DOM));
    //layer.label.setLineHeight(game.ui.LINE_HEIGHT);
    return layer;
}


game.ui.makeLabelWithFace = function(width, nLines, face_url, facePos) {
    var layer = new lime.Layer();
    layer.extAppendNamedChild('labelLayer', game.ui.makeLabel(width, nLines));
    
    var xDisposition = game.ui.FACE_DIAMETER - layer.labelLayer.label.getSize().width;
    var multiplier = facePos == 'right' ? -1 : 1; // whether we disposition the label to the left or to the right
    
    // setPosition: we divide by 2 because the anchor point is in the middle of the screen
    layer.extAppendNamedChild('faceLayer', game.ui.makeFace(face_url).setPosition(multiplier*xDisposition/2, 0));
    
    var size = layer.labelLayer.label.getSize();
    layer.labelLayer.label.setSize(size.width - game.ui.FACE_DIAMETER - game.ui.LABEL_PADDING*2, size.height);

    layer.labelLayer.label.setPosition(multiplier*(game.ui.FACE_DIAMETER+game.ui.LABEL_PADDING)/2, 0);
    
    // Move the anchor points to facilitate scaling animations.
    layer.labelLayer.label.extMoveAnchorPoint(0, 0); // labels always scale from top to bottom. The x-axis anchor point is irrelevant.
    // The border should look like it comes out from the face, so the anchor point depends on the face position.
    if (facePos === 'right') {
        layer.labelLayer.border.extMoveAnchorPoint(0.9, 0.5);
    }
    else {
        layer.labelLayer.border.extMoveAnchorPoint(0.1, 0.5);
    }
    return layer;
}


game.ui.makeBlackScreen = function() {
    return new lime.Sprite().setFill('#000').setSize(screen_left, screen_top).setAnchorPoint(0,0).setPosition(0,0);
}

game.ui.makeFadeInToBlack = function(animateImmediately, duration) {
    var sprite = game.ui.makeBlackScreen().setOpacity(0);
    sprite.fadeInAnimation = new lime.animation.FadeTo(.9).setDuration(duration);
    sprite.fadeIn = function() {
        sprite.runAction(sprite.fadeInAnimation);
    }

    sprite.fadeOutAnimation = new lime.animation.FadeTo(0).setDuration(duration);
    sprite.fadeOut = function() {
        sprite.runAction(sprite.fadeOutAnimation);
    }
    
    if (animateImmediately) {
        sprite.fadeIn();
    }
    
    return sprite;
}

game.ui.makeAnyKeyTooltip = function() {
    return game.ui.makeTooltip('Tap or click anywhere on the screen to continue');
}

game.ui.makePressButtonTooltip = function() {
    return game.ui.makeTooltip('Select your option to continue').setPosition(screen_left/2, 260);
}

game.ui.makeClueReceiveTooltip = function(message) {
    return game.ui.makeTooltip(message).setPosition(screen_left/2, 300);
}

game.ui.makeTooltip = function(tooltipText) {
    var LABEL_PADDING = 10; // in pixels
    var layer = new lime.Layer();//.setSize(width, height);
    var height = (game.ui.FONT_SIZE * 0.7) * game.ui.LINE_HEIGHT + LABEL_PADDING * 2;
    layer.extAppendNamedChild('border', new lime.RoundedRect().setRadius(15).setFill(255, 255, 255).setOpacity(0.75));
    // LABEL_PADDING is padding for one side of the label, so we multiply by 2 for the left and the right side
    layer.extAppendNamedChild('label', new lime.Label().setPosition(0, 0).setFontSize(game.ui.FONT_SIZE*0.7).setFontColor("black").setAlign('left').setRenderer(lime.Renderer.DOM));
    //layer.label.setLineHeight(game.ui.LINE_HEIGHT);
    layer.setPosition(screen_left/2, 40);
    layer.label.setText(tooltipText);
    var labelSize = layer.label.getSize();
    layer.border.setSize(labelSize.width + LABEL_PADDING * 2, labelSize.height + LABEL_PADDING * 2);
    return layer;
}
