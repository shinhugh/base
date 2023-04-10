#!/bin/bash

host_root="/usr/share/tomcat10/webapps"
context_path="/test"
container_owner="tomcat10"
container_group="tomcat10"
artifact_id="user-account-service"
version="1.0"

mvn compiler:compile
if [[ "$?" -ne 0 ]]; then
  exit 1
fi
mvn war:war
if [[ "$?" -ne 0 ]]; then
  exit 1
fi
sudo rm -rf $host_root$context_path.war $host_root$context_path/
sudo cp target/$artifact_id-$version.war $host_root$context_path.war
sudo chown $container_owner:$container_group $host_root$context_path.war
mvn clean:clean
