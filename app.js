/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *
 */
var https 			= require('https')
  , fs				= require('fs')
  , express 		= require('express')
  , methodOverride	= require('method-override')
  , compression 	= require('compression')
  , app 			= express()
  , cors			= require('cors')
  , passport 		= require('passport')
  , BasicStrategy 	= require('passport-http').BasicStrategy
  , ws				= require('./ws')
  , log 			= require('npmlog');

// Username & password for REST authentication
var username = 'mobile';
var password = 'ulan';

// Configure passport auth
passport.use(new BasicStrategy(
	function(user, pwd, done) {
  		if(user != username) {
			return done(null, false);
	  	}
	  	if(pwd != password) {
	  		return done(null, false);
	  	}
	  	return done(null, {username: username});
  	}
));

// enable CORS
var corsOptions = {
	origin: true,
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	credentails: true
};
app.use(cors(corsOptions));

// configure express
app.use(methodOverride());
app.use(compression());
app.use(passport.initialize());

// Error handling
app.use(function(err, req, res, next) {
	// log the error
	log.error('', err.message);
	
	// un-comment to debug during development
	log.error('', err.stack);
	
	res.status(500);
	res.message(err.message || 'an error occured processing the request');
});

// Rest API
require('./rest')(app);

// HTTPS options
var options = {
	key: fs.readFileSync('./cert/localhost-key.pem', 'utf8'),
	cert: fs.readFileSync('./cert/localhost-cert.pem', 'utf8')
};

// HTTPS server
var server = https.createServer(options, app).listen(443, function() {
	log.info('', 'HTTPS server listening on port %d in %s mode', this.address().port, app.settings.env);
});

// Initialise websocket module
ws.init(server);
