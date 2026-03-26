# How to launch the Dockers ?

Install docker desktop on your windows.
Connect it to your wsl intallation.

You can now write 

```bash
sudo docker-compose -f compose.dev.yaml up -d --build
```

It will download and build all of the container.
If you want to rebuild a specific container you can simply add it's name at the end like :

```bash
sudo docker-compose -f compose.dev.yaml up -d --build "service-name"
```

To start a programm without rebuilding it enter : 

```bash
sudo docker-compose -f compose.dev.yaml up -d "service-name"
```



