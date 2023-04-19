FROM node:18.15.0

RUN mkdir /src

ADD . /src

WORKDIR /src

RUN npm install

CMD npm start
