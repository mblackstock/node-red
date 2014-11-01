# Distributed Node-RED

Node-RED is a visual tool for wiring the Internet of Things.  The Distributed Node-RED (DNR) project extends Node-RED to support flows that can be distributed between devices.  This code is work in progress.

DNR adds the following functionality to Node-RED:

* settings to specify the devices participating in a flow, e.g. server, desktop, raspberry-pi, and the local device id.
* a way of associating nodes with a device visually using a *device box* tool.
* mechanism for downloading the distributed flow from a 'master' device such as a cloud server.
* during the flow parsing process, replaces wires between nodes on other devices with connection to an MQTT server transparently.

For more information on our initial ideas, see my [presentation](http://www.slideshare.net/MichaelBlackstock/wo-t-2014-blackstock-2) and assocated [paper](http://www.webofthings.org/wp-content/uploads/2009/07/wot20140_submission_1.pdf) presented at the [Web of Things 2014 workshop](http://www.webofthings.org/events/wot/). Watch this space for more information on how to configure and run the system.

In the meantime, feel free to contact [@mblackstock](http://twitter.com/mblackstock) for more info.

## Quick Start

Installing on an individual device (laptop, server, raspberry-pi) is the same as standard Node-RED.

Check out [INSTALL](INSTALL.md) for full instructions on getting started with Node-RED.

1. git clone
2. cd node-red
3. npm install
4. node red.js
5. Open <http://localhost:1880>

Documentation on Node-RED can be found [here](http://nodered.org/docs/).

## Distributed Flows

### Setting up Participating Devices

Currently devices participating in a flow need to be set up manually.  To get started, we'll assume you have 3 devices:

* *raspberry-pi* - a rpi device containing an LED and a switch
* *mac* - a mac laptop
* *server* - a server hosted somewhere

In the `settings.js` file for each device, configure the local `deviceId`, and create a list of all of the devices participating in the flow.  You may want to set the URL of the master DNR instance that hosts the flow for all devices.  This will save you typing it in when you import the master flow to other devices.

```
    // this is the id of the local device for distributed flows
    deviceId: "mac",

    // devices participating in a distributed flow
    devices: [{label:"Server", deviceId:"server"},
        {label:"Raspberry Pi", deviceId:"raspberry-pi"},
        {label:"Mac Laptop",deviceId:"mac"}
    ],

    // this is the URL of the device that hosts the master flow - usually the server
    masterDevice: "http://master-server/",
```

DNR currently assumes there is an MQTT server reachable by all of the devices used for brokering communications.  For demonstrations you can probably use the public [test mosquitto server](http://test.mosquitto.org/), but you should probably set up your own, perhaps on the server device.  If you need to change the broker you will need to change the broker hand host fields in [`dist-wire.js`](nodes/dist/dist-wire.js).

```
var MQTT_BROKER_CONFIG = {
        "broker":"test.mosquitto.org",
        "port":1883,
        "clientid":"",
        "username":"",
        "password":""
    };
```

### Creating a Distributed Flow

Creating a distributed flow involves assigning nodes to devices, then downloading the distributed
flow to the devices.  To do this, we have added a *device box* tool to the system and a new *master flow import* function.

#### Designing the flow

First, draw the flow on the master device, in this case the server.  Then, assign nodes to devices using the device box tool as follows:

* Click on **Set Device** in the top left corner of the UI.
* Select the device that you would like to assign nodes to; in our case server, raspberry-pi or mac.
* Click and drag the mouse over the nodes that you want to assign to the selected device to create a device box.

If you make a mistake, click on the device box you created, hit the delete button and try again.  The device box gives a visual indication of where nodes will be hosted, and is saved with the flow.

***NOTE:*** *Currently you cannot move or resize a device box.*

To ensure a node has been assigned to a device correctly, click on a node, and view its `deviceId` in the **Info** pane on the right.  The deviceId is used by the system to parse flows on every device.

#### Importing the flow

Once the flow is ready, download it to participating devices using the Master Device import function

* Click on the menu drop down on the top right
* Click on the **Import...** menu item
* Click on **Master Device...** 

Set the URL to the server device hosting the distributed flow.  Click on **OK**.

The flow should be downloaded to the device.  Repeat this procedure to import the distributed flow on all participating devices.

Deploy the flow on all devices by hitting the **Deploy** button.  The flow should execute on devices transparently communicating between them using the MQTT server configured in the `wire` node in [`dist-wire.js`](nodes/dist/dist-wire.js).

#### Example Flow

***TODO: example flow with pictures*
**

## Support

For support or questions related to DNR, please contact [@mblackstock](http://twitter.com/mblackstock).

For further help, or general discussion related to Node-RED, there is also a [mailing list](https://groups.google.com/forum/#!forum/node-red).

## Browser Support

The Node-RED editor runs in the browser. We routinely develop and test using
Chrome and Firefox. We have anecdotal evidence that it works in IE9.

We do not yet support mobile browsers, although that is high on our priority
list.

## Contributing

Please see our [contributing guide](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md).

## Authors

DNR is an extension of Node-RED by Mike Blackstock [@mblackstock](http://twitter.com/mblackstock)

Node-RED is a creation of [IBM Emerging Technology](http://ibm.com/blogs/et).

* Nick O'Leary [@knolleary](http://twitter.com/knolleary)
* Dave Conway-Jones [@ceejay](http://twitter.com/ceejay)

For more open-source projects from IBM, head over [here](http://ibm.github.io).

## Copyright and license

Copyright 2013, 2014 IBM Corp. under [the Apache 2.0 license](LICENSE).
