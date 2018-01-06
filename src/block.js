var enableBlocks = true;

/**
 *  @constructor
 *  @extends Floatable
 */
function Block(height, numTransactions, totalAmount, totalFees, blockID) {
	
	if(!enableBlocks) return;

	if (document.visibilityState === "visible") {
		Floatable.call(this);

		this.width = this.height = 250;

		var volumeSent = parseFloat(totalAmount / satoshi).toFixed(2);
		var transactedFees = parseFloat(totalFees / satoshi).toFixed(2);

		this.addImage(blockImage, this.width, this.height);
		this.addText('<a href="https://explorer.lisk.io/block/' + blockID + '">' +
										'<span class="BlockHeight">Block #' + height + '</span>' +
									'</a><br />' +
								 'Transactions: ' + numTransactions + '<br />' +
								 'Volume: ' + volumeSent + ' LSK <br />' +
								 'Fees: ' + transactedFees + ' LSK');
		this.initPosition();
	}

	// Sound
	Sound.playRandomSwell();

	block_count++;
	if (block_count === 1) {
			document.getElementById("waitingForTransactions").style.opacity = "0";
	}
}

extend(Floatable, Block);
