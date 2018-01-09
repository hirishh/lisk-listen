var globalRateUSDBTC = -1; // set upon first rate received
var globalRateBTCLSK = -1; // set upon first rate received
var pusherBitstamp;
var channeBitstamp;


function setGlobalRateUSDBTC(rate) {
    $("#rateUSDBTC").html(parseFloat(rate).toFixed(2));
    globalRateUSDBTC = rate;
    setRateUSDLSK();
}

function setGlobalRateBTCLSK(rate) {
    $("#rateBTCLSK").html((parseFloat(rate) * 1000000).toFixed(2));
    globalRateBTCLSK = rate;
    setRateUSDLSK();
}

function setRateUSDLSK() {
    if(globalRateUSDBTC != -1 && globalRateBTCLSK != -1)
      $("#rateUSDLSK").html((parseFloat(globalRateUSDBTC) * globalRateBTCLSK).toFixed(2));
}

rateboxInitialUSDGetRate = function() {
	$.getJSON("https://blockchain.info/ticker?cors=true", function(data) {
        setGlobalRateUSDBTC(data.USD.last);
    });
};

$(document).ready(function() {
	// Bitstamp USD - BTC
  StatusBox.changeStatus(CONNECTING, "bitstamp");
  pusherBitstamp = new Pusher('de504dc5763aeef9ff52');
  channelBitstamp = pusherBitstamp.subscribe('live_trades');

  channelBitstamp.bind('trade', function(ticker) {
      if(channelBitstamp.subscribed)
        StatusBox.changeStatus(CONNECTED, "bitstamp");
      else
        StatusBox.changeStatus(CLOSED, "bitstamp");

      setGlobalRateUSDBTC(ticker.price);
  });

  // Bittrex BTC - Lisk
  StatusBox.changeStatus(CONNECTING, "lisk");
  StatusBox.changeStatus(CONNECTING, "bittrex");

  socket.on('Bittrex-BTC-LSK-Ticker', function(data) {
      StatusBox.changeStatus(CONNECTED, "bittrex");
      setGlobalRateBTCLSK(data.Last);
  });

  if(!DEBUG_MODE)
    TransactionSocket.init();

});
