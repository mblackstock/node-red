/**
 * Copyright 2014 Sense Tecnic Systems, Inc.
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
 * PlaceholderNode acts as a placeholder for distributed nodes until we determine which ones
 * we need to replace with MQTT nodes (edge) or drop (inner).
 **/
module.exports = function(RED) {
    "use strict";
    function PlaceholderNode(n) {
        RED.nodes.createNode(this,n);
        // keep track of what the type was before we replaced it.
        this.oldType = this.type;
        this.type = "placeholder";
        this.deviceId = n.deviceId;
    }
    RED.nodes.registerType("placeholder",PlaceholderNode);
}