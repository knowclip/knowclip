sudo docker run --rm -ti --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  --env GITHUB_RUN_NUMBER=$GITHUB_RUN_NUMBER \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  justinsilvestre/electron-builder-node-12-wine \
  /bin/bash -c "yarn && yarn dist $*"