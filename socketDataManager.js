var request = require('request');
var Repeat = require('repeat');
var debug = require('debug')('lisk-listen:socket');
var config = require('config');

// Keep track of the chat clients
var clients = [];


/* ***************************
*  Bittrex Ticker BTC - LSK
** *************************** */

var urlBittrekTicker = config.get("bittrex-ticker.url");

var bittrexTicker = function() {
  request( { url: urlBittrekTicker, json: true},
           function (errorTicker, responseTicker, bodyTicker) {
              if (!errorTicker && responseTicker.statusCode === 200 && bodyTicker.success) {
                  if("result" in bodyTicker)
                  {
                    debug('New Ticker BTC-LSK: ' + bodyTicker.result.Last);
                    broadcast("Bittrex-BTC-LSK-Ticker", bodyTicker.result);
                  }
              }
        });
}

if(config.get("bittrex-ticker.enable")){
  var every = config.get("bittrex-ticker.every");
  debug('Bittrex Ticker Enabled. Starting polling every ' + every + ' seconds');
  new Repeat(bittrexTicker).every(every, 's').start.now();
}
else
  debug('Bittrex Ticker Disabled.');

/* ***************************
*  Lisk.io Block and Transactions Pusher
** *************************** */

var dposAPI = require('dpos-api-wrapper').dposAPI;
dposAPI.nodeAddress= config.get("lisk.url");

var blockIndex = -1;

var bootstrapLastBlock = function() {

    debug('Start Lisk Block Parser');
    //First Run
    debug('First run... retrieving Block Height');

    dposAPI.blocks.getHeight()
    .then(
      function (response) {
       if (response.success) {
           debug("Last Block Height is: " + response.height)
           blockIndex = response.height;

           var everyForLisk = config.get("lisk.every");

           new Repeat(function() {
             processBlock(blockIndex);
           }).every(everyForLisk, 's').start.now();

       }
       else {
         debug("Lisk getHeight Error.");
       }

   }).catch(error => {
     // Will not execute
     debug('ERROR: DposAPI getHeight Exception caught', error.message);
   });

}

var intervalObj;
bootstrapLastBlock();

function processBlock(height)
{
  if(blockIndex == -1)
    return;

  clearInterval(intervalObj);

  debug('[ ' + height + ' ] Processing Block');
  var blockInfo;

  dposAPI.blocks.getBlocks({"height": height})
    .then(
      function (responseBlocks) {
         if (!responseBlocks.success)
           debug('Error during getBlocks.');
        else if(responseBlocks.success && responseBlocks.count <= 0)
           debug('[ ' + height + ' ] not mined yet.');
        else {

           debug('[ ' + height + ' ] get Mined!' );
           blockInfo = responseBlocks.blocks[0];

           //Retrieve Delegate name
           dposAPI.delegates.getByPublicKey(blockInfo.generatorPublicKey)
           .then(
             function(responseDelegate) {
               if(!responseDelegate.success)
                 debug('Error during delegate Retrieve.');
               else {
                 blockInfo.delegate = responseDelegate.delegate;
                 processTransactions(blockInfo, height);
               }
             }
            ).catch(error => {
              debug('ERROR: DposAPI getByPublicKey Exception caught', error.message);
            });
         }
       }
  ).catch(error => {
    debug('ERROR: DposAPI getBlocks Exception caught', error.message);
  });
}

function processTransactions(blockInfo, height) {
  if(blockInfo.numberOfTransactions <= 0)
  {
      debug('[ ' + height + ' ] No transaction to retrieve!' );
      finalizeBlockProcess(blockInfo);
  } else {

    debug('[ ' + height + ' ] Retrieveing transactions!' );

    dposAPI.transactions.getList({"blockId": blockInfo.id})
    .then(
      function (responseTransactions) {
         if (responseTransactions.success && responseTransactions.count > 0) {
             debug('[ ' + height + ' ] ' + responseTransactions.count + ' Transactions Retrieved');

             blockInfo.transactions = responseTransactions.transactions;
             finalizeBlockProcess(blockInfo);
         }
       }
    ).catch(error => {
       debug('ERROR: DposAPI getList Exception caught', error.message);
    });

  }
}

function finalizeBlockProcess(blockMessage) {
  broadcast("Lisk-NewBlock", blockMessage);
  blockIndex = blockIndex + 1;
}

// Send a message to all clients
function broadcast(topic, message) {
  clients.forEach(function (socket) {
    socket.emit(topic, message);
  });
}

exports.addClient = function(socket) {
  clients.push(socket);
}

exports.removeClient = function(socket) {
  clients.splice(clients.indexOf(socket), 1);
}
