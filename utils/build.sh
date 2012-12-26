#!/bin/zsh

# cd to the parent of the script's directory
BASEDIR=$(dirname $0)
cd $BASEDIR
cd ..
#pwd

echo ':: updating dependencies'
python2 lime/bin/lime.py update

# dirty hack
echo '../game' > lime/bin/projects

echo ':: generating sounds'
for i in game/sounds-orig/*
do
  ffmpeg -y -i $i -ac 1 -ab 32k game/sounds/${i:r:t}.mp3
done

echo ':: compiling optimized JS files'
python2 lime/bin/lime.py build game -o game/js/main.min.js

echo ':: further compressing optimized JS file'
uglifyjs --mangle-toplevel --no-squeeze --ascii --no-copyright --overwrite game/js/main.min.js

