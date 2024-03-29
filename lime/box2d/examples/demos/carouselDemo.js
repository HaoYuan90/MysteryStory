goog.provide('demos.CarouselDemo');

goog.require('demos.Demo');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('pl.retained.Animation');
goog.require('pl.retained.CarouselContainer');
goog.require('pl.retained.Stage');
goog.require('pl.retained.Text');
goog.require('pl.retained.helper');


/**
 * @constructor
 * @extends {demos.Demo}
 */
demos.CarouselDemo = function(canvas) {
  this._mouse = null;

  goog.events.listen(canvas, goog.events.EventType.MOUSEOUT, this._onMouseOut, false, this);
  goog.events.listen(canvas, goog.events.EventType.MOUSEMOVE, this._onMouseMove, false, this);

  var container = new pl.retained.CarouselContainer(500, 500);
  container.radius(new goog.math.Size(190, 40));

  for (var i = 0; i < 4; i++) {
  var img = DemoHost.images.get('pixellab_transparent');
  var image = new pl.retained.Image(img, img.width, img.height);
  container.middleElement(image);

    var text = new pl.retained.Text(String(i + 1), 150, 30);
    text.fillStyle = i % 2 ? '#BBB' : '#DDD';
    text.textFillStyle = 'black';
    text.isCentered = true;
    container.addElement(text);
  }

  goog.base(this, canvas, container);

  var frameCount = 200;
  var animation = new pl.retained.Animation(container, frameCount, function(i, element) {
    element.angle(i * Math.PI * 2 / frameCount);
  });
};
goog.inherits(demos.CarouselDemo, demos.Demo);

/**
 * @override
 */
demos.CarouselDemo.prototype.frame = function() {
  var updated = goog.base(this, 'frame');

  if (this._mouse) {
    var ctx = this._stage.getContext();
    pl.retained.helper.borderHitTest(this._stage, this._mouse.x, this._mouse.y);
  }
  return updated;
};

demos.CarouselDemo.prototype._onMouseMove = function(e) {
  this._mouse = new goog.math.Coordinate(e.offsetX, e.offsetY);
};

demos.CarouselDemo.prototype._onMouseOut = function(e) {
  this._mouse = null;
};
