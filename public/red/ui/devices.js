/**
 * module for configuring node devices
 **/
RED.devices = (function() {

    $("#btn-set-device").on("click",function(e) {
        e.preventDefault();
        RED.view.state(RED.state.DEVICE_DRAWING);
    });

    // add devices to the list
    function init(onselect, devices) {

        var button = $("#btn-set-device");
        
        var topMenu = $("<ul/>",{class:"dropdown-menu"}).insertAfter(button);

        var item, link;
        var device;

        for (var i=0; i<devices.length; i++) {
            device = devices[i];
            item = $('<li></li>');
            // TODO: use D3 to associate data with the element rather than putting it in the id
            link = $('<a id="device.'+device.deviceId+'" href="#">'+device.label+'</a>').appendTo(item);
            link.click(function() {
                var devId = this.id.split('.')[1];
                onselect(devId);
            });
            item.appendTo(topMenu);
        }
    }
    return {
        init:init
    };
})();