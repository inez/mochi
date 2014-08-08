exports.execute = function(spooky) {
	spooky.start('http://www.wikia.com/Special:CreateNewWiki');
	/*
	spooky.then(function(){
		this.evaluate(function() {
			$('.language-default').remove()
		});
	});
	*/
	spooky.then(function(){
		this.capture('screenshot.png');
	});
};

exports.name = function () {
    return "create new wikia test";
};