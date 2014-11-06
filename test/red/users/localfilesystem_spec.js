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
        return localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.getUserMap();
        }).then(function(data) {
            data.mike.fullName.should.eql('Mike Blackstock');
            done();
        }).catch(function(err){
            done(err);
        });
    });

    it('should add new user', function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.addUser({username:'betty', fullName:'Betty Rubble', password:'bedrock'});
        }).then(function(data) {
            return localfilesystem.authenticate('betty','bedrock');
        }).then(function(auth){
            auth.should.eql(true);
            done();
        }).otherwise(function(err) {
            done(err);
        });
    });

    it('should authenticate valid user',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.authenticate('mike','aMUSEment2');
        }).then(function(valid) {
            valid.should.eql(true);
            done();
        });
    });

    it('should not authenticate invalid user',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.authenticate('bob','aMUSEment2');
        }).then(function(valid) {
            valid.should.eql(false);
            done();
        });
    });

    it('should get user that exists',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.getUser('mike');
        }).then(function(user) {
            user.fullName.should.eql("Mike Blackstock");
            done();
        });
    });

    it('should not get user that doesnt exist',function(done) {
        localfilesystem.init({userDir:userDir, userFile:'testUserFile.json'}).then(function() {
            return localfilesystem.getUser('fred');
        }).then(function(user) {
            user.fullName.should.eql("Fred Flintstone");
            done(new Error('missing user found?'));
        }).catch(function(e) {
            // should fail here
            done();
        });
    });
});
