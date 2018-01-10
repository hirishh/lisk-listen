var request = require('request');
var Repeat = require('repeat');
var debug = require('debug')('lisk-listen:socket');
var config = require('config');
var dposAPI = require('dpos-api-wrapper').dposAPI;
dposAPI.nodeAddress= config.get("lisk.url");

// Keep track of the chat clients
var clients = [];

// Send a message to all clients
var broadcast = function(topic, message) {
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

exports.getClientsCount = function() {
  return clients.length;
}


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
*  Lisk.io Donations
** *************************** */
var donations = [];
var donationAddress= config.get("lisk.donationAddress");

var processDonation = function(tx, isBcast) {
  if(tx.senderId == donationAddress || tx.senderId == "17670127987160191762L") return;
  //Retrieve Delegate name
  dposAPI.delegates.getByPublicKey(tx.senderPublicKey)
  .then(
    function(responseDelegate) {
      if(!responseDelegate.success)
        debug('Error during delegate Retrieve.');
      else {
        tx.delegate = responseDelegate.delegate.username;
        debug('Pushing Donation from ' + tx.senderId);
        addDonations(tx, isBcast);
      }
    }
   ).catch(error => {
     if(error.message == "Delegate not found")
     {
       debug('Pushing ANON Donation from ' + tx.senderId);
       addDonations(tx, isBcast);
     }
     else
       debug('ERROR: DposAPI getByPublicKey Exception caught', error.message);
   });
}

function compareDonations(a, b) {
  if (a.amount < b.amount)
    return 1;
  if (a.amount > b.amount)
    return -1;
  return 0;
}

var addDonations = function(tx, isBcast) {
  donations.push(tx);
  donations.sort(compareDonations);
  if(isBcast)
    broadcast("Lisk-Donations", donations);
}

var retrieveDonations = function() {
  debug('Retrieving Donations');
  dposAPI.transactions.getList({recipientId: donationAddress})
  .then(
    function (response) {
     if (!response.success)
       debug("Lisk getDonations Error.");
     else {
         debug("Retrieved " + response.count + " Donations!")
         response.transactions.forEach(processDonation);
     }
  }).catch(error => {
    debug('ERROR: DposAPI Donation Exception caught', error.message);
  });

}

exports.getDonations = function() {
  return donations;
}

retrieveDonations();

/* ***************************
*  Lisk.io Block and Transactions Pusher
** *************************** */
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
     debug('ERROR: DposAPI getHeight Exception caught', error.message);
   });

}

bootstrapLastBlock();

function processBlock(height)
{
  if(blockIndex == -1)
    return;

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

             //Check for Donations
             responseTransactions.transactions.forEach(
               function(tx) {
                 if(tx.recipientId == donationAddress)
                   processDonation(tx, /*broadcast*/ true);
             });
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
