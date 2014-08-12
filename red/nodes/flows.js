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

var util = require("util");
var when = require("when");

var typeRegistry = require("./registry");
var credentials = require("./credentials");
var log = require("../log");
var events = require("../events");

var storage = null;
var settings = null;

var nodes = {};
var activeConfig = [];
var missingTypes = [];

events.on('type-registered',function(type) {
        if (missingTypes.length > 0) {
            var i = missingTypes.indexOf(type);
            if (i != -1) {
                missingTypes.splice(i,1);
                util.log("[red] Missing type registered: "+type);
                if (missingTypes.length === 0) {
                    parseConfig();
                }
            }
        }
});

/**
 * Parses the current activeConfig and creates the required node instances
 */ 
function parseConfig() {
    var i;
    var j;
    var nt;
    missingTypes = [];
    
    // Scan the configuration for any unknown node types
    for (i=0;i<activeConfig.length;i++) {
        var type = activeConfig[i].type;
        // TODO: remove workspace in next release+1
        if (type != "workspace" && type != "tab") {
            nt = typeRegistry.get(type);
            if (!nt && missingTypes.indexOf(type) == -1) {
                missingTypes.push(type);
            }
        }
    }
    // Abort if there are any missing types
    if (missingTypes.length > 0) {
        util.log("[red] Waiting for missing types to be registered:");
        for (i=0;i<missingTypes.length;i++) {
            util.log("[red]  - "+missingTypes[i]);
        }
        return;
    }

    util.log("[red] Starting flows");
    events.emit("nodes-starting");
    
    // Instantiate each node in the flow
    for (i=0;i<activeConfig.length;i++) {
        var nn = null;
        // TODO: remove workspace in next release+1
        if (activeConfig[i].type != "workspace" && activeConfig[i].type != "tab") {
            
            // what device and node type
            var nodeDeviceId = activeConfig[i].deviceId || settings.deviceId;
            var nodeType = activeConfig[i].type;

            util.log("creating node "+activeConfig[i].id+":"+activeConfig[i].name);

            // create a placeholder node if the node is on another device
            if (nodeDeviceId != settings.deviceId) {
                util.log("adding placeholder node for "+activeConfig[i].id+" on device "+nodeDeviceId);
                // create a placeholder for the external node
                nodeType = "placeholder";
            }

            // get the node type constructor
            nt = typeRegistry.get(nodeType);
            if (nt) {
                try {
                    nn = new nt(activeConfig[i]);
                }
                catch (err) {
                    util.log("[red] "+nodeType+" : "+err);
                }
            }
            // console.log(nn);
            if (nn === null) {
                util.log("[red] unknown type: "+nodeType);
            }
        }
    }

    util.log('[red] analyzing all flows for distributed nodes')
    for (nId in nodes) {
        var n = nodes[nId];
        util.log("[red] node id: "+nId+" type:"+n.type);
        if (n.type != "placeholder") {
            continue;
        }

        // assume a placeholder node can be deleted unless: 
        // a - its connected to another node
        // b - an incoming or outgoing connection is on another device

        // first check the external device's node outgoing wires to see if it is connected to a node we are hosting.
        // if so, we'll need to replace this node with an incoming MQTT node
        util.log("[red] checking "+n.wires.length+" wires of: "+nId+" type:"+n.type);

        for (i=0; i<n.wires.length; i++) {
            var outWires = n.wires[i];
            for (j=0; j<outWires.length; j++) {
                var targetId = outWires[j];                
                util.log("[red] checking wire: "+i+" id:"+targetId);

                var targetDeviceId = nodes[targetId].deviceId || settings.deviceId;

                if (targetDeviceId != n.deviceId) {
                    // replace node with incoming MQTT node
                    var nt = typeRegistry.get("wire in");
                    if (nt) {
                        try {
                            nn = new nt({"id":n.id, "deviceId":n.deviceId, "wires":n.wires});
                            nodes[nId] = nn;
                        }
                        catch (err) {
                            util.log("[red] creating input wire: "+err);
                        }
                    }
                    return;
                }             
            }
        }

        // we haven't returned yet, so now check to see if we need an outgoing node

        // check all nodes to see if they have a wire connected to this placeholder
        // from an external device.  If so, we cannot delete it and need a wire
        for (srcId in nodes) {
            srcN = nodes[srcId];
            // skip the target
            if (srcN.id == n.id) continue;
            // source and destination on same id, so we can delete it
            var srcDeviceId = srcN.deviceId || settings.deviceId;
            if (srcDeviceId == n.deviceId) continue;
            debugger;

            // devices are different, check if connected
            for (var i=0; i<srcN.wires.length; i++) {
                // replace node with outgoing MQTT node (to the device)
                var nt = typeRegistry.get("wire out");
                if (nt) {
                    try {
                        nn = new nt({"id":n.id, "deviceId":n.deviceId, "wires":n.wires});
                        nodes[nId] = nn;
                    }
                    catch (err) {
                        util.log("[red] creating output wire: "+err);
                    }
                }
                return;
            }
        }
    
        // we're not connected so delete the node - its an internal node, or not connected to anything.
        if (deleteNode) {
            util.log("deleting inner node: "+nId);
            delete nodes[nId];
        }
    }

    // Clean up any orphaned credentials
    credentials.clean(flowNodes.get);
    events.emit("nodes-started");
}

/**
 * Stops the current activeConfig
 */
function stopFlows() {
    if (activeConfig&&activeConfig.length > 0) {
        util.log("[red] Stopping flows");
    }
    return flowNodes.clear();
}

var flowNodes = module.exports = {
    init: function(_storage, _settings) {
        storage = _storage;
        settings = _settings;
    },
    
    /**
     * Load the current activeConfig from storage and start it running
     * @return a promise for the loading of the config
     */
    load: function() {
        return storage.getFlows().then(function(flows) {
            return credentials.load().then(function() {
                activeConfig = flows;
                if (activeConfig && activeConfig.length > 0) {
                    parseConfig();
                }
            });
        }).otherwise(function(err) {
            util.log("[red] Error loading flows : "+err);
        });
    },
    
    /**
     * Add a node to the current active set
     * @param n the node to add
     */
    add: function(n) {
        nodes[n.id] = n;
        n.on("log",log.log);
    },
    
    /**
     * Get a node
     * @param i the node id
     * @return the node
     */
    get: function(i) {
        return nodes[i];
    },
    
    /**
     * Stops all active nodes and clears the active set
     * @return a promise for the stopping of all active nodes
     */
    clear: function() {
        return when.promise(function(resolve) {
            events.emit("nodes-stopping");
            var promises = [];
            for (var n in nodes) {
                if (nodes.hasOwnProperty(n)) {
                    try {
                        util.log("stopping node:"+nodes[n].id);
                        var p = nodes[n].close();
                        if (p) {
                            promises.push(p);
                        }
                    } catch(err) {
                        nodes[n].error(err);
                    }
                }
            }
            when.settle(promises).then(function() {
                events.emit("nodes-stopped");
                nodes = {};
                resolve();
            });
        });
    },
    
    /**
     * Provides an iterator over the active set of nodes
     * @param cb a function to be called for each node in the active set
     */
    each: function(cb) {
        for (var n in nodes) {
            if (nodes.hasOwnProperty(n)) {
                cb(nodes[n]);
            }
        }
    },

    /**
     * @return the active configuration
     */
    getFlows: function() {
        return activeConfig;
    },
    
    /**
     * Sets the current active config.
     * @param config the configuration to enable
     * @return a promise for the starting of the new flow
     */
    setFlows: function (config) {
        // Extract any credential updates
        for (var i=0; i<config.length; i++) {
            var node = config[i];
            if (node.credentials) {
                credentials.extract(node);
                delete node.credentials;
            }
        }
        return credentials.save()
            .then(function() { return storage.saveFlows(config);})
            .then(function() { return stopFlows();})
            .then(function () {
                activeConfig = config;
                parseConfig();
            });
    },
    stopFlows: stopFlows
};
