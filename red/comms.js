/**
 * Copyright 2014 IBM Corp.
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

var ws = require("ws");
var util = require("util");

var server;
var settings;

var wsServer;
var activeConnections = [];

var retained = {};

var heartbeatTimer;
var lastSentTime;


function init(_server,_settings) {
    server = _server;
    settings = _settings;
}

function start() {

    if (!settings.disableEditor) {
        var webSocketKeepAliveTime = settings.webSocketKeepAliveTime || 15000;
        var path = settings.httpAdminRoot || "/";
        path = path + (path.slice(-1) == "/" ? "":"/") + "comms";
        wsServer = new ws.Server({server:server,path:path});
        
        wsServer.on('connection',function(ws) {
            activeConnections.push(ws);
            ws.on('close',function() {
                for (var i=0;i<activeConnections.length;i++) {
                    if (activeConnections[i] === ws) {
                        activeConnections.splice(i,1);
                        break;
                    }
                }
            });
            ws.on('message', function(data,flags) {
                var msg = null;
                try {
                    msg = JSON.parse(data);
                } catch(err) {
                    util.log("[red:comms] received malformed message : "+err.toString());
                    return;
                }
                if (msg.subscribe) {
                    handleRemoteSubscription(ws,msg.subscribe);
                }
            });
            ws.on('error', function(err) {
                util.log("[red:comms] error : "+err.toString());
            });
        });
        
        wsServer.on('error', function(err) {
            util.log("[red:comms] server error : "+err.toString());
        });
         
        lastSentTime = Date.now();
        
        heartbeatTimer = setInterval(function() {
            var now = Date.now();
            if (now-lastSentTime > webSocketKeepAliveTime) {
                publish("hb",lastSentTime);
            }
        }, webSocketKeepAliveTime);
    }
}

function stop() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
    if (wsServer) {
        wsServer.close();
    }
}

/**
 * publish data to subscribers.
 * 
 * @param {string} topic to publish to
 * @param {Object} data to publish
 * @param {boolean} retain true when we need to keep the last message for new subscribers
 */
function publish(topic,data,retain) {
    if (retain) {
        retained[topic] = data;
    } else {
        delete retained[topic];
    }
    lastSentTime = Date.now();
    activeConnections.forEach(function(conn) {
        publishTo(conn,topic,data);
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

/**
 * handle remote subscription to a topic by sending any retained data
 * to the new subscriber
 * @param {WebSocket} ws client websocket
 * @param {string} topic
 */
function handleRemoteSubscription(ws,topic) {
    // escape topic characters used in regular expressions and make into a regex check
    var re = new RegExp("^"+topic.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
    for (var t in retained) {
        if (re.test(t)) {
            publishTo(ws,t,retained[t]);
        }
    }
}


module.exports = {
    init:init,
    start:start,
    stop:stop,
    publish:publish,
}
