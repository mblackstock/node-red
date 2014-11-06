var path = require('path');
var when = require('when');
var fs = require('fs');
var nodefn = require('when/node');
var util = require('util');
var bcrypt = require('bcrypt');


var usermap = null;
var userFile = null;
var userDir;
var usersFullPath = null;
var settings = null;

/**
 * load user map from the file system
 */
function loadUsers() {
    return when.promise(function(resolve, reject, notify) {
        // already loaded?
        if (usermap !== null) {
            resolve(usermap);
        } else {
            fs.exists(usersFullPath, function(exists) {
                if (exists) {
                    util.log("[red] Loading users : "+userFile);
                    resolve(nodefn.call(fs.readFile,usersFullPath,'utf8').then(function(data) {
                        usermap = JSON.parse(data);
                        return usermap;
                    }));
                } else {
                    util.log("[red] Users file not found : "+userFile);
                    usermap = {};
                    resolve(usermap);
                }
            });  
        }           
    });
}

// TODO: save file map with new users

var localfilesystem = {

    init: function(_settings) {
        settings = _settings;
        userDir = settings.userDir || process.env.NODE_RED_HOME;
        userFile = settings.userFile || 'users_'+require('os').hostname()+'.json';
        usersFullPath = path.join(userDir,userFile);
        return loadUsers();
    },

    addUser: function(userinfo) {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(userinfo.password, salt);
        var newuser = {fullName:userinfo.fullName,password:hash};
        usermap[userinfo.username] = newuser;
        return when(newuser);
    },

    getUserMap: function() {
        return when(usermap);
    },

    authenticate: function(user, password) {
        return when.promise(function(resolve, reject, notify) {
            if (user in usermap) {
                var userinfo = usermap[user];
                bcrypt.compare(password, userinfo.password, function(err, res) {
                    resolve(res);
                });
            } else {
                resolve(false);
            }
        });
    },

    getUser: function(username) {
        var safeuser;
        if (username in usermap) {
            safeuser = {
                username:username,
                fullName:usermap[username].fullName
            }
        } else {
            return when.reject(new Error('no such user')); 
        }
        return when(safeuser);
    }
};

module.exports = localfilesystem;

