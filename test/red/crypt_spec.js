var should = require("should");
var crypt = require("../../red/crypt");

var key = "mysecret";
var clearString = "SenseTecnic"
var encryptedString = "8963e638b2801ee143358f"

describe("red/crypt", function() {
    it('can be required without errors', function() {
        require("../../red/crypt");
    });
    //TODO: Must crypt and decrypt string
    it('can encrypt a string', function(){
        var c = crypt.encrypt(clearString, key);
        c.should.equal(encryptedString);
    });

    it('can decrypt a string', function(){
        var  s = crypt.decrypt(encryptedString, key);
        s.should.equal(clearString);
    });
});
