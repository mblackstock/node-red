# WoT-Flow: a distributed Node-RED

Node-RED is a visual tool for wiring the Internet of Things.  WoTFlow extends Node-RED to support distributed flows in a simple way.  This code is work in progress.

It adds the following functionality:
* settings to specify the devices participating in a flow, e.g. server, desktop, raspberry-pi
* settings to specify the local device id
* a way of associating nodes with a device visually
* mechanism for downloading the distributed flow from a 'master' device such as a cloud server.
* during the parsing and configuration process, replace wires to nodes on other devices with connection to an MQTT server.

For more information, see our presentation at WoT 2014.  Watch this space for more information on how to configure and run the system.  In the meantime, feel free to contact mike at sensetecnic.com for more info.

(The rest of this documentation is from the Node-RED README.)

## Quick Start

Check out [INSTALL](INSTALL.md) for full instructions on getting started.

1. git clone
2. cd node-red
3. npm install
4. node red.js
5. Open <http://localhost:1880>

## Documentation

Documentation on Node-RED can be found [here](http://nodered.org/docs).

For further help, or general discussion, there is also a [mailing list](https://groups.google.com/forum/#!forum/node-red).

## Browser Support

The Node-RED editor runs in the browser. We routinely develop and test using
Chrome and Firefox. We have anecdotal evidence that it works in IE9.

We do not yet support mobile browsers, although that is high on our priority
list.

## Contributing

Please see our [contributing guide](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md).

## Authors

Node-RED is a creation of [IBM Emerging Technology](http://ibm.com/blogs/et).

* Nick O'Leary [@knolleary](http://twitter.com/knolleary)
* Dave Conway-Jones [@ceejay](http://twitter.com/ceejay)

For more open-source projects from IBM, head over [here](http://ibm.github.io).

## Copyright and license

Copyright 2013, 2014 IBM Corp. under [the Apache 2.0 license](LICENSE).
