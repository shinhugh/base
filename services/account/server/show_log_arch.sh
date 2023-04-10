#!/bin/bash

# Tomcat on Arch Linux uses systemd logging

service="tomcat10"

sudo journalctl -u $service.service
