// Set debugmode to true and transactions/trades will be
// randomly generated
var DEBUG_MODE = false;

var DONATION_ADDRESS;

var globalMute = false;

var instanceId = 0;

var last_update = 0;

var updateTargets = [];

var block_count = 0;

// Preload images
var bubbleImage = new Image();
bubbleImage.src = "../images/bubble.png";
var blockImage = new Image();
blockImage.src = "../images/block.png";

var debugSpawner;

$(document).ready(function() {

	DONATION_ADDRESS = $("#donationAddress").html();
	// Because the user has javascript running:
	$("#noJavascript").css("display", "none");

	StatusBox.init();

	$(".clickSuppress").click(function() {
		$(".clickSuppress").parent().slideUp(300);
	});

	rateboxInitialUSDGetRate();

	// Attach mouseover qr
	$("#donationAddress").qr();

});

// Function for handling interface show/hide
var toggleInterface = function() {
	if ($(".interface:hidden").length === 0) {
		$(".interface").fadeOut(500);
		$("#hideInterface").html("[ Show Interface ]");
		$("#hideInterface").css("opacity", "0.5");
	} else {
		$(".interface").fadeIn(500);
		$("#hideInterface").html("[ Hide Interface ]");
		$("#hideInterface").css("opacity", "1");
	}
};

var globalUpdate = function(time) {
	window.requestAnimationFrame(globalUpdate);
	var delta = time - last_update;
	last_update = time;
	for (var i = 0; i < updateTargets.length; i++) {
		updateTargets[i].update(delta);
	}
};

$(window).bind("load", function() {
	if (DEBUG_MODE) {
		setInterval(debugSpawnerTransaction, 100);
		setInterval(debugSpawnerBlock, 10000);
	}

	window.requestAnimationFrame(globalUpdate);

	Sound.loadup();
	Sound.init();
});

window.onbeforeunload = function(e) {
	clearInterval(globalUpdate);
};


// Create a bubble spawner for testing
debugSpawnerTransaction = function() {
	// Generate some test bubbles
	if (Math.random() <= 0.1) {
		// Try to simulate the transaction spread
		var volume;
		var order = Math.random();
		if (order < 0.6) {
			volume = Math.random();
		} else if (order < 0.8) {
			volume = Math.random() * 10;
		} else if (order < 0.95) {
			volume = Math.random() * 100;
		} else {
			volume = Math.random() * 1000;
		}

		new Transaction(volume * satoshi, false);

	}
};

// Create a bubble spawner for testing
debugSpawnerBlock = function() {
	// Generate some test bubbles
	if (Math.random() <= 0.1) {
		// Try to simulate the transaction spread
		var volume;
		var order = Math.random();
		if (order < 0.6) {
			volume = Math.random();
		} else if (order < 0.8) {
			volume = Math.random() * 10;
		} else if (order < 0.95) {
			volume = Math.random() * 100;
		} else {
			volume = Math.random() * 1000;
		}

		new Block(1000, 10, volume * satoshi, 2.5);

	}
};
