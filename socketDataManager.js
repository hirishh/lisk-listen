var request = require("request")
var Repeat = require('repeat');
var debug = require('debug')('lisk-listen:socket');
var config = require('config');

// Keep track of the chat clients
var clients = [];


/* ***************************
*  Bittrex Ticker BTC - LSK
** *************************** */

var urlBittrekTicker = config.get("bittrex-ticker.url");

function triggerNewPriceTicker(message) {
  broadcast("Bittrex-BTC-LSK-Ticker", message);
}

var bittrexTicker = function() {
  request( { url: urlBittrekTicker, json: true},
           function (errorTicker, responseTicker, bodyTicker) {
              if (!errorTicker && responseTicker.statusCode === 200 && bodyTicker.success) {
                  if("result" in bodyTicker)
                  {
                    debug('New Ticker BTC-LSK: ' + bodyTicker.result.Last);
                    triggerNewPriceTicker(bodyTicker.result);
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

function triggerNewLiskBlock(message) {
  broadcast("Lisk-NewBlock", message);
}

var blockIndex = -1;
var blockIndexProcessed = -1;

var urlLiskIo = config.get("lisk.url");

var liskBlockParser = function() {

  if(blockIndex == -1) {
    debug('Start Lisk Block Parser');
    //First Run
    debug('First run... retrieving Block Height');
    request( { url: urlLiskIo + "blocks/getHeight", json: true},
             function (errorHeight, responseHeight, bodyHeight) {
                if (!errorHeight && responseHeight.statusCode === 200 && bodyHeight.success) {
                    debug(bodyHeight);
                    debug("Last Block Height is: " + bodyHeight.height)
                    blockIndex = bodyHeight.height;
                    processBlock(blockIndex);
                }
                else
                  debug("Lisk getHeight Error: " + errorHeight);
          });
  }
  else
    processBlock(blockIndex);
}

var intervalObj;
liskBlockParser();

function processBlock(height)
{
  clearInterval(intervalObj);
  debug('[ ' + height + ' ] Processing Block');
  var blockInfo;

  request( { url: urlLiskIo + "blocks?height=" + height , json: true},
           function (errorBlock, responseBlock, bodyBlock) {
              if (!errorBlock && responseBlock.statusCode === 200 &&
                  bodyBlock.success && bodyBlock.blocks.length > 0) {

                  blockInfo = bodyBlock.blocks[0];

                  debug('[ ' + height + ' ] get Mined!' )

                  if(blockInfo.numberOfTransactions > 0) {
                    debug('[ ' + height + ' ] Retrieveing transactions!' )
                    //Retrieve transactions
                    request( { url: urlLiskIo + "transactions?blockId=" + blockInfo.id, json: true},
                             function (errorTx, responseTx, bodyTx) {
                                if (!errorTx && responseTx.statusCode === 200 &&
                                    bodyTx.success && bodyTx.transactions.length > 0) {
                                    debug('[ ' + height + ' ] Transactions Retrieved')

                                    blockInfo.transactions = bodyTx.transactions;
                                    finalizeBlockProcess(blockInfo);
                                }
                          });
                  } else {
                      debug('[ ' + height + ' ] No transaction to retrieve!' );
                      finalizeBlockProcess(blockInfo);
                  }
              }
              else {
                debug('[ ' + height + ' ] not mined yet.');
                intervalObj = setInterval(liskBlockParser, 5000);
              }
        });
}

function finalizeBlockProcess(blockMessage) {
  //debug(blockMessage);
  triggerNewLiskBlock(blockMessage);
  blockIndex = blockIndex + 1;
  intervalObj = setInterval(liskBlockParser, 5000);
}



// Send a message to all clients
function broadcast(topic, message) {
  clients.forEach(function (socket) {
    socket.emit(topic, message);
  });
}

exports.currentBlockHeight = function() {
  return blockIndex;
}

exports.addClient = function(socket) {
  clients.push(socket);
}

exports.removeClient = function(socket) {
  clients.splice(clients.indexOf(socket), 1);
}
