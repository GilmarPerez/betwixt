/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Distance calculator
 */
var EARTH_RADIUS 		= 3958.75
  , METER_CONVERSION 	= 1609;

/*
 * Determines if two sets of coordinates are within each others radius range.
 * Uses the Haversine formula (http://en.wikipedia.org/wiki/Haversine_formula)
 */   
exports.inRange = function(long1, lat1, long2, lat2, radius) {
	return distance(long1, lat1, long2, lat2) < radius;
};

/*
 * Returns the distance between two points.
 */
exports.distance = function(long1, lat1, long2, lat2) {
	return distance(long1, lat1, long2, lat2);
}

var distance = function(long1, lat1, long2, lat2) {
	var lo1 = Number(long1);
	var la1 = Number(lat1);
	var lo2 = Number(long2);
	var la2 = Number(lat2);
	
	var dlat = (lat2 - lat1).toRad();
	var dlng = (lo2 - lo1).toRad();
	
	var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
			Math.cos(la1.toRad()) *
			Math.cos(la2.toRad()) * Math.sin(dlng / 2) *
			Math.sin(dlng / 2);
			
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	
	return EARTH_RADIUS * c * METER_CONVERSION;
}

/** Converts numeric degrees to radians */
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}