#betwixt
Sample mobile backend service for [Qmatic](http://www.qmatic.com) Orchestra

##Overview
Provides a mobile middleware service to expose Orchestra Mobile API functions to mobile app developers.
Designed to be run externally from Orchestra host environment (e.g. within DMZ or cloud).

Written in JavaScript using node.js. The following packages are used:

* [express](http://expressjs.com) Web application framework
* [ws](https://github.com/einaros/ws) Websocket implementation
* [buffalo](https://github.com/marcello3d/node-buffalo) BSON library
* [time](https://github.com/TooTallNate/node-time) Timezone handling
* [passport](http://passportjs.org) Authentication middleware
* [cors](https://github.com/troygoode/node-cors/) [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) support
* [npmlog](https://github.com/npm/npmlog) Logging framework

##Functionality
###Websockets
Provides a websocket server that Orchestra cloud services module will talk to to provide bi-directional 
communication channel with Orchestra server through firewall with no ingress required to Orchestra host.

###SSL encryption
**NOTE:** Default implementation uses an insecure self-signed certificate in /certs directory. This is  
**only** for development.  
Best practise for production deployment would be to install an SSL terminating proxy in front of the  
betwixt host machine and configure application to use HTTP instead of HTTPS.

###Caching layer
To prevent overloading Orchestra with request from mobile clients the middleware performs caching of 
Branch and Service data. Default implementation uses a non-scalable in-memory cache, for production  
deployment it is recommended to replace this implementation with a more robust distributed caching  
mechanism. A sample [lib/redis_cache.js](lib/redis_cache.js) using [Redis](http://redis.io) is provided.

##Using
* Clone this repo `git clone git@github.com:qmatic/betwixt.git`
* Install [node.js](http://nodejs.org)
* Run `npm install` from repo root to install node.js dependencies
* Run `node app` from repo root to start server
 
###Orchestra
* Mobile enable required Services and Branches within Orchestra configuration. 
* Enable system parameter (Cloud Services)
* Restart Orchestra service

**NOTE:** Current Orchestra implementation is hard-coded to communicate with URL `www.qmaticbeat.com` 
in order to use different middleware host a line must be added to the hosts file on the Orchestra 
server.

	127.0.0.1		www.qmaticbeat.com

###API
See [wiki](https://github.com/qmatic/betwixt/wiki/API) for API documentation
