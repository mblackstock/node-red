RED.tools = (function() {
    $("#btn-set-device").on("click",function(e) {
        e.preventDefault();
        RED.view.state(RED.state.DEVICE_DRAWING);
    });
    $("#btn-select").on("click",function(e) {
        e.preventDefault();
        alert("set select");
    });
})();