#!/bin/bash

artifact_name="account-service"
rm -f $artifact_name.zip && cd src/main && npm install && zip -r ../../$artifact_name.zip . && cd ../..
