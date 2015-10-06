/**
* Copyright 2015 Sense Tecnic Systems, Inc.
*
* Utility functions.
*/
var crypto = require('crypto');
var algorithm = 'aes-256-ctr' ;

function encrypt(text, cryptoSecret) {
    if (!cryptoSecret) {
        return text;
    }
    var cipher = crypto.createCipher(algorithm,cryptoSecret);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text, cryptoSecret){
    if (!cryptoSecret) {
        return text;
    }
    var decipher = crypto.createDecipher(algorithm,cryptoSecret);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}


module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
};
