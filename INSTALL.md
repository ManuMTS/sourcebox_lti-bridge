# How to Install Sourcebox LTI Bridge

1. install Sourcebox Sandbox from https://github.com/ebertmi/sourcebox-sandbox/blob/master/INSTALL.md
2. install mongoDB
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/
3. clone repository
```
git clone https://gitlab.com/tobik1234/sourcebox-lti_bridge.git
```
4. install dependencies
```
npm install
```
6. copy sample config
```
cp config/default.sample.json config/default.json
```
7. Adjust config file to your needs
