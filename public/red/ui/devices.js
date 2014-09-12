/**
 * module for configuring node devices
 **/
RED.devices = (function() {
    $("#btn-set-device").on("click",function(e) {
        e.preventDefault();
        RED.view.state(RED.state.DEVICE_DRAWING);
    });
})();