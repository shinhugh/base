#!/bin/bash

host_root="/usr/share/tomcat10/webapps"
context_path="/ROOT"
container_owner="tomcat10"
container_group="tomcat10"
artifact_id="account-service"
version="1.0"

mvn compiler:compile
if [[ "$?" -ne 0 ]]; then
  exit 1
fi
mvn resources:resources
if [[ "$?" -ne 0 ]]; then
  exit 1
fi
mvn war:exploded
if [[ "$?" -ne 0 ]]; then
  exit 1
fi
sudo rm -rf $host_root$context_path
sudo cp -r target/$artifact_id-$version $host_root$context_path
sudo chown -R $container_owner:$container_group $host_root$context_path
mvn clean:clean
