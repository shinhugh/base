#!/bin/bash

rm -f server.zip && cd src/server && npm install && zip -r ../../server.zip . && cd ../..
rm -f client.zip && cd src/client && npm install && zip -r ../../client.zip . && cd ../..
