#!/bin/bash

rm -f server.zip && cd server && npm install && zip -r ../server.zip . && cd ..
rm -f client.zip && cd client && npm install && zip -r ../client.zip . && cd ..
