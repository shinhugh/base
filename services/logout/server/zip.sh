#!/bin/bash

artifact_name="logout-server"
rm -f $artifact_name.zip && cd src/main && npm install && zip -r ../../$artifact_name.zip . && cd ../..
