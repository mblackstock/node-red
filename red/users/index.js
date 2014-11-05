var when = require('when');

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
            // ensure we have an authenticate method at least
            authenticateAvailable = userModule.hasOwnMethod("authenticate");
        } catch (e) {
            return when.reject(e);
        }
        return userModule.init(settings);
    },
    authenticate: function(username, password) {
        return userModule.authenticate(username, password);
    },
    getUser: function(username) {
        return userModule.getUser(username);
    }
};

module.exports = userModuleInterface;
