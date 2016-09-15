# sandbox-server for trycoding.io

## Install
1. You need to setup a sourcebox template container. Use the sourcebox utils for that.
2. `npm install`  the *sandbox-server*
3. `npm install -g pm2`

## Start Server
Start the server with: `sudo pm2 start process.json --env production`

### Debugging
Start the server with `sudo DEBUG=*.sourcebox pm2 start process.json --env production` to get all the debug outputs on the console.
