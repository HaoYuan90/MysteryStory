/*
 * Convenience modifications to lime. All function declared here MUST have a name starting with ext.
 */

goog.provide('game.ext');

goog.require('lime.Node');

/*
 * lime modifications.
 */

/*
 * Adds a child to a node that is accessible via node[name].
 */
lime.Node.prototype.extAppendNamedChild = function(name, child, opts) {
    this.appendChild(child, opts);
    this[name] = child;
};


lime.Node.prototype.extAppendNamedAnimatedChild = function(name, anim, child, opts) {
    child.runAction(anim);
    this.extAppendNamedChild(name, child, opts);
}

/*
 * Moves anchor point without moving position of a node.
 */
lime.Node.prototype.extMoveAnchorPoint = function(x, y) {
    var oldAP = this.getAnchorPoint();
    var oldPos = this.getPosition();
    var oldSize = this.getSize();
    
    this.setAnchorPoint(x, y);
    this.setPosition(oldPos.x - (oldSize.width * (oldAP.x - x)), oldPos.y - (oldSize.height * (oldAP.y - y)));

    return this;
};


lime.Label.prototype.extSetHTML = function(html, useTimeout) {
    if (useTimeout) {
        var that = this;
        setTimeout(function() {that.extSetHTML(html);}, 50);
    }
    else {
        this.getDeepestDomElement().innerHTML = html;
    }
    return this;
};

lime.Node.prototype.extSetPositionRelative = function(x, y) {
    var pos = this.getPosition();
    pos.x += x;
    pos.y += y;
    this.setPosition(pos);
    return this;
};
