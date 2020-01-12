sudo docker build -t builder-node-12-wine ./docker

sudo docker run --rm -ti --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  builder-node-12-wine \
  /bin/bash -c "yarn --link-duplicates --pure-lockfile && yarn dist $*"