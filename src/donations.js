
$(document).ready(function() {
	socket.on('Lisk-Donations', function(donations) {
		console.log('Got Donations!');
		processDonations(donations);
	});
});


function processDonations(donations) {
	$("#donationList")
		.hide(800, function() {
			var dList = "";
			$.each(donations, function(i, tx) {
					var rank = i+1;
					var donationVolume = parseFloat(tx.amount / satoshi).toFixed(2);
					var sender = (tx.delegate ? tx.delegate : tx.senderId);
					//dList += "<strong>" + (i+1)+". " + sender + "</strong>: " + donationVolume + " LSK <br/>";
					dList += (i+1)+". " + donationVolume + " LSK by <strong>" + sender + "</strong> <br/>";
			    return rank < 10;
			});
			$("#donationList").html(dList).show(800);
		});
}
