FROM node:8

# Prepare workdir
RUN mkdir /app
WORKDIR /app
COPY . /app

# Install dependencies
RUN apt-get update \
      && apt-get install -y libgtk-3-0 libxss1 libnss3 libasound2 netcat

# Enable audio
# https://github.com/TheBiggerGuy/docker-pulseaudio-example
COPY pulse-client.conf /etc/pulse/client.conf
ENV UNAME pacat
RUN export UNAME=$UNAME UID=1000 GID=1000 && \
    mkdir -p "/home/${UNAME}" && \
    echo "${UNAME}:x:${UID}:${GID}:${UNAME} User,,,:/home/${UNAME}:/bin/bash" >> /etc/passwd && \
    echo "${UNAME}:x:${UID}:" >> /etc/group && \
    mkdir -p /etc/sudoers.d && \
    echo "${UNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${UNAME} && \
    chmod 0440 /etc/sudoers.d/${UNAME} && \
    chown ${UID}:${GID} -R /home/${UNAME} && \
    gpasswd -a ${UNAME} audio
USER $UNAME
ENV HOME /home/pacat
#

# Install dependencies
RUN yarn install

# Expose port
EXPOSE 8080

# Run the app
CMD [ "scripts/start_app.sh" ]
