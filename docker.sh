#!/bin/bash
ACTION="$1"

if [[ "$ACTION" == "build" ]]; then
  docker build -t anki .
elif [[ "$ACTION" == "run" ]]; then
xhost +local:root
docker run -it\
  --rm\
  -e DISPLAY="$DISPLAY"\
  -v /tmp/.X11-unix:/tmp/.X11-unix\
  -v "$(pwd)"/projects:/projects\
  -v /run/user/"$(id -u)"/pulse:/run/user/"$(id -u)"/pulse\
  -v /dev/snd:/dev/snd\
  --privileged\
  anki
else
  echo "Unknown action"
  exit 1
fi
