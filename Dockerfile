FROM node:8

RUN mkdir /app
WORKDIR /app
COPY . /app

RUN apt-get update \
      && apt-get install -y libgtk-3-0 libxss1 libnss3 libasound2 netcat

RUN yarn install

EXPOSE 8080

CMD [ "scripts/start_app.sh" ]
