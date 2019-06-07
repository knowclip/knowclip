#!/bin/bash

>/dev/null 2>&1 yarn start &

echo "Wait for port 3000"
while ! nc -z localhost 3000; do
  sleep 0.5
  printf "."
done
printf "\n"
yarn electron
