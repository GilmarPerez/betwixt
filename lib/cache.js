/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * In-Memory cache
 */
var _cache = [];

function Cache() {
	// cache holder
	_cache = [];
}
	
Cache.prototype.get = function(key, callback) {
	callback(JSON.parse(_cache[key]) || null);
};
	
Cache.prototype.has = function(key, callback) {
	callback(!!_cache[key]);
};

Cache.prototype.put = function(key, data, seconds) {
	_cache[key] = data;
	
	seconds = parseInt(seconds, 10);
	if(seconds > 0) 
		setTimeout(function() {
			this.clean(key);
		}.bind(this), seconds * 1000);
};

Cache.prototype.clean = function(key) {
	
	if(!delete _cache[key])
		_cache[key] = null;
};

module.exports = Cache;
