/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * REST API
 */
var passport 	= require('passport')
  , client 		= require('./mobile-client');

module.exports = function(app) {
			
	var prefix = "/rest";
	
	/*
	 * Services resources
	 */
	app.get(prefix + '/services', passport.authenticate('basic', { session: false }), function(req, res, next) {	
		client.getServices(function(err, services) {
			if(err) {
				next(err);
			} else {
				res.json(200, services);
			}
		});
	});
	
	app.get(prefix + '/services/:sid/branches', passport.authenticate('basic', { session: false }), function(req, res, next) {
		var sid = req.params.sid;
		var lng = req.query.longitude;
		var lat = req.query.latitude;
		var rad = req.query.radius;
	
		// check for query params
		if(lng == null || lat == null || rad == null) {
			next('longitude, latitude, and radius must be specified.');
			return;
		}
			
		client.getBranchesForService(sid, lng, lat, rad, function(err, branches) {
			if(err) {
				next(err);
			} else {
				res.json(200, branches);
			}
		});
	});
	
	app.get(prefix + '/services/:sid/branches/:bid', passport.authenticate('basic', { session: false }), function(req, res, next) {
		var sid = req.params.sid;
		var bid = req.params.bid;
		var sent = false;
		
		client.getBranchesForService(sid, null, null, null, function(err, branches) {
			if(err) {
				next(err);
			} else {
				branches.forEach(function(branch) {
					if(branch.id == bid && !sent) {
						client.getWaitingTime(sid, branch.id, function(err, wt) {
							if(wt > 0) {
								branch.estimatedWaitTime = (wt / 60);
							} else {
								branch.estimatedWaitTime = 0;
							}
							
							res.json(200, branch);
							sent = true;
						});
					}
				});
			}
		});
	});
	
	app.post(prefix + '/services/:sid/branches/:bid/ticket/issue', passport.authenticate('basic', { session: false }), function(req, res, next) {
		var sid = req.params.sid;
		var bid = req.params.bid;
		var delay = req.query.delay;
	
		if(delay == null)
			delay = 0;
	
		client.createVisit(bid, sid, delay, function(err, visit) {
			if(err) {
				next(err);
			} else {
				res.send(200, visit);
			}
		});
	});
	
	app.post(prefix + '/services/:sid/branches/:bid/ticket/:vid/dispose', passport.authenticate('basic', { session: false }), function(req, res, next) {
		var sid = req.params.sid;
		var bid = req.params.bid;
		var vid = req.params.vid;
		
		if(vid == null) {
			next('No ticket id specified.');
			return;
		}
			
		client.removeVisit(bid, vid, function(err) {
			if(err) {
				next(err);
			} else {
				res.send(204);
			}
		});
	});
	
	app.get(prefix + '/services/:sid/nearestbranches', passport.authenticate('basic', { session: false }), function(req, res, next) {
		var sid = req.params.sid;
		var lng = req.query.longitude;
		var lat = req.query.latitude;
		var max = req.query.maxNrOfBranches;
	
		// check for query params
		if(lng == null || lat == null) {
			next('longitude and latitude must be specified.');
			return;
		}
			
		client.getBranchesForService(sid, lng, lat, null, function(err, branches) {
			if(err) {
				next(err);
			} else {
				if(branches.length > max)
					brances.slice(0, max);
				
				res.json(200, branches);
			}
		});
	});
};