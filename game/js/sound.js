
goog.provide('game.sound');

goog.require('soundmanager2');

game.sound.makeSound = function(id) {
    var reallyMakeSound = function(lid, autoPlay) {
        return soundManager.createSound({
            id: lid,
            url: 'sounds/' + lid + '.mp3',
            autoLoad: true,
            autoPlay: autoPlay
        });
    };
    
    var sound = reallyMakeSound(id, false);
    sound.extPlay = function() {
        // workaround for iPad // doesn't really work...
        if (this.readyState != 3) {
            this.load();
            soundManager.stopAll();
            this.play(arguments);
        }
        else {
            this.play(arguments);
        }
    };
    return sound;
}

soundManager.onready(function() {
    game.sound.effects = {
        CLICK: game.sound.makeSound('click'),
        FANFARE: game.sound.makeSound('brass-fanfare'),
        QUESTION: game.sound.makeSound('warning'),
        CHAPTER_TRANSIT: game.sound.makeSound('loading'),
        BOOK_OPEN: game.sound.makeSound('bookflip2'),
        BOOK_CLOSE: game.sound.makeSound('bookflip1')
    };
    
});

