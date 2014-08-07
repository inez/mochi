try {
	var Spooky = require( 'spooky' );
} catch (e) {
	var Spooky = require( '../lib/spooky' );
}

var tests = [];

// Require all tests files (tests/*)
require( 'fs' ).readdirSync( './tests' ).forEach( function( file ) {
	tests.push( require( './tests/' + file ) );
});

function process() {
	if ( tests.length > 0 ) {
		var test = tests.shift();
		var spooky = new Spooky(
			{
				child: { transport: 'http' },
				casper: {
					logLevel: 'debug',
					verbose: true,
					viewportSize: {
						width: 1366,
						height: 768
					}
				}
			},
			function( err ) {
				if ( err ) {
					var e = new Error('Failed to initialize SpookyJS');
					e.details = err;
					throw e;
				}
				test.execute( spooky );
				spooky.run();
			}
		);
		spooky.on( 'run.complete', function( resource ) {
			process();
		});
	}
}

process();