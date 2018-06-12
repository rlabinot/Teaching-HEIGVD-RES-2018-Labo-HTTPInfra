$(function() {
	console.log("Loading addresses");
	
     	function loadAddresses() {
		$.getJSON( "/api/addresses/", function( addresses ) {
			console.log(addresses);
			var message = "Nobody is here";
			if (addresses.length > 0) {
				message = "Country: " + addresses[0].country + ", City: " + addresses[0].city + ", Address: " + addresses[0].address;
			}
			$(".skills").text(message);
		});
   	 };

	loadAddresses();
	setInterval(loadAddresses, 2000);
});
 