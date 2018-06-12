$(function() {
	console.log("Loading addresses");
	
     	function loadAddresses() {
		$.getJSON( "/api/addresses/", function( addresses ) {
			console.log(addresses);
			var message = "Nobody is here";
			if (addresses.length > 0) {
				message = addresses[0].address + " " + addresses[0].phone + " " + addresses[0].city + " " + addresses[0].country;
			}
			$(".skills").text(message);
		});
   	 };

	loadAddresses();
	setInterval(loadAddresses,2000);
});
 