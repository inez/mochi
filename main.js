var fs = require('fs');
var crypto = require('crypto');
//
// Spooky
//
try {
	var Spooky = require( 'spooky' );
} catch (e) {
	var Spooky = require( '../lib/spooky' );
}

//
// Parse
//
var APP_ID = 'z1676waszkom4cP3YGk6zTlBRrgNZ2Le54K5XVWE';
var MASTER_KEY = '0t8j00bDz6XmaViXH5QT1odUX3I9hUhJa3JqOG7k';
var REST_API_KEY = 'IK0jz53zYnhwQvQ6fnl1LLEs0mXYLTkg8KFKrg8l';
var Parse = require( 'node-parse-api' ).Parse;
var parse = new Parse( APP_ID, MASTER_KEY );
var Kaiseki = require( 'kaiseki' );
var kaiseki = new Kaiseki( APP_ID, REST_API_KEY );

//
// Sendgrid
//
var sendgrid  = require( 'sendgrid' )( 'mochi', 'mochi' );

var tests = [];

var argv = require('minimist')(process.argv.slice(2));

// Require all tests files (tests/*)
require( 'fs' ).readdirSync( './tests' ).forEach( function( file ) {
	if ( !argv.single || ( argv.single && argv.single === file ) ) {
		tests.push( require( './tests/' + file ) );
	}
});

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 5; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function getHash( target, callback ) {
	var fd = fs.createReadStream(target);
	var hash = crypto.createHash('sha1');
	hash.setEncoding('hex');
	fd.on( 'end', function() {
		hash.end();
		callback( hash.read() );
    } );
	fd.pipe( hash );
}

function assert( testName, caseName, target ) {
	var id = makeid();
	fs.rename( target, target + '.' + id, function() {
		getHash( target + '.' + id, function( hash ) {
			kaiseki.getObjects( 'TestCaseData', { 'where': { 'test': testName, 'case': caseName } }, function( err, res, body, success ) {
				if ( !body || body.length === 0 ) {
					console.log("NEW");
					// upload file
					kaiseki.uploadFile( target + '.' + id, function( err, res, body, success ) {
						parse.insert( 'TestCaseData', { 'test': testName, 'case': caseName, 'hash': hash, 'file': { 'name': body.name, '__type': 'File' } }, function() {} );
						fs.unlink( target + '.' + id );
					} );
				} else {
					if ( body[0].hash !== hash ) {
						console.log("BAD");
						// no match
						sendgrid.send({
							to:       'korczynski@gmail.com',
							from:     'korczynski@gmail.com',
							subject:  'Test failing:' + testName + ' / ' + caseName,
							html:     '<h2>' + testName + ' / ' + caseName + '</h2><br />' +
										'<div>' +
											'<div>' +
												'<div><h3>Captured</h3></td></div>' +
												'<div><img src="cid:captured"></div>' +
											'</div>' +
											'<div>' +
												'<div><h3>Original</h3></td></div>' +
												'<div><img src="' + body[0].file.url + '" /></div>' +
											'</div>' +
										'</div>',
							files: [ {
								path: target + '.' + id,
								cid: 'captured'
							} ]
						}, function(err, json) {
							fs.unlink( target + '.' + id );
						});
					} else {
						console.log("OK");
						// match
						fs.unlink( target + '.' + id );
					}
				}
			} );
		} );
	} );
}

function go() {
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
					},
					stepTimeout: 10000,
					timeout: 10000,
					waitTimeout: 10000
				}
			},
			function( err ) {
				if ( err ) {
					var e = new Error('Failed to initialize SpookyJS');
					e.details = err;
					throw e;
				}
				console.log( 'Execute test: ' + test.name() );
				parse.insert( 'Log', { 'test': test.name(), 'action': 'execute' }, function() {} );
				test.execute( spooky );
				spooky.run();
			}
		);
		spooky.on( 'run.complete', function( resource ) {
			console.log( 'Completed test: ' + test.name() );
			parse.insert( 'Log', { 'test': test.name(), 'action': 'completed' }, function() {} );
			go();
		});
		spooky.on( 'capture.saved', function( target ) {
			assert( test.name(), target.split( '/' ).pop(), target );
		} );
	}
}

go();