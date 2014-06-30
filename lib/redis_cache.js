/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Redis cache implementation
 */
var client
  , host = '127.0.0.1'
  , port = 6379 
  , redis = require("redis");

function Cache() {
	client = redis.createClient(port, host);
}
	
Cache.prototype.get = function(key, callback) {
	client.get(key, function(err, reply) {
		if(err) {
			callback(null);
		} else {
			callback(JSON.parse(reply));
		}
	});
};
	
Cache.prototype.has = function(key, callback) {
	client.exists(key, function(err, data) {
		if(err)
			callback(false);
		
		if(data == null) {
			callback(false);
		} else {
			if(data == 1) {
				callback(true);
			} else {
				callback(false);
			}
		}
	});
};

Cache.prototype.put = function(key, data, seconds) {
	seconds = parseInt(seconds, 10);
	client.setex(key, seconds, data);
};

Cache.prototype.clean = function(key) {
	
	client.del(key);
};

module.exports = Cache;
