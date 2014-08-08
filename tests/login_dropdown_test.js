exports.execute = function(spooky) {
	spooky.start('http://mochitesting.wikia.com/');
	spooky.then(function(){
		var clipRect = this.evaluate(function() {
			// Click the login button
			$('#AccountNavigation .ajaxLogin').click()

			// Get "coordinates" for login dropdown
			var $UserLoginDropdown = $('#UserLoginDropdown');
			return {
				top: $UserLoginDropdown.offset().top,
				left: $UserLoginDropdown.offset().left,
				width: $UserLoginDropdown.outerWidth(),
				height: $UserLoginDropdown.outerHeight()
			};
		});
		this.capture('screenshot.png', clipRect);
	});
};

exports.name = function () {
    return "login dropdown test";
};