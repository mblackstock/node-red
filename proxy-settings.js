module.exports = {

    // this is the id of the local device for distributed flows
    deviceId: "server",

    // devices participating in a distributed flow
    devices: [{label:"Server", deviceId:"server"},
        {label:"Raspberry Pi", deviceId:"raspberry-pi"},
        {label:"Mac Laptop",deviceId:"mac"}
    ],

    masterDevice: "http://master-server/",

    // the  port that the proxy is listening on
    uiPort: 1880,

}