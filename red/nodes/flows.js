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


function analyzeDistributedFlow(nodes) {
    'use strict';
    var replaced = false;
    var nId;        // current node id
    var n, nt, nn;  // current node, node type, new node
    var outWires;   // outgoing wires from the current node
    var targetId;   // id of outgoing wire
    var srcDeviceId, targetDeviceId; // deviceId of outgoing wire
    var i,j;        // loop counters
    var srcId;      // id of source node
    var srcN;       // source node
    var wireInList = [];
    var wireOutList = [];
    var deleteList = [];
    var topic;      // topic for in or out node

    util.log('[dist] analyzing all flows for distributed nodes')
    for (nId in nodes) {
        replaced = false;

        n = nodes[nId];        
        if (n.type != "placeholder") continue;

        // assume a placeholder node can be deleted unless: 
        // a - its connected to another node
        // b - an incoming or outgoing connection is on another device

        // first check the external device's node outgoing wires to see if it is connected to a node we are hosting.
        // if so, we'll need to replace this node with an incoming MQTT node
        util.log("[dist] checking outgoing wires of: "+nId);

        for (i=0; i<n.wires.length; i++) {
            outWires = n.wires[i];
            for (j=0; j<outWires.length; j++) {
                targetId = outWires[j];

                util.log("[dist] checking wire: "+i+" to node:"+targetId);

                targetDeviceId = nodes[targetId].deviceId || settings.deviceId;

                util.log("[dist] node id:"+n.deviceId+" target device id:"+targetDeviceId);

                // same device, we don't replace it
                if (targetDeviceId == n.deviceId)  continue;

                // replace node with incoming MQTT node
                nt = typeRegistry.get("wire in");
                try {
                    util.log("[dist] add "+nId +" to wire in list");
                    wireInList.push({"node":nId, "topic":n.id+"-"+i+"-"+targetId});
                }
                catch (err) {
                    util.log("[dist] error creating input wire: "+err);
                }
                replaced = true;         
            }
        }

        if (replaced)
            continue;   // get the next placeholder node

        // so check all nodes to see if they have a wire connected to this placeholder
        // from an external device.  If so, we cannot delete it and need a wire
        util.log("[dist] checking for wires into "+nId)
        for (srcId in nodes) {
            srcN = nodes[srcId];
            if (srcN.id == n.id) continue;
            if (srcN.wires.length == 0) continue;

            // source and destination on same id, so we can delete it
            srcDeviceId = srcN.deviceId || settings.deviceId;
            if (srcDeviceId == n.deviceId) continue;

            util.log("[dist] src "+srcN.id );

            // devices are different, check if src connected to placeholder
            for (i=0; i<srcN.wires.length; i++) {
                outWires = srcN.wires[i];
                for (j=0; j<outWires.length; j++) {
                    targetId = outWires[j];      
                    if (targetId != n.id) continue;

                    util.log("[dist] src "+srcN.id+' is connected to '+n.id);
                    // replace node with outgoing MQTT node (to the device)
                    nt = typeRegistry.get("wire out");
                    try {
                        util.log("[dist] add "+nId +" to wire out list");
                        wireOutList.push({"node":nId, "topic":srcId+"-"+i+"-"+nId});
                    }
                    catch (err) {
                        util.log("[dist] creating output wire: "+err);
                    }
                    replaced = true;
                }
            }
        }
    
        // we're not connected so delete the node - its an internal node, or not connected to anything.
        if (!replaced) {
            util.log("[dist] deleting inner node: "+nId);
            deleteList.push(nId);
        }
    }

    // now update the nodes, first deleting
    for (i=0; i<deleteList.length; i++) {
        nId = deleteList[i];
        util.log('[dist] deleting node '+nId);
        delete nodes[nId];
    }
    nt = typeRegistry.get("wire out");
    for (i=0; i<wireOutList.length; i++) {
        nId = wireOutList[i].node;
        topic = wireOutList[i].topic;

        n = nodes[nId];        
        util.log('[dist] replacing node '+nId+' with wire out node on topic '+topic);

        nn = new nt({"id":n.id, "topic":topic, "deviceId":n.deviceId, "wires":n.wires});
        nodes[nId] = nn;
    }

    nt = typeRegistry.get("wire in");
    for (i=0; i<wireInList.length; i++) {
        nId = wireInList[i].node;
        topic = wireInList[i].topic;

        n = nodes[nId];        
        util.log('[dist] replacing node '+nId+' with wire in node on topic '+topic);

        nn = new nt({"id":n.id, "topic":topic, "deviceId":n.deviceId, "wires":n.wires});
        nodes[nId] = nn;
    }
}

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
        if (type != "workspace" && type != "tab" && type != "devicebox") {
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

            util.log("creating node "+activeConfig[i].id+":"+activeConfig[i].name+':'+nodeDeviceId);

            // create a placeholder node if the node is on another device
            if (nodeDeviceId != settings.deviceId) {
                util.log("[dist] adding placeholder node for "+activeConfig[i].id+" on device "+nodeDeviceId);
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

    analyzeDistributedFlow(nodes);

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
