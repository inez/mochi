exports.execute = function(spooky) {
	spooky.start('http://vetest.wikia.com/wiki/QAarticle1402428435388?veaction=edit');
	spooky.waitFor(function () {
		return this.evaluate(function () {
			return ve.init.target.active === true;
		});
	});
	spooky.wait(500, function() {
		var clipRect = this.evaluate(function() {
			var $toolbar = $('.oo-ui-toolbar-bar:first');
			return {
				top: $toolbar.offset().top,
				left: $toolbar.offset().left,
				width: $toolbar.outerWidth(),
				height: $toolbar.outerHeight()
			};
		});
		this.capture('screenshot.png', clipRect);
	});
};

exports.name = function () {
    return "ve test";
};