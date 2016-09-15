var Server = require('@sourcebox/web');
var Sourcebox = require('@sourcebox/sandbox');
var http = require('http');
var express = require('express');
var jwt = require('jsonwebtoken');
var Config = require('config');
var cors = require('cors');

var app = express();

if (Config.server.serveStatic === true) {
    app.use(express.static('public'));
}

app.use(cors());

var httpServer = http.createServer(app);

// Create Sourcebox instance, reference to the lxc template container
var source = new Sourcebox(Config.sourcebox.loopMount, Config.sourcebox.limits);

// Creates the Sourcebox "Server": Websocket backend which bootstraps the container
var sourceboxServer = new Server(source, {
  sessionTimeout: 5000,
  auth: function (socket, token) {
    var user = jwt.verify(token, Config.auth.secret);
    return user.username || socket.handshake.address;
  },
  io: Config.sourcebox.io
});

sourceboxServer.attach(httpServer);
httpServer.listen(Config.server.port);
