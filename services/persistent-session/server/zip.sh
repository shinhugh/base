#!/bin/bash

artifact_name="persistent-session-server"
rm -f $artifact_name.zip && cd src/main && npm install && zip -r ../../$artifact_name.zip . && cd ../..
