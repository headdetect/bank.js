var bank = require('../bank.js');
var credentials = require('./credentials.json');

bank.prepare(credentials);

bank.getTransactions().done(function(res) {
   console.log(res);
});