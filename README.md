Simple Micro Service Architecture

Backend : Python
Frontend : NextJS
Database : PostgreSQL

Architecture : Docker compose
Production : Docker swarm

Service : API, PostgreSQL, Adminer, NextJs web app.

To launch the the Docker network go to ARCHITECTURE/docker/README.md for documentation.

To access the API web interface go to :
http://localhost:8000

To access the Vercel frontend go to : 
http://localhost:3000/pages

To access the Database use adminer via :
http://localhost:8080

The secrets are given inside the docker-compose file in ARCHITECTURE/docker/compose.dev.yaml
=> The server name is the docker service name.

This is a template feel free to adapt it to your need; 
Some simple advise to start, create a .env file to enter secrets and open them inside the BACKEND_API/configuration.py file.

For the frontend I advise you to browse the Vercel template to copy one for a good start. 

For production uses the prod.Dockerfile for the frontend and not the dev.Dockerfile.




