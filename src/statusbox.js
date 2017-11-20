var CONNECTED = { message: "Connected.", color: "lawngreen" };
var CONNECTING = { message: "Connecting...", color: "yellow" };
var NO_SUPPORT = { message: "No browser support.", color: "gray" };
var CLOSED = { message: "Not Connected.", color: "red" };
var DEBUG = { message: "Debug Mode.", color: "violet" };

function StatusBox() {}

StatusBox.init = function() {
	StatusBox.lisk = $("#LiskNodeStatus");
	StatusBox.bittrex = $("#BittrexNodeStatus");
	StatusBox.bitstamp = $("#BitstampNodeStatus");

	StatusBox.changeStatus(CLOSED, "lisk");
	StatusBox.changeStatus(CLOSED, "bittrex");
	StatusBox.changeStatus(CLOSED, "bitstamp");

	if(DEBUG_MODE)
		StatusBox.changeStatus(DEBUG, "lisk");

};

StatusBox.changeStatus = function(status, service) {

	switch (service) {
		case "lisk":
			StatusBox.lisk.css("color", status.color);
			StatusBox.lisk.html(status.message);
			break;
		case "bittrex":
			StatusBox.bittrex.css("color", status.color);
			StatusBox.bittrex.html(status.message);
			break;
		case "bitstamp":
			StatusBox.bitstamp.css("color", status.color);
			StatusBox.bitstamp.html(status.message);
			break;
	}

};
