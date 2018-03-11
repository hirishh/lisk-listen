
$(document).ready(function() {
	socket.on('Lisk-Donations', function(donations) {
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
					dList += rank + ". " + donationVolume + " LSK by <strong>" + sender + "</strong> ";
					if(tx.pools.length > 0) {
						dList += "(" + tx.pools.join(", ") +  ")";
					}
					dList += "<br/>";
			    return rank < 10;
			});
			$("#donationList").html(dList).show(800);
		});
}
