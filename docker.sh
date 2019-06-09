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
  -v "$(pwd)"/projects:/home/anki/projects\
  -v /run/user/"$(id -u)"/pulse:/run/user/1000/pulse\
  -v /dev/snd:/dev/snd\
  -v /usr/share/fonts/:/usr/share/fonts/\
  --privileged\
  anki
else
  echo "Unknown action"
  exit 1
fi
