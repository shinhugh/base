#!/bin/bash

artifact_name="persistent-session-js-client"
rm -f $artifact_name.zip && cd src/main && npm install && zip -r ../../$artifact_name.zip . && cd ../..
