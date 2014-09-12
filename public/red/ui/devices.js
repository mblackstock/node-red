/**
 * module for configuring node devices
 **/
RED.devices = (function() {

    $("#btn-set-device").on("click",function(e) {
        e.preventDefault();
        RED.view.state(RED.state.DEVICE_DRAWING);
    });

    // add devices to the pop down
    function init(onselect, devices) {

        var topMenu = d3.select("#device-list");

        topMenu.selectAll('li')
            .data(devices)
            .enter().append('li').append('a').attr('href','#')
            .text(function (d){
                return d.label;
            })
            .on('click', function(d) {
                onselect(d);
            });
    }

    return {
        init:init
    };
})();