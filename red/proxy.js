/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

 /**
  * Node-RED Instance Manager
  */

var express = require('express');
var path = require('path');
var when = require('when');
var users = require('./users');

var settings = null;
var server = null;
var app = null;

/**
 * create a node red user-authentication/proxy
 * 
 * @param {https.Server} _server server that receives HTTP
 * @param {Object} _settings to conigure the server
 */
function init(_server, _settings) {
    server = _server;
    settings = _settings;

    users.init(_settings).then(function() {
        // add a super user for testing
        users.addUser({username:"mike", password:"aMUSEment2", fullName:"Mike Blackstock"});
    });

    app = express();
    app.use(express.session({secret:"dnr secret"}));

    app.get("/flows",function(req,res) {

        console.log('get flows');

    });
        
    app.post("/flows", express.json(), function(req,res) {
        console.log('post flows');

        // get user info
        // look up node red instance
        // forward request and response
    });
            
    app.get("/nodes",function(req,res) {
        console.log('get nodes');

        // get user info
        // look up node red instance
        // forward request and response
    });
        
    app.post("/nodes", express.json(), function(req,res) {
        console.log('post nodes');

        // get user info
        // look up node red instance
        // forward request and response
    });
        
    app.delete("/nodes/:id", function(req,res) {
        console.log('delete node');

        // get user info
        // look up node red instance
        // forward request and response
    });
        
    app.get("/nodes/:id", function(req,res) {
        console.log('get node');

        // get user info
        // look up node red instance
        // forward request and response
    });
        
    app.put("/nodes/:id", express.json(), function(req,res) {
        console.log('update node');

        // get user info
        // look up node red instance
        // forward request and response
    });

    // simple login

    /**
     * middleware function to check whether user is authenticated yet
     */
    function checkAuth(req, res, next) {
        if (!req.session.username) {
            //res.send('You are not authorized to view this page');
            res.redirect('/login.html');
        } else {
            next();
        }
    }

    /**
     * handle login
     */
    app.post('/login', express.urlencoded(), function (req, res) {
      var post = req.body;
      users.authenticate(post.username, post.password).then(function(auth) {
        if (auth===true) {
            req.session.username = post.username;
        } else {
            // try again
            res.redirect('/login.html');
            return;
        }  
        res.redirect('/');
      });
    });

    /**
     * handle logout.
     */
    app.get('/logout', function (req, res) {
        delete req.session.username;
        res.redirect('/login.html');
    });      

    // ui related

    // Need to ensure the url ends with a '/' so the static serving works
    // with relative paths
    app.get("/",function(req,res) {

        if (req.originalUrl.slice(-1) != "/") {
            res.redirect(req.originalUrl+"/");
        } else {
            req.next();
        }
    });
    
    var iconCache = {};

    //TODO: create a default icon
    var defaultIcon = path.resolve(__dirname + '/../public/icons/arrow-in.png');
    
    app.get("/icons/:icon",function(req,res) {
        console.log('get icon');

        if (iconCache[req.params.icon]) {
            res.sendfile(iconCache[req.params.icon]);
            // if not found, express prints this to the console and serves 404
        } else { 
            for (var p=0;p<icon_paths.length;p++) {
                var iconPath = path.join(icon_paths[p],req.params.icon);
                if (fs.existsSync(iconPath)) {
                    res.sendfile(iconPath);
                    iconCache[req.params.icon] = iconPath;
                    return;
                }
            }
            res.sendfile(defaultIcon);
        }
    });
    
    // get settings - no need to contact node red instance
    // this is to check for login as well!
    app.get("/settings", function(req,res) {

        // Once the UI is up, it starts by getting settings.  If we are not
        // logged in, the UI will redirect us to the login page.
        // TODO: check sessions in the other AJAX calls.
        if (!req.session.username) {
            res.json({loggedIn:false});
        }
        users.getUser(req.session.username).then(function(userinfo){
            var safeSettings = {
                loggedIn: true,
                user:userinfo,
                httpNodeRoot: settings.httpNodeRoot,
                version: settings.version,
                deviceId: settings.deviceId,
                devices: settings.devices,
                masterDevice: settings.masterDevice
            };
            res.json(safeSettings);
        });
    });

    // for testing
    app.use("/index.html",checkAuth);
    app.use("/",express.static(__dirname + '/../public'));
 
}

/**
 * start the proxy server
 */
function start() {

    return when.promise(function(resolve, reject, notify) {
        console.log("\nWelcome to Node-RED Instance Manager\n===================\n");

        // ensure all of the instances are started.

        // start the web sockets proxy server.
        // start_ws_proxy()
        resolve();
    });
}

function stop() {
    stop_ws_proxy();
}

// private

/**
 * start the web sockets proxy
 */
function start_ws_proxy() {

    var webSocketKeepAliveTime = settings.webSocketKeepAliveTime || 15000;
    var path = settings.httpAdminRoot || "/";
    path = path + (path.slice(-1) == "/" ? "":"/") + "comms";
    wsServer = new ws.Server({server:server,path:path});
    
    wsServer.on('connection',function(ws) {
        // check we have a session
        // get the user from the session

        // create an instance if needed.  Once started...

        // create a client connection to the instance

        // client callback sends a message to the proxy client

        activeConnection.push({
            'ws':ws,
            'user':user,
            'instance':client_ws
        });

        ws.on('close',function() {

            // find the connection using the socket.

            // close the connection to the backend instance

            // delete the connection
            // for (var i=0;i<activeConnections.length;i++) {
            //     if (activeConnections[i] === ws) {
            //         activeConnections.splice(i,1);
            //         break;
            //     }
            // }
        });

        ws.on('message', function(data,flags) {
            // get the backend instance
            // send the message to the backend.

            // 
            // forward to the node-red instance
            var msg = null;
            try {
                msg = JSON.parse(data);
            } catch(err) {
                util.log("[red:comms] received malformed message : "+err.toString());
                return;
            }
        });
        ws.on('error', function(err) {
            util.log("[red:comms] error : "+err.toString());
        });
    });
        
    wsServer.on('error', function(err) {
        util.log("[red:comms] server error : "+err.toString());
    });

    // keep a heartbeat going as the regular comms server does
         
    lastSentTime = Date.now();
    
    heartbeatTimer = setInterval(function() {
        var now = Date.now();
        if (now-lastSentTime > webSocketKeepAliveTime) {
            publish("hb",lastSentTime);
        }
    }, webSocketKeepAliveTime);
}

/**
 * stop the web sockets proxy
 */
function stop_ws_proxy() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
    if (wsServer) {
        wsServer.close();
    }
}

/**
 * publish data to proxy subscribers.
 * 
 * @param {string} topic to publish to
 * @param {Object} data to publish
 * @param {boolean} retain true when we need to keep the last message for new subscribers
 */
function publish(topic,data,retain) {
    lastSentTime = Date.now();
    activeConnections.forEach(function(conn) {
        publishTo(conn.ws,topic,data);
    });
}

/**
 * send data to the specified connection
 *
 * @param {WebSocket} ws client websocket created when client connected
 * @param {string} topic
 * @param {Object} data to send
 */
function publishTo(ws,topic,data) {
    var msg = JSON.stringify({topic:topic,data:data});
    try {
        ws.send(msg);
    } catch(err) {
        util.log("[red:comms] send error : "+err.toString());
    }
}

module.exports = { 
    init: init,
    start: start,
    stop: stop
}

module.exports.__defineGetter__("app", function() { return app });

