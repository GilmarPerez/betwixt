/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * Mobile API client
 */
var ws 			= require('./ws')
  , Cache		= require('./lib/cache')
  , cache		= new Cache()
  , calc		= require('./lib/distance')
  , time 		= require('time')
  , log 		= require('npmlog')
  , client 		= module.exports;

var cacheTime = 60 * 60; // 1 hour

/**
 * Get all services
 **/
client.getServices = function(callback) {
	var payload = {};
	payload.Operation = 'GET_SERVICES';
	payload.REQUEST_PARAMETERS = JSON.stringify({});
	
	sendCommandJson(payload, callback, 'services');
};

/**
 * Get all branches for a service
 **/
client.getBranchesForService = function(serviceId, lng, lat, radius, callback) {
	// cache key
	var key = serviceId + '-branches';
	
	// first check the cache
	cache.has(key, function(has) {
		if(has) {
			// if long / lat / radius are specifed the branches need to be filtered to those within range
			if(radius != null) {
				cache.get(key, function(branches) {
					filterBranches(lng, lat, radius, branches, function(filtered) {
				
						if(filtered.length > 0)
							filtered = prepareBranches(filtered);
				
							callback(null, filtered);
					});
				});
			} else {
				cache.get(key, function(branches) {
					addDistanceToBranches(lng, lat, branches, function(updated) {
				
						if(updated.length > 0)
							updated = prepareBranches(updated);
				
						callback(null, updated);
					});
				});
			}
		} else {
			// if not in cache - request all branches for service
			var payload = {};
			payload.Operation = 'GET_BRANCHES_FOR_SERVICE';
			payload.REQUEST_PARAMETERS = JSON.stringify({"serviceId": serviceId});
	
			ws.command(payload, function(response, err) {
				if(err != null) {
					callback(err);
				} else {
					// put in cache
					cache.put(key, response, cacheTime);
				
					response = JSON.parse(response);
				
					// if long / lat / radius are specifed the branches need to be filtered to those within range
					if(radius != null) {
						filterBranches(lng, lat, radius, response, function(filtered) {
						
							if(filtered.length > 0)
								filtered = prepareBranches(filtered);
				
							callback(null, filtered);
						});
					} else {
						addDistanceToBranches(lng, lat, response, function(branches) {
						
							if(branches.length > 0)
								branches = prepareBranches(branches);
				
							callback(null, branches);
						});
					}
				}
			});
		}
	});
};

/**
 * Get the estimated waiting time
 **/
client.getWaitingTime = function(serviceId, branchId, callback) {
	var payload = {};
	payload.Operation = 'GET_WAITING_TIME';
	payload.REQUEST_PARAMETERS = JSON.stringify({"branchId": branchId, "serviceId": serviceId});
	
	sendCommand(payload, callback);
};

/**
 * Get the branch local time
 **/
client.getBranchTime = function(branchId, callback) {
	var payload = {};
	payload.Operation = 'GET_CURRENT_TIME_FOR_BRANCH';
	payload.REQUEST_PARAMETERS = JSON.stringify({"branchId": + branchId});
	
	sendCommand(payload, callback);
};

/**
 * Create a visit
 **/
client.createVisit = function(branchId, serviceId, delay, callback) {
	var payload = {};
	payload.Operation = 'GET_TICKET';
	payload.REQUEST_PARAMETERS = JSON.stringify({"branchId": branchId, "serviceId": serviceId, "delay": delay});
	
	sendCommandJson(payload, callback);
};

/**
 * Remove a visit
 **/
client.removeVisit = function(branchId, visitId, callback) {
	var payload = {};
	payload.Operation = 'DISPOSE_TICKET';
	payload.REQUEST_PARAMETERS = JSON.stringify({"visitId": visitId, "branchId": branchId, "serviceId": 1, "queueId": 1, "ticketNumber": "1"});
	
	sendEvent(payload, callback);
};

/************************************
 * Private functions
 ************************************/

var sendCommand = function(payload, callback, key) {
	
	ws.command(payload, function(response, err) {
		if(err != null) {
			callback(err);
		} else {
			if(key != null)
				cache.put(key, response, cacheTime);
				
			callback(null, JSON.parse(response));
		}
	});
};

var sendCommandJson = function(payload, callback, key) {
	// check the cache first if key specified
	if(key != null) {
		cache.has(key, function(has) {
			if(has) {
				log.info('', 'Serving data from cache for key %s', key);
				cache.get(key, function(data) {
					callback(null, data);
				});
			} else {
				sendCommand(payload, callback, key);
			}
		});
	} else {
		sendCommand(payload, callback, key);
	}
};

var sendEvent = function(payload, callback) {
	ws.commandOneWay(payload, function(err) {
		if(err != null) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

var calculateDistance = function(lng, lat, branches, callback) {
	var distance = Number.MAX_VALUE;
	
	branches.forEach(function(branch) {
		var d = calc.distance(branch.longitude, branch.latitude, lng, lat);
		if(d < distance)
			distance = d;
	});
	
	callback(distance);
};

var addDistanceToBranches = function(lng, lat, branches, callback) {
	branches.forEach(function(branch, index) {
		if(lng != null) {
			branch.distance = calc.distance(branch.longitude, branch.latitude, lng, lat);
		} else {
			branch.distance = 0;
		}
		
		if(index == (branches.length -1)) {
			// sort by distance
			branches.sort(function(a, b) {
				return parseInt(a.distance) - parseInt(b.distance);
			});
			
			callback(branches);
		}
	});
};

var filterBranches = function(lng, lat, radius, branches, callback) {
	var filtered = [];
	
	branches.forEach(function(branch) {
		if(calc.inRange(branch.longitude, branch.latitude, lng, lat, radius)) {
			branch.distance = calc.distance(branch.longitude, branch.latitude, lng, lat);
			filtered.push(branch);
		}
	});
	
	callback(filtered);
};

var prepareBranches = function(branches) {

	branches.forEach(function(branch) {
		// add long & lat E6 values
		branch.longitudeE6 = (branch.longitude * 1E6);
		branch.latitudeE6 = (branch.latitude * 1E6);
		
		if(branch.openTime == null || branch.openTime == undefined || branch.closeTime == null || branch.closeTime == undefined) {
			// if the open & close time is not defined, then assume open
			branch.branchOpen = true;
		} else {
			var branchTime = new time.Date();
			
			// set timezone
			try {
				branchTime.setTimezone(branch.timeZone);
			} catch(e) {
				// We got an invalid timezone
				log.error('', e.message);
			}
					
			// branch time in mins
			var branchMins = (branchTime.getHours() * 60) + (branchTime.getMinutes());
			
			// open time in mins
			var openMins = (parseInt(branch.openTime.substring(0, 2)) * 60) + (parseInt(branch.openTime.substring(3, 5)));
			
			// close time in mins
			var closeMins = (parseInt(branch.closeTime.substring(0, 2)) * 60) + (parseInt(branch.closeTime.substring(3, 5)));
					
			if((branchMins > openMins) && (branchMins < closeMins)) {
				branch.branchOpen = true;
			} else {
				branch.branchOpen = false;
			}
		}
	});
	
	return branches;
};
