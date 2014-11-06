var when = require('when');

var userModule;

function moduleSelector(aSettings) {
    var toReturn;
    if (aSettings.userModule) {
        if (typeof aSettings.userModule === "string") {
            // TODO: allow storage modules to be specified by absolute path
            toReturn = require("./"+aSettings.userModule);
        } else {
            toReturn = aSettings.userModule;
        }
    } else {
        toReturn = require("./localfilesystem");
    }
    return toReturn;
}

var userModuleInterface = {
    init: function(settings) {
        try {
            userModule = moduleSelector(settings);
            // ensure we have an authenticate method at least, throws an error otherwise
            authenticateAvailable = userModule.hasOwnProperty("authenticate");
        } catch (e) {
            // bad module - no authenticate
            return when.reject(e);
        }
        return userModule.init(settings);
    },
    addUser: function(userinfo) {
        return userModule.addUser(userinfo);
    },
    authenticate: function(username, password) {
        return userModule.authenticate(username, password);
    },
    getUser: function(username) {
        return userModule.getUser(username);
    }
};

module.exports = userModuleInterface;
