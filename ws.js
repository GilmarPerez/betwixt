/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Websocket Server
 */
var WebSocketServer = require('ws').Server
  , BSON 			= require('buffalo')
  , log 			= require('npmlog')
  , observers		= []
  , seqNo			= 0;

var websocket;
var licSerial;

// how long to wait for a response to a COMMAND on the websocket
var responseTime = 59; // seconds

exports.init = function(server) {
	
	wss = new WebSocketServer({server: server, path: '/visit-cloud-api/websocket'});
	
	wss.on('connection', function(ws) {
			websocket = ws;
			licSerial = ws.upgradeReq.headers['channelid'];
			
			log.info('ws', 'new connection received for serial #: %s', licSerial);
			
			ws.on('error', function() {
				log.error('ws', 'error in websocket - closing');
				ws.close(500, 'error');
			});
	
			ws.on('close', function() {
				log.info('ws', 'connection closed.');
			});
			
			ws.on('message', function(message, flags) {
				// deserialise the BSON payload to an object
				var object = BSON.parse(message);
			
				messageReceived(object);
			});
	});
	
	wss.on('listening', function() {
		log.info('ws', 'Websocket Server running on port %d...', server.address().port);
	});

	wss.on('error', function(error) {
		log.error('ws', 'Error starting websocket server %s', error);
	});
	
};

// Send a COMMAND to a channel
exports.command = function(payload, callback) {
	var messageId = '' + newSequence();
	
	var message = {};
	message.messageId = messageId;
	message.messageType = 'COMMAND';
	message.payload = payload;
	
	log.verbose('ws', 'Sending COMMAND: %s', JSON.stringify(message));
	
	if(send(message)) {
		log.verbose('ws', 'Adding an observer for message id: %s', messageId);
		observers[messageId] = callback;
	} else {
		callback(null, 'Communication problem.');
	}
	
	// set a timeout for communication
	setTimeout(function() {
		var cb = observers[messageId];
		
		if(cb != undefined) {
			log.warn('ws', 'Timeout waiting for response for message id: %s', messageId);
		
			// remove the observer
			delete observers[messageId];
		
			cb(null, 'Timeout waiting for response.');
		}
	}, responseTime * 1000);
};

// Send a one-way (fire and forget) COMMAND to a channel
exports.commandOneWay = function(payload, callback) {
	var messageId = '' + newSequence();
	
	var message = {};
	message.messageId = messageId;
	message.messageType = 'EVENT';
	message.payload = payload;
	
	if(send(message)) {
		callback(null);
	} else {
		callback('Communication problem.');
	}
};

// Send a message to the channel
var send = function(message) {
	
	if(websocket == undefined) {
		log.error('ws', 'Websocket not connected.');
		return false;
	}
	
	websocket.send(BSON.serialize(message), {binary: true, mask: false}, function(err) {
		if(err) {
			log.error('ws', 'Communication error: %s', err);
			response(
				{
					messageId: id, 
					payload: {
						Operation: 'Exception',
						RETURN_VALUE: err
					}
				}
			);
		}
	});
	
	return true;
};

// Generate a new sequence number
var newSequence = function() {
	seqNo++;
	
	if(seqNo >= 2000000000)
		seqNo = 1;
		
	return seqNo;
}

var messageReceived = function(message) {
	log.verbose('ws', 'message received: %s', JSON.stringify(message));
	
	switch(message.messageType) {
		case 'COMMAND': // shouldn't get any of these
			log.verbose('ws', 'COMMAND received - that shouldn\'t happen!!!');
			break;
		case 'COMMAND_RESPONSE': // response to a sent command, notify observer
			response(message);
			break;
		case 'EVENT': // TODO - push notification
			break;
		case 'HEARTBEAT': // send heartbeat response
			log.verbose('ws', 'HEARTBEAT request received');
			sendHeartbeatResponse();
			break;
		default:
			log.warn('ws', 'Unknown message type received: %s', message.messageType);
			return;
	}
};

// Receive a COMMAND_RESPONSE from a channel
var response = function(message) {
	log.verbose('ws', 'Received a response to message with id: %s', message.messageId);
	
	// find observer for message
	var callback = observers[message.messageId];
	
	if(callback == undefined) {
		log.warn('ws', 'No observer found waiting for response to message with id: %s', message.messageId);
	} else {
		log.verbose('ws', 'Found observer for message id: %s', message.messageId);
	
		// check for an exception returned
		if(message.payload.Operation == 'Excpetion') {
			// call the observer callback, passing in the response exception
			callback(null, message.payload.RETURN_VALUE);
		} else {
			// call the observer callback, passing in the response
			callback(message.payload.RETURN_VALUE);
		}
	
		// remove the observer
		delete observers[message.messageId];
	}
};

var sendHeartbeatResponse = function() {
	if(send({messageType:'HEARTBEAT_RESPONSE', payload:{}})) {
		log.verbose('ws', 'Sent heartbeat response');
	} else {
		log.error('ws', 'Failed to send heartbeat response');
	};
}
