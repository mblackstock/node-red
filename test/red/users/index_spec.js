var should = require("should");

describe("red/storage/index", function() {
    
    it('rejects the promise when settings suggest loading a bad module', function(done) {
        
        var wrongModule = {
                storageModule : "thisaintloading"
        };
        
        var storage = require("../../../red/users/index");
       storage.init(wrongModule).then( function() {
           var one = 1;
           var zero = 0;
           try {
               zero.should.equal(one, "The initialization promise should never get resolved");   
           } catch(err) {
               done(err);
           }
       }).catch(function(e) {
           done(); //successfully rejected promise
       });
    });
});