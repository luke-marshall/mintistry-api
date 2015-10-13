var web3 = require('web3');
var http = require('http');
var url = require("url");
var utils = require('./utils.js');
var fs = require('fs');
var contractFactory = require('contractFactory');

//test request:
// http://127.0.0.1:1337/transferCoin
function handle(req, res){
  var params = {};
  utils.getParams(req, validateRequest);

  function validateRequest(error, parameters){
    params = parameters;
    if(error){
      utils.unprocessableEntityError(req, error);
    }else if(!params['sender_addr'] || !params['sender_password'] || !params['receiver_addr'] || !params['coin_addr'] || !params['api_key']){ //make sure the corract parameters are present
      utils.unprocessableEntityError(res, "Required parameters not supplied. Requires sender_addr, receiver_addr, sender_password, coin_addr, api_key.");
    } else if(!utils.verify_key(params['api_key'])){ //verify the api key
      utils.unprocessableEntityError(res, "API Key is invalid.")
    }else{
      start();
    }
  }

  function start(){
    contractFactory.getAbi(initialiseTransfer);
  }

  function initialiseTransfer(error, abi){
    var duration = 300;
    web3.personal.unlockAccount(params['sender_addr'], params['sender_password'], duration);
    var contract = web3.eth.contract(abi).at(params['coin_addr']);

    var transaction = {
      from : params['sender_addr'],
    }
    contract.send.sendTransaction(params['receiver_addr'], parseInt(params['amount']), params['sender_addr'] ,transaction, generateResponse);
  }

  function generateResponse(error, success){
    if(!error){
      console.log('callback returned: '+success);

      if(success == 1){
        response = {
          success : true,
          message : "Successfully transferred coin.",
          sender_addr : params['account_addr'],
          receiver_addr : params['receiver_addr'],
          coin_addr : params['coin_addr'],
        }
      }else{
        response = {
          success : false,
          message : "Could not transfer coin. Ensure account balances are sufficient.",
          sender_addr : params['account_addr'],
          receiver_addr : params['receiver_addr'],
          coin_addr : params['coin_addr'],
        }
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify(response));
      res.end('\n');
    }else{
      utils.internalServerError(res, error)
    }
  }
}


module.exports.handle = handle;