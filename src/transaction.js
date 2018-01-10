var enableUSDPrice = false;

//Lisk Transaction Types
var TX_SEND = 0;
var TX_SIGNATURE = 1;
var TX_DELEGATE = 2;
var TX_VOTE = 3;
var TX_MULTI = 4;
var TX_DAPP = 5;
var TX_IN_TRANSFER = 6;
var TX_OUT_TRANSFER = 7;

/**
 *  @constructor
 *  @extends Floatable
 */
function Transaction(lisks, highlight, type) {
	if (document.visibilityState === "visible") {
		Floatable.call(this);

		var body;
		var lisksV = parseFloat( lisks / satoshi).toFixed(2);
		var liskBTC;
		if(globalRateBTCLSK != -1)
			liskBTC = lisksV * globalRateBTCLSK;
		else
			liskBTC = lisksV * 0.00100000; //100k di default

		this.area = 7000; //Default for not SEND transactions.

		switch (type) {
			case TX_SIGNATURE:
				body = "New <br /> Signature";
				break;
			case TX_DELEGATE:
				body = "New <br /> Delegate";
				break;
			case TX_VOTE:
				body = "Vote";
				break;
			default:
				body = getSendBody(lisksV, highlight);
				this.area = liskBTC * 800 + 5000;
		}

		this.width = this.height = Math.sqrt(this.area / Math.PI) * 2;
		this.addImage(bubbleImage, this.width, this.height);
		this.addText('<span class="BlockBody">' + body + '</span>');
		this.initPosition();

		// Sound
    var maxBitcoins = 1000;
    var minVolume = 0.3;
    var maxVolume = 0.7;
    var volume = liskBTC / (maxBitcoins / (maxVolume - minVolume)) + minVolume;
    if (volume > maxVolume)
	    volume = maxVolume;

    var maxPitch = 100.0;
    // We need to use a log that makes it so that maxBitcoins reaches the maximum pitch.
    // Well, the opposite of the maximum pitch. Anyway. So we solve:
    // maxPitch = log(maxBitcoins + logUsed) / log(logUsed)
    // For maxPitch = 100 (for 100%) and maxBitcoins = 1000, that gives us...
    var logUsed = 1.0715307808111486871978099;
    // So we find the smallest value between log(bitcoins + logUsed) / log(logUsed) and our max pitch...
    var pitch = Math.min(maxPitch, Math.log(liskBTC + logUsed) / Math.log(logUsed));
    // ...we invert it so that a bigger transaction = a deeper noise...
    pitch = maxPitch - pitch;
    // ...and we play the sound!
    if(globalScalePitch) {
	    Sound.playPitchAtVolume(volume, pitch);
    } else {
	    Sound.playRandomAtVolume(volume);
    }

	}

}

function getSendBody(lisksV, highlight) {

	var body = lisksV + " LSK";

	if(highlight) {
		body = '<span style="color: yellow;">' + body + '</span><br />' +
					 '<span style="color: cyan;">Donation</span><br />' +
					 '<span style="color: lime;">Thanks!</span>';
	}

	if(enableUSDPrice && globalRateUSDBTC != -1 && globalRateBTCLSK != -1) {
		var usdValue = (lisksV * (parseFloat(globalRateUSDBTC) * globalRateBTCLSK)).toFixed(2);
		body += " <br /> " + usdValue + "$";
	}
	return body;
}

extend(Floatable, Transaction);
