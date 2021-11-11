# Readme

## Kurzbeschreibung

Dokumentation der Schnittstelle von der Sourcebox an eine Lernplatform mit der LTI Schnittstellt

## Install

see INSTALL.md for install instructions

## Run

1. Generate static files
```
node_modules/grunt/bin/grunt build
```
2. Run Server
```
sudo node src/server/server.js
```
If there are any problems you can start it in debug mode to see debug messages:

Only sourcebox debug messages:
```
sudo DEBUG=sourcebox:* node src/server/server.js
```
All debug messages:
```
sudo DEBUG=* node src/server/server.js
```
3. Run via task manager

If everything works as aspected, you can use a task manager to start it permanent
```
sudo pm2 start process.json --env production
```

stop server with
```
sudo pm2 stop all
```

## Test

Modultests:

```
npm test
```

Integrationstests
Install Nightwatch from http://nightwatchjs.org/ and run
```
nightwatch
```


## HowTo

### Auf Mongo Datenbank zugreigen

Um vom entfernten Rechner auf die Mongo Datenbank zugreifen zu können, muss eine Portweiterleitung per SSH eingestellt werden:

```
ssh -fN -l user -L 9999:localhost:27017 <server>
```

Anschließend kann per Port 9999 auf den Server zugegriffen werden.