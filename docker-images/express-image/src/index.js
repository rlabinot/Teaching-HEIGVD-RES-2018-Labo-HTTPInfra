var Chance = require('chance');
var chance = new Chance();

var express = require('express');
var app = express();

app.get('/', function(req, res){
   res.send( generateAddresses());
});

app.get('/test', function(req, res){
   res.send("Hello RES - test is working");
});

app.listen(3000, function(){
   console.log('Accepting HTTP requests on port 3000');
});

function generateAddresses() {
   var numberOfAddresses = chance.integer({
      min: 0,
      max: 10
   });
   console.log(numberOfAddresses);
   var addresses = [];
   for(var i = 0; i < numberOfAddresses; ++i){

      addresses.push({
         address: chance.address(),
         phone: chance.phone({ country: 'fr' }),
         city: chance.city(),
         country: chance.country({ full: true })
      });
   };
   console.log(addresses);
   return addresses;
}