var satoshi = 100000000;
var DELAY_CAP = 20000;
var lastBlockHeight = 0;
var transactionSocketDelay = 1000;

/** @constructor */
function TransactionSocket() {}

function createTxAnimation(lisks, isDonation, type) {
	if (block_count === 0 || isDonation) {
		new Transaction(lisks, isDonation, type);
	} else {
		setTimeout(function() {
			new Transaction(lisks, isDonation, type);
		}, Math.random() * DELAY_CAP);
	}
}

TransactionSocket.processBlock = function(block) {

	//Block
	// Filter out the orphaned blocks.
	if (block.height > lastBlockHeight) {
		lastBlockHeight = block.height;
		console.log("New Block: " + block.height + " with " + block.numberOfTransactions + " transactions");
		new Block(block.height, block.numberOfTransactions, block.totalAmount, block.totalFee, block.id);
	}
	else {
		return;
	}

	//Transactions
	for (var j = 0; j < block.numberOfTransactions; j++) {

		var isDonation = false;
		if (block.transactions[j].recipientId == DONATION_ADDRESS)
			isDonation = true;
		createTxAnimation(block.transactions[j].amount, isDonation, block.transactions[j].type);
	}



};

TransactionSocket.init = function() {

	//socket is created in ratebox.js
	socket.on('Lisk-NewBlock', function(data) {
      StatusBox.changeStatus(CONNECTED, "lisk");
			TransactionSocket.processBlock(data);
  });
};
