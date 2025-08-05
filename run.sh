#!/bin/bash

export PUBLIC_IP=$(ip a | grep 'inet 10\.' | awk '{print $2}' | cut -d/ -f1 | head -n 1) && docker-compose -f .devcontainer/docker-compose.yml up --build