#!/bin/bash
docker build -t anki .
xhost +local:root
docker run -it --rm -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix anki
