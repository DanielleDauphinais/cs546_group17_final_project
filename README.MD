# Little Free Library Connections 📚📘

This application is a website that connects users to Little free libraries in Hoboken. Users can create libraries, add comments to a library and rate the fullness of the library so donors know when it needs to be refilled and book readers know when to visit the library. This application creates a more community feel to the libraries so people can interact with each other. These kinds of libraries are a take a book leave a book so knowing the exact inventory would not be worth keeping track of but know how full and what kind of books are available would be good for donors and visitors

## Live Deployment

https://lfll.vi-sh.tech/

## Team

<ol>
  <li>Kashi Vishwanath Bondugula</li>
  <li>Evan Jinks</li>
  <li>Danielle Dauphinais</li>
  <li>George Alapatt</li>
  <li>Julien Carr</li>
</ol>

## Trello Board

https://trello.com/b/HdvCPcRe/feature-delegation

##

## How to run?

```sh
# Install the node_modules
npm i
# If you don't have the env file in the current directory, add it with this export authSecret
# this is the authSecret used to generate and validate the session tokens
export authSecret="this could be anything and it wouldn't really matter"
# if you would like to use the cloud mongo instead of local
export DB_URL="PUT_THE_CLOUD_MONGO_URL_HERE"
# seed the database
npm run seed
# and finally run the server
npm start
```
