var request = require('request');
var Repeat = require('repeat');
var debug = require('debug')('lisk-listen:socket');
var config = require('config');

const lisk = require("lisk-elements");
const client = new lisk.APIClient([config.get("lisk.url")]);

var liskGroups = require("./dpos-tools-data/lisk/groups.json");
var ligGroup = ["dakk", "liskit", "anamix", "corsaro", "splatters", "redsn0w", "gregorst", "ondin", "vekexasia", "hirish", "fulig"];

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
  if(tx.senderId == donationAddress) return;
  //Retrieve Delegate name
  client.delegates.get({publicKey: tx.senderPublicKey})
  .then(
    function(responseDelegate) {
      if(!responseDelegate)
        debug('Error during delegate Retrieve.');
      else if (responseDelegate.data.length === 0) {
        debug('Pushing ANON Donation from ' + tx.senderId);
        addDonations(tx, isBcast);
      } else {
        tx.delegate = responseDelegate.data[0].username;
        debug('Pushing Donation from ' + tx.senderId + ' Delegate: ' + tx.delegate);
        addDonations(tx, isBcast);
      }
  })
  .catch(error => {
       debug('ERROR: delegates.get Exception caught ', error.message);
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

  var donation = {
    senderId: tx.senderId,
    delegate: null,
    pools: [],
    amount: parseFloat(tx.amount)
  }

  if(!isEmptyStr(tx.delegate)) {

    if(tx.delegate === "hirish")
      return; //Remove self transactions

    donation.delegate = tx.delegate;

    tx.pools = [];
    if(liskGroups.ascend.members.indexOf(donation.delegate) !== -1)
      donation.pools.push("Ascend");
    if(ligGroup.indexOf(donation.delegate) !== -1)
      donation.pools.push("LIG");
    if(liskGroups.gdt.members.indexOf(donation.delegate) !== -1)
      donation.pools.push("GDT");
    if(liskGroups.sherwood.members.indexOf(donation.delegate) !== -1)
      donation.pools.push("Sherwood");
    if(liskGroups.dutch.members.indexOf(donation.delegate) !== -1)
      donation.pools.push("Dutch");
    if(liskGroups.elite.members.indexOf(donation.delegate) !== -1)
      donation.pools.push("Elite");

    //Particular cases
    if(tx.delegate === "arca_music")
      donation.pools.push("Ascend");
    if(tx.delegate === "cc001_fund2")
      donation.pools.push("GDT");
  }

  var donationIndex = getDonationIndex(donation.senderId);

  if(donationIndex === -1)
    donations.push(donation);
  else {
    donations[donationIndex].delegate = donation.delegate;
    donations[donationIndex].pools = donation.pools;
    donations[donationIndex].amount += donation.amount;
  }

  donations.sort(compareDonations);

  if(isBcast)
    broadcast("Lisk-Donations", donations);
}

function getDonationIndex(senderId) {
  for(var i=0; i < donations.length; i++)
    if(donations[i].senderId === senderId)
      return i;
  return -1;
}

var retrieveDonations = function() {
  debug('Retrieving Donations for address: ' + donationAddress);
  client.transactions.get({recipientId: donationAddress, limit: 100})
  .then(
    function (response) {
     if (!response)
       debug("Lisk getDonations Error.");
     else {
         debug("Retrieved " + response.count + " Donations!")
         response.data.forEach(processDonation);
     }
  })
  .catch(error => {
    debug('ERROR: transactions.get Exception caught ', error.message);
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

    client.blocks.get({limit: 1})
    .then(
      function (response) {
       if (response && response.data.length !== 0) {
           blockIndex = response.data[0].height;
           debug("Last Block Height is: " + blockIndex);
           var everyForLisk = config.get("lisk.every");
           new Repeat(function() {
             processBlock(blockIndex);
           }).every(everyForLisk, 's').start.now();

       }
       else {
         debug("Lisk getHeight Error.");
       }

   }).catch(error => {
     debug('ERROR: blocks.get Exception caught', error.message);
   });

}

bootstrapLastBlock();

function processBlock(height)
{
  if(blockIndex == -1)
    return;

  debug('[ ' + height + ' ] Processing Block');
  var blockInfo;

  client.blocks.get({"height": height})
    .then(
      function (responseBlocks) {
         if (!responseBlocks)
           debug('Error during getBlocks.');
        else if(responseBlocks.data.length === 0)
           debug('[ ' + height + ' ] not mined yet.');
        else {

           debug('[ ' + height + ' ] get Mined!' );
           blockInfo = responseBlocks.data[0];

           //Retrieve Delegate name
           client.delegates.get( {publicKey: blockInfo.generatorPublicKey} )
           .then(
             function(responseDelegate) {
               if(!responseDelegate || responseDelegate.data.length === 0)
                 debug('Error during delegate Retrieve.');
               else {
                 blockInfo.delegate = responseDelegate.data[0];
                 processTransactions(blockInfo, height);
               }
             }
            ).catch(error => {
              debug('ERROR: delegates.get Exception caught', error.message);
            });
         }
       }
  ).catch(error => {
    debug('ERROR: blocks.get Exception caught', error.message);
  });
}

function processTransactions(blockInfo, height) {
  if(blockInfo.numberOfTransactions <= 0)
  {
      debug('[ ' + height + ' ] No transaction to retrieve!' );
      finalizeBlockProcess(blockInfo);
  } else {

    debug('[ ' + height + ' ] Retrieveing transactions!' );
    client.transactions.get({"blockId": blockInfo.id, limit: 50})
    .then(
      function (responseTransactions) {
         if (responseTransactions && responseTransactions.data.length > 0) {
             debug('[ ' + height + ' ] ' + responseTransactions.data.length + ' Transactions Retrieved');
             blockInfo.transactions = responseTransactions.data;
             finalizeBlockProcess(blockInfo);

             //Check for Donations
             responseTransactions.data.forEach(
               function(tx) {
                 if(tx.recipientId == donationAddress)
                   processDonation(tx, /*broadcast*/ true);
             });
         }
       }
    ).catch(error => {
       debug('ERROR: transactions.get Exception caught ', error.message);
    });

  }
}

function finalizeBlockProcess(blockMessage) {
  broadcast("Lisk-NewBlock", blockMessage);
  blockIndex = blockIndex + 1;
}

function isEmptyStr(str) {
    return (!str || 0 === str.length);
}
