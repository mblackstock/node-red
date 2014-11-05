var http = require('http');
var https = require('https');
var settings = require('./proxy-settings');
var proxy = require('./red/proxy');
var util = require('util');
var express = require('express');

// settings needed for the rest of the system

settings.uiPort = settings.uiPort||1880;
settings.uiHost = settings.uiHost||"0.0.0.0";
settings.httpNodeRoot = settings.httpNodeRoot||"/";

var app = express();

// create the server
if (settings.https) {
    server = https.createServer(settings.https,function(req,res){app(req,res);});
} else {
    server = http.createServer(function(req,res){app(req,res);});
}
server.setMaxListeners(0);

// set up the proxy
proxy.init(server, settings);

// add the proxy to the app - later we can change the path this way
app.use(proxy.app);

// todo: start listening on the web sockets port, then start up the web server
proxy.start().then(function() {
    server.listen(settings.uiPort, settings.uiHost, function() {
        process.title = 'node-red-proxy';
        util.log('[red] Node Red Proxy now running at '+getListenPath());
    });
});

function getListenPath() {
    var listenPath = 'http'+(settings.https?'s':'')+'://'+
                    (settings.uiHost == '0.0.0.0'?'127.0.0.1':settings.uiHost)+
                    ':'+settings.uiPort;
    listenPath += "/";

    return listenPath;
}
