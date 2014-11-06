var should = require("should");
var fs = require('fs-extra');
var path = require('path');
var bcrypt = require('bcrypt');

var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync('aMUSEment2', salt);

var localfilesystem = require("../../../red/users/localfilesystem");

var testUserMap = {"mike":{"password":hash, "fullName":"Mike Blackstock"}};

describe('red/users/localfilesystem', function() {
    var userDir = path.join(__dirname,".testUserHome");
    //var userDir = __dirname;
    beforeEach(function(done) {
        fs.remove(userDir,function(err) {
            fs.mkdir(userDir,done);
            var objLib = path.join(userDir,"lib","object");
            // fake user db
            fs.writeFileSync(path.join(userDir,"testUserFile.json"),
                JSON.stringify(testUserMap),'utf8');
        });
    });
    afterEach(function(done) {
        fs.remove(userDir,done);
    });

    it('should load user db',function(done) {

        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            localfilesystem.getUserMap().then(function(data) {
                done();
            }).otherwise(function(err) {
                done(err);
            });
        }).otherwise(function(err) {
             done(err);
        });
    });

    it('should authenticate valid user',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            localfilesystem.authenticate('mike','aMUSEment2').then(function(valid) {
                valid.should.eql(true);
                done();
            }).otherwise(function(err) {
                done(err);
            });
        }).otherwise(function(err) {
             done(err);
        });
    });

    it('should not authenticate invalid user',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            localfilesystem.authenticate('bob','aMUSEment2').then(function(valid) {
                valid.should.eql(false);
                done();
            }).otherwise(function(err) {
                done(err);
            });
        }).otherwise(function(err) {
             done(err);
        });
    });

    it('should get user that exists',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            localfilesystem.getUser('mike').then(function(user) {
                console.log(user);
                user.fullName.should.eql("Mike Blackstock");
                done();
            }).otherwise(function(err) {
                done(err);
            });
        }).otherwise(function(err) {
             done(err);
        });
    });

    it('should not get user that doesnt exist',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            localfilesystem.getUser('fred').then(function(user) {
                user.fullName.should.eql("Fred Flintstone");
                should.fail("fred doesn't exist");
            }).otherwise(function(err) {
                done(err);
            });
        }).catch(function(e) {
             done(err);
        });
    });
});
