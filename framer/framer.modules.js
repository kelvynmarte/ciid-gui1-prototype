require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = require('./sb-1.1.0').Spacebrew;


},{"./sb-1.1.0":2}],2:[function(require,module,exports){
/**
 * 
 * Spacebrew Library for Javascript
 * --------------------------------
 *  
 * This library was designed to work on front-end (browser) envrionments, and back-end (server) 
 * environments. Please refer to the readme file, the documentation and examples to learn how to 
 * use this library.
 * 
 * Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive 
 * spaces. Or, in other words, a simple way to connect interactive things to one another. Learn 
 * more about Spacebrew here: http://docs.spacebrew.cc/
 *
 * To import into your web apps, we recommend using the minimized version of this library, 
 * filename sb-1.0.4.min.js.
 *
 * Latest Updates:
 * - enable client apps to extend libs with admin functionality.
 * - added close method to close Spacebrew connection.
 * 
 * @author 		Brett Renfer and Julio Terra from LAB @ Rockwell Group
 * @filename	sb-1.1.0-alpha.js
 * @version 	1.1.0-alpha
 * @date 		Mar 24, 2013
 * 
 */

/**
 * Check if Bind method exists in current enviroment. If not, it creates an implementation of
 * this useful method.
 */
if (!Function.prototype.bind) {  
  Function.prototype.bind = function (oThis) {  
	if (typeof this !== "function") {  
	  // closest thing possible to the ECMAScript 5 internal IsCallable function  
	  throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
	} 
  
	var aArgs = Array.prototype.slice.call(arguments, 1),   
		fToBind = this,   
		fNOP = function () {},  
		fBound = function () {  
		  return fToBind.apply(this instanceof fNOP  
								 ? this  
								 : oThis || window,  
							    aArgs.concat(Array.prototype.slice.call(arguments)));  
		};  
  
	fNOP.prototype = this.prototype;  
	fBound.prototype = new fNOP();  
  
	return fBound;  
  };  
} 

/**
 * @namespace for Spacebrew library
 */
var Spacebrew = Spacebrew || {};

/**
 * create placeholder var for WebSocket object, if it does not already exist
 */
var WebSocket = WebSocket || {};


/**
 * Check if Running in Browser or Server (Node) Environment * 
 */

// check if window object already exists to determine if running browswer
var window = window || undefined;

// check if module object already exists to determine if this is a node application
var module = module || undefined;

// if app is running in a browser, then define the getQueryString method
if (window) {
	if (!window['getQueryString']){
		/**
		 * Get parameters from a query string
		 * @param  {String} name Name of query string to parse (w/o '?' or '&')
		 * @return {String}	value of parameter (or empty string if not found)
		 */
		window.getQueryString = function( name ) {
			if (!window.location) return;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( window.location.href );
			if( results == null ) return "";
			else return results[1];
		}
	}	
}

// if app is running in a node server environment then package Spacebrew library as a module.
// 		WebSocket module (ws) needs to be saved in a node_modules so that it can be imported.
if (!window && module) {
	WebSocket = require("ws");
	module.exports = {
		Spacebrew: Spacebrew
	} 
}


/**
 * Define the Spacebrew Library * 
 */

/**
 * Spacebrew client!
 * @constructor
 * @param  {String} server      (Optional) Base address of Spacebrew server. This server address is overwritten if server defined in query string; defaults to localhost.
 * @param  {String} name        (Optional) Base name of app. Base name is overwritten if "name" is defined in query string; defaults to window.location.href.
 * @param  {String} description (Optional) Base description of app. Description name is overwritten if "description" is defined in query string;
 * @param  {Object} options		(Optional) An object that holds the optional parameters described below
 *         			port 		(Optional) Port number for the Spacebrew server
 *            		admin 		(Optional) Flag that identifies when app should register for admin privileges with server
 *              	debug 		(Optional) Debug flag that turns on info and debug messaging (limited use)
 */
Spacebrew.Client = function( server, name, description, options ){

	var options = options || {};

	this.debug = options.debug || false;

	/**
	 * Name of app
	 * @type {String}
	 */
	this._name = name || "javascript client";
	if (window) {
		this._name = (window.getQueryString('name') !== "" ? unescape(window.getQueryString('name')) : this._name);
	}
	
	/**
	 * Description of your app
	 * @type {String}
	 */
	this._description = description || "spacebrew javascript client";
	if (window) {
		this._description = (window.getQueryString('description') !== "" ? unescape(window.getQueryString('description')) : this._description);
	}

	/**
	 * Spacebrew server to which the app will connect
	 * @type {String}
	 */
	this.server = server || "sandbox.spacebrew.cc";
	if (window) {
		this.server = (window.getQueryString('server') !== "" ? unescape(window.getQueryString('server')) : this.server);
	}

	/**
	 * Port number on which Spacebrew server is running
	 * @type {Integer}
	 */
	this.port = options.port || 9000;
	if (window) {
		port = window.getQueryString('port');
		if (port !== "" && !isNaN(port)) { 
			this.port = port; 
		} 
	}

	/**
	 * Reference to WebSocket
	 * @type {WebSocket}
	 */
	this.socket = null;

	/**
	 * Configuration file for Spacebrew
	 * @type {Object}
	 */
	this.client_config = {
		name: this._name,
		description: this._description,
		publish:{
			messages:[]
		},
		subscribe:{
			messages:[]
		}
	};

	this.admin = {}

	/**
	 * Are we connected to a Spacebrew server?
	 * @type {Boolean}
	 */
	this._isConnected = false;
}

/**
 * Connect to Spacebrew 
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype.connect = function(){
	try {
		this.socket 	 		= new WebSocket("ws://" + this.server + ":" + this.port);
		this.socket.onopen 		= this._onOpen.bind(this);
		this.socket.onmessage 	= this._onMessage.bind(this);
		this.socket.onclose 	= this._onClose.bind(this);
	} catch(e){
		this._isConnected = false;
		console.log("[connect:Spacebrew] connection attempt failed")
	}
}

/**
 * Close Spacebrew connection
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype.close = function(){
	try {
		if (this._isConnected == true) {
			this.socket.close();
			this._isConnected = false;
			console.log("[close:Spacebrew] closing websocket connection")
		}		
	} catch (e) {		
		this._isConnected = false;
	}
}

/**
 * Override in your app to receive on open event for connection
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onOpen = function( name, value ){}


/**
 * Override in your app to receive on close event for connection
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onClose = function( name, value ){}

/**
 * Override in your app to receive "range" messages, e.g. sb.onRangeMessage = yourRangeFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onRangeMessage = function( name, value ){}

/**
 * Override in your app to receive "boolean" messages, e.g. sb.onBooleanMessage = yourBoolFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onBooleanMessage = function( name, value ){}

/**
 * Override in your app to receive "string" messages, e.g. sb.onStringMessage = yourStringFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onStringMessage = function( name, value ){}

/**
 * Override in your app to receive "custom" messages, e.g. sb.onCustomMessage = yourStringFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onCustomMessage = function( name, value, type ){}


/**
 * Add a route you are publishing on 
 * @param {String} name Name of incoming route
 * @param {String} type "boolean", "range", or "string"
 * @param {String} def  default value
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.addPublish = function( name, type, def ){
	this.client_config.publish.messages.push({"name":name, "type":type, "default":def});
	this.updatePubSub();
}

/**
 * [addSubscriber description]
 * @param {String} name Name of outgoing route
 * @param {String} type "boolean", "range", or "string"
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.addSubscribe = function( name, type ){
	this.client_config.subscribe.messages.push({"name":name, "type":type });
	this.updatePubSub();
}

/**
 * Update publishers and subscribers
 * @memberOf Spacebrew.Client
 * @private
 */
Spacebrew.Client.prototype.updatePubSub = function(){
	if (this._isConnected) {
		this.socket.send(JSON.stringify({"config": this.client_config}));
	}
}

/**
 * Send a route to Spacebrew
 * @param  {String} name  Name of outgoing route (must match something in addPublish)
 * @param  {String} type  "boolean", "range", or "string"
 * @param  {String} value Value to send
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.send = function( name, type, value ){
	var message = {
		message: {
           clientName:this._name,
           name:name,
           type:type,
           value:value
       }
   	};

   	//console.log(message);
   	this.socket.send(JSON.stringify(message));
}

/**
 * Called on WebSocket open
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onOpen = function() {
    console.log("[_onOpen:Spacebrew] Spacebrew connection opened, client name is: " + this._name);

	this._isConnected = true;
	if (this.admin.active) this.connectAdmin();

  	// send my config
  	this.updatePubSub();
  	this.onOpen();
}

/**
 * Called on WebSocket message
 * @private
 * @param  {Object} e
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onMessage = function( e ){
	var data = JSON.parse(e.data)
		, name
		, type
		, value
		;

	// handle client messages 
	if (data["message"]) {
		// check to make sure that this is not an admin message
		if (!data.message["clientName"]) {
			name = data.message.name;
		    type = data.message.type;
			value = data.message.value;

			switch( type ){
				case "boolean":
					this.onBooleanMessage( name, value == "true" );
					break;
				case "string":
					this.onStringMessage( name, value );
					break;
				case "range":
					this.onRangeMessage( name, Number(value) );
					break;
				default:
					this.onCustomMessage( name, value, type );
			}			
		}
	} 

	// handle admin messages
	else {
		if (this.admin.active) {
			this._handleAdminMessages( data );		
		}
	}
}

/**
 * Called on WebSocket close
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onClose = function() {
    console.log("[_onClose:Spacebrew] Spacebrew connection closed");

	this._isConnected = false;
	if (this.admin.active) this.admin.remoteAddress = undefined;

	this.onClose();
};

/**
 * name Method that sets or gets the spacebrew app name. If parameter is provided then it sets the name, otherwise
 * 		it just returns the current app name.
 * @param  {String} newName New name of the spacebrew app
 * @return {String} Returns the name of the spacebrew app if called as a getter function. If called as a 
 *                  setter function it will return false if the method is called after connecting to spacebrew, 
 *                  because the name must be configured before connection is made.
 */
Spacebrew.Client.prototype.name = function (newName){
	if (newName) {								// if a name has been passed in then update it
		if (this._isConnected) return false;  	// if already connected we can't update name
		this._name = newName;	
		if (window) {
			this._name = (window.getQueryString('name') !== "" ? unescape(window.getQueryString('name')) : this._name);
		}
		this.client_config.name = this._name;			// update spacebrew config file
	} 	
	return this._name;	
};

/**
 * name Method that sets or gets the spacebrew app description. If parameter is provided then it sets the description, 
 * 		otherwise it just returns the current app description.
 * @param  {String} newDesc New description of the spacebrew app
 * @return {String} Returns the description of the spacebrew app if called as a getter function. If called as a 
 *                  setter function it will return false if the method is called after connecting to spacebrew, 
 *                  because the description must be configured before connection is made.
 */
Spacebrew.Client.prototype.description = function (newDesc){
	if (newDesc) {								// if a description has been passed in then update it
		if (this._isConnected) return false;  	// if already connected we can't update description
		this._description = newDesc || "spacebrew javascript client";
		if (window) {
			this._description = (window.getQueryString('description') !== "" ? unescape(window.getQueryString('description')) : this._description);
		}
		this.client_config.description = this._description;	// update spacebrew config file
	} 
	return this._description;	
};

/**
 * isConnected Method that returns current connection state of the spacebrew client.
 * @return {Boolean} Returns true if currently connected to Spacebrew
 */
Spacebrew.Client.prototype.isConnected = function (){
	return this._isConnected;	
};


Spacebrew.Client.prototype.extend = function ( mixin ) {    
    for (var prop in mixin) {
        if (mixin.hasOwnProperty(prop)) {
            this[prop] = mixin[prop];
        }
    }
};




},{"ws":3}],3:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],"myModule":[function(require,module,exports){
exports.myVar = "myVariable";

exports.myFunction = function() {
  return print("myFunction is running");
};

exports.myArray = [1, 2, 3];


},{}],"npm":[function(require,module,exports){
exports.Spacebrew = require("Spacebrew");


},{"Spacebrew":1}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2tlbHZ5bi9Qcm9qZWN0cy8yMDE3XzA1IEdVSSAyLzA1IFByb2R1Y3Rpb24vRnJhbWVyL0xvb2sgT3V0IDA3LmZyYW1lci9tb2R1bGVzL25wbS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy9rZWx2eW4vUHJvamVjdHMvMjAxN18wNSBHVUkgMi8wNSBQcm9kdWN0aW9uL0ZyYW1lci9Mb29rIE91dCAwNy5mcmFtZXIvbW9kdWxlcy9teU1vZHVsZS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy9rZWx2eW4vUHJvamVjdHMvMjAxN18wNSBHVUkgMi8wNSBQcm9kdWN0aW9uL0ZyYW1lci9Mb29rIE91dCAwNy5mcmFtZXIvbm9kZV9tb2R1bGVzL3dzL2xpYi9icm93c2VyLmpzIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMva2VsdnluL1Byb2plY3RzLzIwMTdfMDUgR1VJIDIvMDUgUHJvZHVjdGlvbi9GcmFtZXIvTG9vayBPdXQgMDcuZnJhbWVyL25vZGVfbW9kdWxlcy9TcGFjZWJyZXcvbGliL3NiLTEuMS4wLmpzIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMva2VsdnluL1Byb2plY3RzLzIwMTdfMDUgR1VJIDIvMDUgUHJvZHVjdGlvbi9GcmFtZXIvTG9vayBPdXQgMDcuZnJhbWVyL25vZGVfbW9kdWxlcy9TcGFjZWJyZXcvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnRzLlNwYWNlYnJldyA9IHJlcXVpcmUgXCJTcGFjZWJyZXdcIlxuIiwiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBnbG9iYWwgPSAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSgpO1xuXG4vKipcbiAqIFdlYlNvY2tldCBjb25zdHJ1Y3Rvci5cbiAqL1xuXG52YXIgV2ViU29ja2V0ID0gZ2xvYmFsLldlYlNvY2tldCB8fCBnbG9iYWwuTW96V2ViU29ja2V0O1xuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gV2ViU29ja2V0ID8gd3MgOiBudWxsO1xuXG4vKipcbiAqIFdlYlNvY2tldCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGUgdGhpcmQgYG9wdHNgIG9wdGlvbnMgb2JqZWN0IGdldHMgaWdub3JlZCBpbiB3ZWIgYnJvd3NlcnMsIHNpbmNlIGl0J3NcbiAqIG5vbi1zdGFuZGFyZCwgYW5kIHRocm93cyBhIFR5cGVFcnJvciBpZiBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICogU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZWluYXJvcy93cy9pc3N1ZXMvMjI3XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVyaVxuICogQHBhcmFtIHtBcnJheX0gcHJvdG9jb2xzIChvcHRpb25hbClcbiAqIEBwYXJhbSB7T2JqZWN0KSBvcHRzIChvcHRpb25hbClcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gd3ModXJpLCBwcm90b2NvbHMsIG9wdHMpIHtcbiAgdmFyIGluc3RhbmNlO1xuICBpZiAocHJvdG9jb2xzKSB7XG4gICAgaW5zdGFuY2UgPSBuZXcgV2ViU29ja2V0KHVyaSwgcHJvdG9jb2xzKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW5jZSA9IG5ldyBXZWJTb2NrZXQodXJpKTtcbiAgfVxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmlmIChXZWJTb2NrZXQpIHdzLnByb3RvdHlwZSA9IFdlYlNvY2tldC5wcm90b3R5cGU7XG4iLCIvKipcbiAqIFxuICogU3BhY2VicmV3IExpYnJhcnkgZm9yIEphdmFzY3JpcHRcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgXG4gKiBUaGlzIGxpYnJhcnkgd2FzIGRlc2lnbmVkIHRvIHdvcmsgb24gZnJvbnQtZW5kIChicm93c2VyKSBlbnZyaW9ubWVudHMsIGFuZCBiYWNrLWVuZCAoc2VydmVyKSBcbiAqIGVudmlyb25tZW50cy4gUGxlYXNlIHJlZmVyIHRvIHRoZSByZWFkbWUgZmlsZSwgdGhlIGRvY3VtZW50YXRpb24gYW5kIGV4YW1wbGVzIHRvIGxlYXJuIGhvdyB0byBcbiAqIHVzZSB0aGlzIGxpYnJhcnkuXG4gKiBcbiAqIFNwYWNlYnJldyBpcyBhbiBvcGVuLCBkeW5hbWljYWxseSByZS1yb3V0YWJsZSBzb2Z0d2FyZSB0b29sa2l0IGZvciBjaG9yZW9ncmFwaGluZyBpbnRlcmFjdGl2ZSBcbiAqIHNwYWNlcy4gT3IsIGluIG90aGVyIHdvcmRzLCBhIHNpbXBsZSB3YXkgdG8gY29ubmVjdCBpbnRlcmFjdGl2ZSB0aGluZ3MgdG8gb25lIGFub3RoZXIuIExlYXJuIFxuICogbW9yZSBhYm91dCBTcGFjZWJyZXcgaGVyZTogaHR0cDovL2RvY3Muc3BhY2VicmV3LmNjL1xuICpcbiAqIFRvIGltcG9ydCBpbnRvIHlvdXIgd2ViIGFwcHMsIHdlIHJlY29tbWVuZCB1c2luZyB0aGUgbWluaW1pemVkIHZlcnNpb24gb2YgdGhpcyBsaWJyYXJ5LCBcbiAqIGZpbGVuYW1lIHNiLTEuMC40Lm1pbi5qcy5cbiAqXG4gKiBMYXRlc3QgVXBkYXRlczpcbiAqIC0gZW5hYmxlIGNsaWVudCBhcHBzIHRvIGV4dGVuZCBsaWJzIHdpdGggYWRtaW4gZnVuY3Rpb25hbGl0eS5cbiAqIC0gYWRkZWQgY2xvc2UgbWV0aG9kIHRvIGNsb3NlIFNwYWNlYnJldyBjb25uZWN0aW9uLlxuICogXG4gKiBAYXV0aG9yIFx0XHRCcmV0dCBSZW5mZXIgYW5kIEp1bGlvIFRlcnJhIGZyb20gTEFCIEAgUm9ja3dlbGwgR3JvdXBcbiAqIEBmaWxlbmFtZVx0c2ItMS4xLjAtYWxwaGEuanNcbiAqIEB2ZXJzaW9uIFx0MS4xLjAtYWxwaGFcbiAqIEBkYXRlIFx0XHRNYXIgMjQsIDIwMTNcbiAqIFxuICovXG5cbi8qKlxuICogQ2hlY2sgaWYgQmluZCBtZXRob2QgZXhpc3RzIGluIGN1cnJlbnQgZW52aXJvbWVudC4gSWYgbm90LCBpdCBjcmVhdGVzIGFuIGltcGxlbWVudGF0aW9uIG9mXG4gKiB0aGlzIHVzZWZ1bCBtZXRob2QuXG4gKi9cbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHsgIFxuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykgeyAgXG5cdGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7ICBcblx0ICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDUgaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvbiAgXG5cdCAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlXCIpOyAgXG5cdH0gXG4gIFxuXHR2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCAgIFxuXHRcdGZUb0JpbmQgPSB0aGlzLCAgIFxuXHRcdGZOT1AgPSBmdW5jdGlvbiAoKSB7fSwgIFxuXHRcdGZCb3VuZCA9IGZ1bmN0aW9uICgpIHsgIFxuXHRcdCAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1AgIFxuXHRcdFx0XHRcdFx0XHRcdCA/IHRoaXMgIFxuXHRcdFx0XHRcdFx0XHRcdCA6IG9UaGlzIHx8IHdpbmRvdywgIFxuXHRcdFx0XHRcdFx0XHQgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTsgIFxuXHRcdH07ICBcbiAgXG5cdGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7ICBcblx0ZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7ICBcbiAgXG5cdHJldHVybiBmQm91bmQ7ICBcbiAgfTsgIFxufSBcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGZvciBTcGFjZWJyZXcgbGlicmFyeVxuICovXG52YXIgU3BhY2VicmV3ID0gU3BhY2VicmV3IHx8IHt9O1xuXG4vKipcbiAqIGNyZWF0ZSBwbGFjZWhvbGRlciB2YXIgZm9yIFdlYlNvY2tldCBvYmplY3QsIGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3RcbiAqL1xudmFyIFdlYlNvY2tldCA9IFdlYlNvY2tldCB8fCB7fTtcblxuXG4vKipcbiAqIENoZWNrIGlmIFJ1bm5pbmcgaW4gQnJvd3NlciBvciBTZXJ2ZXIgKE5vZGUpIEVudmlyb25tZW50ICogXG4gKi9cblxuLy8gY2hlY2sgaWYgd2luZG93IG9iamVjdCBhbHJlYWR5IGV4aXN0cyB0byBkZXRlcm1pbmUgaWYgcnVubmluZyBicm93c3dlclxudmFyIHdpbmRvdyA9IHdpbmRvdyB8fCB1bmRlZmluZWQ7XG5cbi8vIGNoZWNrIGlmIG1vZHVsZSBvYmplY3QgYWxyZWFkeSBleGlzdHMgdG8gZGV0ZXJtaW5lIGlmIHRoaXMgaXMgYSBub2RlIGFwcGxpY2F0aW9uXG52YXIgbW9kdWxlID0gbW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuLy8gaWYgYXBwIGlzIHJ1bm5pbmcgaW4gYSBicm93c2VyLCB0aGVuIGRlZmluZSB0aGUgZ2V0UXVlcnlTdHJpbmcgbWV0aG9kXG5pZiAod2luZG93KSB7XG5cdGlmICghd2luZG93WydnZXRRdWVyeVN0cmluZyddKXtcblx0XHQvKipcblx0XHQgKiBHZXQgcGFyYW1ldGVycyBmcm9tIGEgcXVlcnkgc3RyaW5nXG5cdFx0ICogQHBhcmFtICB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgcXVlcnkgc3RyaW5nIHRvIHBhcnNlICh3L28gJz8nIG9yICcmJylcblx0XHQgKiBAcmV0dXJuIHtTdHJpbmd9XHR2YWx1ZSBvZiBwYXJhbWV0ZXIgKG9yIGVtcHR5IHN0cmluZyBpZiBub3QgZm91bmQpXG5cdFx0ICovXG5cdFx0d2luZG93LmdldFF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24oIG5hbWUgKSB7XG5cdFx0XHRpZiAoIXdpbmRvdy5sb2NhdGlvbikgcmV0dXJuO1xuXHRcdFx0bmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW10vLFwiXFxcXFxcW1wiKS5yZXBsYWNlKC9bXFxdXS8sXCJcXFxcXFxdXCIpO1xuXHRcdFx0dmFyIHJlZ2V4UyA9IFwiW1xcXFw/Jl1cIituYW1lK1wiPShbXiYjXSopXCI7XG5cdFx0XHR2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCByZWdleFMgKTtcblx0XHRcdHZhciByZXN1bHRzID0gcmVnZXguZXhlYyggd2luZG93LmxvY2F0aW9uLmhyZWYgKTtcblx0XHRcdGlmKCByZXN1bHRzID09IG51bGwgKSByZXR1cm4gXCJcIjtcblx0XHRcdGVsc2UgcmV0dXJuIHJlc3VsdHNbMV07XG5cdFx0fVxuXHR9XHRcbn1cblxuLy8gaWYgYXBwIGlzIHJ1bm5pbmcgaW4gYSBub2RlIHNlcnZlciBlbnZpcm9ubWVudCB0aGVuIHBhY2thZ2UgU3BhY2VicmV3IGxpYnJhcnkgYXMgYSBtb2R1bGUuXG4vLyBcdFx0V2ViU29ja2V0IG1vZHVsZSAod3MpIG5lZWRzIHRvIGJlIHNhdmVkIGluIGEgbm9kZV9tb2R1bGVzIHNvIHRoYXQgaXQgY2FuIGJlIGltcG9ydGVkLlxuaWYgKCF3aW5kb3cgJiYgbW9kdWxlKSB7XG5cdFdlYlNvY2tldCA9IHJlcXVpcmUoXCJ3c1wiKTtcblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdFx0U3BhY2VicmV3OiBTcGFjZWJyZXdcblx0fSBcbn1cblxuXG4vKipcbiAqIERlZmluZSB0aGUgU3BhY2VicmV3IExpYnJhcnkgKiBcbiAqL1xuXG4vKipcbiAqIFNwYWNlYnJldyBjbGllbnQhXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VydmVyICAgICAgKE9wdGlvbmFsKSBCYXNlIGFkZHJlc3Mgb2YgU3BhY2VicmV3IHNlcnZlci4gVGhpcyBzZXJ2ZXIgYWRkcmVzcyBpcyBvdmVyd3JpdHRlbiBpZiBzZXJ2ZXIgZGVmaW5lZCBpbiBxdWVyeSBzdHJpbmc7IGRlZmF1bHRzIHRvIGxvY2FsaG9zdC5cbiAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSAgICAgICAgKE9wdGlvbmFsKSBCYXNlIG5hbWUgb2YgYXBwLiBCYXNlIG5hbWUgaXMgb3ZlcndyaXR0ZW4gaWYgXCJuYW1lXCIgaXMgZGVmaW5lZCBpbiBxdWVyeSBzdHJpbmc7IGRlZmF1bHRzIHRvIHdpbmRvdy5sb2NhdGlvbi5ocmVmLlxuICogQHBhcmFtICB7U3RyaW5nfSBkZXNjcmlwdGlvbiAoT3B0aW9uYWwpIEJhc2UgZGVzY3JpcHRpb24gb2YgYXBwLiBEZXNjcmlwdGlvbiBuYW1lIGlzIG92ZXJ3cml0dGVuIGlmIFwiZGVzY3JpcHRpb25cIiBpcyBkZWZpbmVkIGluIHF1ZXJ5IHN0cmluZztcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1x0XHQoT3B0aW9uYWwpIEFuIG9iamVjdCB0aGF0IGhvbGRzIHRoZSBvcHRpb25hbCBwYXJhbWV0ZXJzIGRlc2NyaWJlZCBiZWxvd1xuICogICAgICAgICBcdFx0XHRwb3J0IFx0XHQoT3B0aW9uYWwpIFBvcnQgbnVtYmVyIGZvciB0aGUgU3BhY2VicmV3IHNlcnZlclxuICogICAgICAgICAgICBcdFx0YWRtaW4gXHRcdChPcHRpb25hbCkgRmxhZyB0aGF0IGlkZW50aWZpZXMgd2hlbiBhcHAgc2hvdWxkIHJlZ2lzdGVyIGZvciBhZG1pbiBwcml2aWxlZ2VzIHdpdGggc2VydmVyXG4gKiAgICAgICAgICAgICAgXHRkZWJ1ZyBcdFx0KE9wdGlvbmFsKSBEZWJ1ZyBmbGFnIHRoYXQgdHVybnMgb24gaW5mbyBhbmQgZGVidWcgbWVzc2FnaW5nIChsaW1pdGVkIHVzZSlcbiAqL1xuU3BhY2VicmV3LkNsaWVudCA9IGZ1bmN0aW9uKCBzZXJ2ZXIsIG5hbWUsIGRlc2NyaXB0aW9uLCBvcHRpb25zICl7XG5cblx0dmFyIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnIHx8IGZhbHNlO1xuXG5cdC8qKlxuXHQgKiBOYW1lIG9mIGFwcFxuXHQgKiBAdHlwZSB7U3RyaW5nfVxuXHQgKi9cblx0dGhpcy5fbmFtZSA9IG5hbWUgfHwgXCJqYXZhc2NyaXB0IGNsaWVudFwiO1xuXHRpZiAod2luZG93KSB7XG5cdFx0dGhpcy5fbmFtZSA9ICh3aW5kb3cuZ2V0UXVlcnlTdHJpbmcoJ25hbWUnKSAhPT0gXCJcIiA/IHVuZXNjYXBlKHdpbmRvdy5nZXRRdWVyeVN0cmluZygnbmFtZScpKSA6IHRoaXMuX25hbWUpO1xuXHR9XG5cdFxuXHQvKipcblx0ICogRGVzY3JpcHRpb24gb2YgeW91ciBhcHBcblx0ICogQHR5cGUge1N0cmluZ31cblx0ICovXG5cdHRoaXMuX2Rlc2NyaXB0aW9uID0gZGVzY3JpcHRpb24gfHwgXCJzcGFjZWJyZXcgamF2YXNjcmlwdCBjbGllbnRcIjtcblx0aWYgKHdpbmRvdykge1xuXHRcdHRoaXMuX2Rlc2NyaXB0aW9uID0gKHdpbmRvdy5nZXRRdWVyeVN0cmluZygnZGVzY3JpcHRpb24nKSAhPT0gXCJcIiA/IHVuZXNjYXBlKHdpbmRvdy5nZXRRdWVyeVN0cmluZygnZGVzY3JpcHRpb24nKSkgOiB0aGlzLl9kZXNjcmlwdGlvbik7XG5cdH1cblxuXHQvKipcblx0ICogU3BhY2VicmV3IHNlcnZlciB0byB3aGljaCB0aGUgYXBwIHdpbGwgY29ubmVjdFxuXHQgKiBAdHlwZSB7U3RyaW5nfVxuXHQgKi9cblx0dGhpcy5zZXJ2ZXIgPSBzZXJ2ZXIgfHwgXCJzYW5kYm94LnNwYWNlYnJldy5jY1wiO1xuXHRpZiAod2luZG93KSB7XG5cdFx0dGhpcy5zZXJ2ZXIgPSAod2luZG93LmdldFF1ZXJ5U3RyaW5nKCdzZXJ2ZXInKSAhPT0gXCJcIiA/IHVuZXNjYXBlKHdpbmRvdy5nZXRRdWVyeVN0cmluZygnc2VydmVyJykpIDogdGhpcy5zZXJ2ZXIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBvcnQgbnVtYmVyIG9uIHdoaWNoIFNwYWNlYnJldyBzZXJ2ZXIgaXMgcnVubmluZ1xuXHQgKiBAdHlwZSB7SW50ZWdlcn1cblx0ICovXG5cdHRoaXMucG9ydCA9IG9wdGlvbnMucG9ydCB8fCA5MDAwO1xuXHRpZiAod2luZG93KSB7XG5cdFx0cG9ydCA9IHdpbmRvdy5nZXRRdWVyeVN0cmluZygncG9ydCcpO1xuXHRcdGlmIChwb3J0ICE9PSBcIlwiICYmICFpc05hTihwb3J0KSkgeyBcblx0XHRcdHRoaXMucG9ydCA9IHBvcnQ7IFxuXHRcdH0gXG5cdH1cblxuXHQvKipcblx0ICogUmVmZXJlbmNlIHRvIFdlYlNvY2tldFxuXHQgKiBAdHlwZSB7V2ViU29ja2V0fVxuXHQgKi9cblx0dGhpcy5zb2NrZXQgPSBudWxsO1xuXG5cdC8qKlxuXHQgKiBDb25maWd1cmF0aW9uIGZpbGUgZm9yIFNwYWNlYnJld1xuXHQgKiBAdHlwZSB7T2JqZWN0fVxuXHQgKi9cblx0dGhpcy5jbGllbnRfY29uZmlnID0ge1xuXHRcdG5hbWU6IHRoaXMuX25hbWUsXG5cdFx0ZGVzY3JpcHRpb246IHRoaXMuX2Rlc2NyaXB0aW9uLFxuXHRcdHB1Ymxpc2g6e1xuXHRcdFx0bWVzc2FnZXM6W11cblx0XHR9LFxuXHRcdHN1YnNjcmliZTp7XG5cdFx0XHRtZXNzYWdlczpbXVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmFkbWluID0ge31cblxuXHQvKipcblx0ICogQXJlIHdlIGNvbm5lY3RlZCB0byBhIFNwYWNlYnJldyBzZXJ2ZXI/XG5cdCAqIEB0eXBlIHtCb29sZWFufVxuXHQgKi9cblx0dGhpcy5faXNDb25uZWN0ZWQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb25uZWN0IHRvIFNwYWNlYnJldyBcbiAqIEBtZW1iZXJPZiBTcGFjZWJyZXcuQ2xpZW50XG4gKi9cblNwYWNlYnJldy5DbGllbnQucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbigpe1xuXHR0cnkge1xuXHRcdHRoaXMuc29ja2V0IFx0IFx0XHQ9IG5ldyBXZWJTb2NrZXQoXCJ3czovL1wiICsgdGhpcy5zZXJ2ZXIgKyBcIjpcIiArIHRoaXMucG9ydCk7XG5cdFx0dGhpcy5zb2NrZXQub25vcGVuIFx0XHQ9IHRoaXMuX29uT3Blbi5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuc29ja2V0Lm9ubWVzc2FnZSBcdD0gdGhpcy5fb25NZXNzYWdlLmJpbmQodGhpcyk7XG5cdFx0dGhpcy5zb2NrZXQub25jbG9zZSBcdD0gdGhpcy5fb25DbG9zZS5iaW5kKHRoaXMpO1xuXHR9IGNhdGNoKGUpe1xuXHRcdHRoaXMuX2lzQ29ubmVjdGVkID0gZmFsc2U7XG5cdFx0Y29uc29sZS5sb2coXCJbY29ubmVjdDpTcGFjZWJyZXddIGNvbm5lY3Rpb24gYXR0ZW1wdCBmYWlsZWRcIilcblx0fVxufVxuXG4vKipcbiAqIENsb3NlIFNwYWNlYnJldyBjb25uZWN0aW9uXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCl7XG5cdHRyeSB7XG5cdFx0aWYgKHRoaXMuX2lzQ29ubmVjdGVkID09IHRydWUpIHtcblx0XHRcdHRoaXMuc29ja2V0LmNsb3NlKCk7XG5cdFx0XHR0aGlzLl9pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coXCJbY2xvc2U6U3BhY2VicmV3XSBjbG9zaW5nIHdlYnNvY2tldCBjb25uZWN0aW9uXCIpXG5cdFx0fVx0XHRcblx0fSBjYXRjaCAoZSkge1x0XHRcblx0XHR0aGlzLl9pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuXHR9XG59XG5cbi8qKlxuICogT3ZlcnJpZGUgaW4geW91ciBhcHAgdG8gcmVjZWl2ZSBvbiBvcGVuIGV2ZW50IGZvciBjb25uZWN0aW9uXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICogQHB1YmxpY1xuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5vbk9wZW4gPSBmdW5jdGlvbiggbmFtZSwgdmFsdWUgKXt9XG5cblxuLyoqXG4gKiBPdmVycmlkZSBpbiB5b3VyIGFwcCB0byByZWNlaXZlIG9uIGNsb3NlIGV2ZW50IGZvciBjb25uZWN0aW9uXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICogQHB1YmxpY1xuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24oIG5hbWUsIHZhbHVlICl7fVxuXG4vKipcbiAqIE92ZXJyaWRlIGluIHlvdXIgYXBwIHRvIHJlY2VpdmUgXCJyYW5nZVwiIG1lc3NhZ2VzLCBlLmcuIHNiLm9uUmFuZ2VNZXNzYWdlID0geW91clJhbmdlRnVuY3Rpb25cbiAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSAgTmFtZSBvZiBpbmNvbWluZyByb3V0ZVxuICogQHBhcmFtICB7U3RyaW5nfSB2YWx1ZSBbZGVzY3JpcHRpb25dXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICogQHB1YmxpY1xuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5vblJhbmdlTWVzc2FnZSA9IGZ1bmN0aW9uKCBuYW1lLCB2YWx1ZSApe31cblxuLyoqXG4gKiBPdmVycmlkZSBpbiB5b3VyIGFwcCB0byByZWNlaXZlIFwiYm9vbGVhblwiIG1lc3NhZ2VzLCBlLmcuIHNiLm9uQm9vbGVhbk1lc3NhZ2UgPSB5b3VyQm9vbEZ1bmN0aW9uXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgIE5hbWUgb2YgaW5jb21pbmcgcm91dGVcbiAqIEBwYXJhbSAge1N0cmluZ30gdmFsdWUgW2Rlc2NyaXB0aW9uXVxuICogQG1lbWJlck9mIFNwYWNlYnJldy5DbGllbnRcbiAqIEBwdWJsaWNcbiAqL1xuU3BhY2VicmV3LkNsaWVudC5wcm90b3R5cGUub25Cb29sZWFuTWVzc2FnZSA9IGZ1bmN0aW9uKCBuYW1lLCB2YWx1ZSApe31cblxuLyoqXG4gKiBPdmVycmlkZSBpbiB5b3VyIGFwcCB0byByZWNlaXZlIFwic3RyaW5nXCIgbWVzc2FnZXMsIGUuZy4gc2Iub25TdHJpbmdNZXNzYWdlID0geW91clN0cmluZ0Z1bmN0aW9uXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgIE5hbWUgb2YgaW5jb21pbmcgcm91dGVcbiAqIEBwYXJhbSAge1N0cmluZ30gdmFsdWUgW2Rlc2NyaXB0aW9uXVxuICogQG1lbWJlck9mIFNwYWNlYnJldy5DbGllbnRcbiAqIEBwdWJsaWNcbiAqL1xuU3BhY2VicmV3LkNsaWVudC5wcm90b3R5cGUub25TdHJpbmdNZXNzYWdlID0gZnVuY3Rpb24oIG5hbWUsIHZhbHVlICl7fVxuXG4vKipcbiAqIE92ZXJyaWRlIGluIHlvdXIgYXBwIHRvIHJlY2VpdmUgXCJjdXN0b21cIiBtZXNzYWdlcywgZS5nLiBzYi5vbkN1c3RvbU1lc3NhZ2UgPSB5b3VyU3RyaW5nRnVuY3Rpb25cbiAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSAgTmFtZSBvZiBpbmNvbWluZyByb3V0ZVxuICogQHBhcmFtICB7U3RyaW5nfSB2YWx1ZSBbZGVzY3JpcHRpb25dXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICogQHB1YmxpY1xuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5vbkN1c3RvbU1lc3NhZ2UgPSBmdW5jdGlvbiggbmFtZSwgdmFsdWUsIHR5cGUgKXt9XG5cblxuLyoqXG4gKiBBZGQgYSByb3V0ZSB5b3UgYXJlIHB1Ymxpc2hpbmcgb24gXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIGluY29taW5nIHJvdXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBcImJvb2xlYW5cIiwgXCJyYW5nZVwiLCBvciBcInN0cmluZ1wiXG4gKiBAcGFyYW0ge1N0cmluZ30gZGVmICBkZWZhdWx0IHZhbHVlXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICogQHB1YmxpY1xuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5hZGRQdWJsaXNoID0gZnVuY3Rpb24oIG5hbWUsIHR5cGUsIGRlZiApe1xuXHR0aGlzLmNsaWVudF9jb25maWcucHVibGlzaC5tZXNzYWdlcy5wdXNoKHtcIm5hbWVcIjpuYW1lLCBcInR5cGVcIjp0eXBlLCBcImRlZmF1bHRcIjpkZWZ9KTtcblx0dGhpcy51cGRhdGVQdWJTdWIoKTtcbn1cblxuLyoqXG4gKiBbYWRkU3Vic2NyaWJlciBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2Ygb3V0Z29pbmcgcm91dGVcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFwiYm9vbGVhblwiLCBcInJhbmdlXCIsIG9yIFwic3RyaW5nXCJcbiAqIEBtZW1iZXJPZiBTcGFjZWJyZXcuQ2xpZW50XG4gKiBAcHVibGljXG4gKi9cblNwYWNlYnJldy5DbGllbnQucHJvdG90eXBlLmFkZFN1YnNjcmliZSA9IGZ1bmN0aW9uKCBuYW1lLCB0eXBlICl7XG5cdHRoaXMuY2xpZW50X2NvbmZpZy5zdWJzY3JpYmUubWVzc2FnZXMucHVzaCh7XCJuYW1lXCI6bmFtZSwgXCJ0eXBlXCI6dHlwZSB9KTtcblx0dGhpcy51cGRhdGVQdWJTdWIoKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgcHVibGlzaGVycyBhbmQgc3Vic2NyaWJlcnNcbiAqIEBtZW1iZXJPZiBTcGFjZWJyZXcuQ2xpZW50XG4gKiBAcHJpdmF0ZVxuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS51cGRhdGVQdWJTdWIgPSBmdW5jdGlvbigpe1xuXHRpZiAodGhpcy5faXNDb25uZWN0ZWQpIHtcblx0XHR0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcImNvbmZpZ1wiOiB0aGlzLmNsaWVudF9jb25maWd9KSk7XG5cdH1cbn1cblxuLyoqXG4gKiBTZW5kIGEgcm91dGUgdG8gU3BhY2VicmV3XG4gKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgIE5hbWUgb2Ygb3V0Z29pbmcgcm91dGUgKG11c3QgbWF0Y2ggc29tZXRoaW5nIGluIGFkZFB1Ymxpc2gpXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHR5cGUgIFwiYm9vbGVhblwiLCBcInJhbmdlXCIsIG9yIFwic3RyaW5nXCJcbiAqIEBwYXJhbSAge1N0cmluZ30gdmFsdWUgVmFsdWUgdG8gc2VuZFxuICogQG1lbWJlck9mIFNwYWNlYnJldy5DbGllbnRcbiAqIEBwdWJsaWNcbiAqL1xuU3BhY2VicmV3LkNsaWVudC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKCBuYW1lLCB0eXBlLCB2YWx1ZSApe1xuXHR2YXIgbWVzc2FnZSA9IHtcblx0XHRtZXNzYWdlOiB7XG4gICAgICAgICAgIGNsaWVudE5hbWU6dGhpcy5fbmFtZSxcbiAgICAgICAgICAgbmFtZTpuYW1lLFxuICAgICAgICAgICB0eXBlOnR5cGUsXG4gICAgICAgICAgIHZhbHVlOnZhbHVlXG4gICAgICAgfVxuICAgXHR9O1xuXG4gICBcdC8vY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICBcdHRoaXMuc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xufVxuXG4vKipcbiAqIENhbGxlZCBvbiBXZWJTb2NrZXQgb3BlblxuICogQHByaXZhdGVcbiAqIEBtZW1iZXJPZiBTcGFjZWJyZXcuQ2xpZW50XG4gKi9cblNwYWNlYnJldy5DbGllbnQucHJvdG90eXBlLl9vbk9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcIltfb25PcGVuOlNwYWNlYnJld10gU3BhY2VicmV3IGNvbm5lY3Rpb24gb3BlbmVkLCBjbGllbnQgbmFtZSBpczogXCIgKyB0aGlzLl9uYW1lKTtcblxuXHR0aGlzLl9pc0Nvbm5lY3RlZCA9IHRydWU7XG5cdGlmICh0aGlzLmFkbWluLmFjdGl2ZSkgdGhpcy5jb25uZWN0QWRtaW4oKTtcblxuICBcdC8vIHNlbmQgbXkgY29uZmlnXG4gIFx0dGhpcy51cGRhdGVQdWJTdWIoKTtcbiAgXHR0aGlzLm9uT3BlbigpO1xufVxuXG4vKipcbiAqIENhbGxlZCBvbiBXZWJTb2NrZXQgbWVzc2FnZVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge09iamVjdH0gZVxuICogQG1lbWJlck9mIFNwYWNlYnJldy5DbGllbnRcbiAqL1xuU3BhY2VicmV3LkNsaWVudC5wcm90b3R5cGUuX29uTWVzc2FnZSA9IGZ1bmN0aW9uKCBlICl7XG5cdHZhciBkYXRhID0gSlNPTi5wYXJzZShlLmRhdGEpXG5cdFx0LCBuYW1lXG5cdFx0LCB0eXBlXG5cdFx0LCB2YWx1ZVxuXHRcdDtcblxuXHQvLyBoYW5kbGUgY2xpZW50IG1lc3NhZ2VzIFxuXHRpZiAoZGF0YVtcIm1lc3NhZ2VcIl0pIHtcblx0XHQvLyBjaGVjayB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIGlzIG5vdCBhbiBhZG1pbiBtZXNzYWdlXG5cdFx0aWYgKCFkYXRhLm1lc3NhZ2VbXCJjbGllbnROYW1lXCJdKSB7XG5cdFx0XHRuYW1lID0gZGF0YS5tZXNzYWdlLm5hbWU7XG5cdFx0ICAgIHR5cGUgPSBkYXRhLm1lc3NhZ2UudHlwZTtcblx0XHRcdHZhbHVlID0gZGF0YS5tZXNzYWdlLnZhbHVlO1xuXG5cdFx0XHRzd2l0Y2goIHR5cGUgKXtcblx0XHRcdFx0Y2FzZSBcImJvb2xlYW5cIjpcblx0XHRcdFx0XHR0aGlzLm9uQm9vbGVhbk1lc3NhZ2UoIG5hbWUsIHZhbHVlID09IFwidHJ1ZVwiICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcblx0XHRcdFx0XHR0aGlzLm9uU3RyaW5nTWVzc2FnZSggbmFtZSwgdmFsdWUgKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcInJhbmdlXCI6XG5cdFx0XHRcdFx0dGhpcy5vblJhbmdlTWVzc2FnZSggbmFtZSwgTnVtYmVyKHZhbHVlKSApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHRoaXMub25DdXN0b21NZXNzYWdlKCBuYW1lLCB2YWx1ZSwgdHlwZSApO1xuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblx0fSBcblxuXHQvLyBoYW5kbGUgYWRtaW4gbWVzc2FnZXNcblx0ZWxzZSB7XG5cdFx0aWYgKHRoaXMuYWRtaW4uYWN0aXZlKSB7XG5cdFx0XHR0aGlzLl9oYW5kbGVBZG1pbk1lc3NhZ2VzKCBkYXRhICk7XHRcdFxuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIENhbGxlZCBvbiBXZWJTb2NrZXQgY2xvc2VcbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyT2YgU3BhY2VicmV3LkNsaWVudFxuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5fb25DbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwiW19vbkNsb3NlOlNwYWNlYnJld10gU3BhY2VicmV3IGNvbm5lY3Rpb24gY2xvc2VkXCIpO1xuXG5cdHRoaXMuX2lzQ29ubmVjdGVkID0gZmFsc2U7XG5cdGlmICh0aGlzLmFkbWluLmFjdGl2ZSkgdGhpcy5hZG1pbi5yZW1vdGVBZGRyZXNzID0gdW5kZWZpbmVkO1xuXG5cdHRoaXMub25DbG9zZSgpO1xufTtcblxuLyoqXG4gKiBuYW1lIE1ldGhvZCB0aGF0IHNldHMgb3IgZ2V0cyB0aGUgc3BhY2VicmV3IGFwcCBuYW1lLiBJZiBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQgdGhlbiBpdCBzZXRzIHRoZSBuYW1lLCBvdGhlcndpc2VcbiAqIFx0XHRpdCBqdXN0IHJldHVybnMgdGhlIGN1cnJlbnQgYXBwIG5hbWUuXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG5ld05hbWUgTmV3IG5hbWUgb2YgdGhlIHNwYWNlYnJldyBhcHBcbiAqIEByZXR1cm4ge1N0cmluZ30gUmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgc3BhY2VicmV3IGFwcCBpZiBjYWxsZWQgYXMgYSBnZXR0ZXIgZnVuY3Rpb24uIElmIGNhbGxlZCBhcyBhIFxuICogICAgICAgICAgICAgICAgICBzZXR0ZXIgZnVuY3Rpb24gaXQgd2lsbCByZXR1cm4gZmFsc2UgaWYgdGhlIG1ldGhvZCBpcyBjYWxsZWQgYWZ0ZXIgY29ubmVjdGluZyB0byBzcGFjZWJyZXcsIFxuICogICAgICAgICAgICAgICAgICBiZWNhdXNlIHRoZSBuYW1lIG11c3QgYmUgY29uZmlndXJlZCBiZWZvcmUgY29ubmVjdGlvbiBpcyBtYWRlLlxuICovXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24gKG5ld05hbWUpe1xuXHRpZiAobmV3TmFtZSkge1x0XHRcdFx0XHRcdFx0XHQvLyBpZiBhIG5hbWUgaGFzIGJlZW4gcGFzc2VkIGluIHRoZW4gdXBkYXRlIGl0XG5cdFx0aWYgKHRoaXMuX2lzQ29ubmVjdGVkKSByZXR1cm4gZmFsc2U7ICBcdC8vIGlmIGFscmVhZHkgY29ubmVjdGVkIHdlIGNhbid0IHVwZGF0ZSBuYW1lXG5cdFx0dGhpcy5fbmFtZSA9IG5ld05hbWU7XHRcblx0XHRpZiAod2luZG93KSB7XG5cdFx0XHR0aGlzLl9uYW1lID0gKHdpbmRvdy5nZXRRdWVyeVN0cmluZygnbmFtZScpICE9PSBcIlwiID8gdW5lc2NhcGUod2luZG93LmdldFF1ZXJ5U3RyaW5nKCduYW1lJykpIDogdGhpcy5fbmFtZSk7XG5cdFx0fVxuXHRcdHRoaXMuY2xpZW50X2NvbmZpZy5uYW1lID0gdGhpcy5fbmFtZTtcdFx0XHQvLyB1cGRhdGUgc3BhY2VicmV3IGNvbmZpZyBmaWxlXG5cdH0gXHRcblx0cmV0dXJuIHRoaXMuX25hbWU7XHRcbn07XG5cbi8qKlxuICogbmFtZSBNZXRob2QgdGhhdCBzZXRzIG9yIGdldHMgdGhlIHNwYWNlYnJldyBhcHAgZGVzY3JpcHRpb24uIElmIHBhcmFtZXRlciBpcyBwcm92aWRlZCB0aGVuIGl0IHNldHMgdGhlIGRlc2NyaXB0aW9uLCBcbiAqIFx0XHRvdGhlcndpc2UgaXQganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IGFwcCBkZXNjcmlwdGlvbi5cbiAqIEBwYXJhbSAge1N0cmluZ30gbmV3RGVzYyBOZXcgZGVzY3JpcHRpb24gb2YgdGhlIHNwYWNlYnJldyBhcHBcbiAqIEByZXR1cm4ge1N0cmluZ30gUmV0dXJucyB0aGUgZGVzY3JpcHRpb24gb2YgdGhlIHNwYWNlYnJldyBhcHAgaWYgY2FsbGVkIGFzIGEgZ2V0dGVyIGZ1bmN0aW9uLiBJZiBjYWxsZWQgYXMgYSBcbiAqICAgICAgICAgICAgICAgICAgc2V0dGVyIGZ1bmN0aW9uIGl0IHdpbGwgcmV0dXJuIGZhbHNlIGlmIHRoZSBtZXRob2QgaXMgY2FsbGVkIGFmdGVyIGNvbm5lY3RpbmcgdG8gc3BhY2VicmV3LCBcbiAqICAgICAgICAgICAgICAgICAgYmVjYXVzZSB0aGUgZGVzY3JpcHRpb24gbXVzdCBiZSBjb25maWd1cmVkIGJlZm9yZSBjb25uZWN0aW9uIGlzIG1hZGUuXG4gKi9cblNwYWNlYnJldy5DbGllbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24gKG5ld0Rlc2Mpe1xuXHRpZiAobmV3RGVzYykge1x0XHRcdFx0XHRcdFx0XHQvLyBpZiBhIGRlc2NyaXB0aW9uIGhhcyBiZWVuIHBhc3NlZCBpbiB0aGVuIHVwZGF0ZSBpdFxuXHRcdGlmICh0aGlzLl9pc0Nvbm5lY3RlZCkgcmV0dXJuIGZhbHNlOyAgXHQvLyBpZiBhbHJlYWR5IGNvbm5lY3RlZCB3ZSBjYW4ndCB1cGRhdGUgZGVzY3JpcHRpb25cblx0XHR0aGlzLl9kZXNjcmlwdGlvbiA9IG5ld0Rlc2MgfHwgXCJzcGFjZWJyZXcgamF2YXNjcmlwdCBjbGllbnRcIjtcblx0XHRpZiAod2luZG93KSB7XG5cdFx0XHR0aGlzLl9kZXNjcmlwdGlvbiA9ICh3aW5kb3cuZ2V0UXVlcnlTdHJpbmcoJ2Rlc2NyaXB0aW9uJykgIT09IFwiXCIgPyB1bmVzY2FwZSh3aW5kb3cuZ2V0UXVlcnlTdHJpbmcoJ2Rlc2NyaXB0aW9uJykpIDogdGhpcy5fZGVzY3JpcHRpb24pO1xuXHRcdH1cblx0XHR0aGlzLmNsaWVudF9jb25maWcuZGVzY3JpcHRpb24gPSB0aGlzLl9kZXNjcmlwdGlvbjtcdC8vIHVwZGF0ZSBzcGFjZWJyZXcgY29uZmlnIGZpbGVcblx0fSBcblx0cmV0dXJuIHRoaXMuX2Rlc2NyaXB0aW9uO1x0XG59O1xuXG4vKipcbiAqIGlzQ29ubmVjdGVkIE1ldGhvZCB0aGF0IHJldHVybnMgY3VycmVudCBjb25uZWN0aW9uIHN0YXRlIG9mIHRoZSBzcGFjZWJyZXcgY2xpZW50LlxuICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGN1cnJlbnRseSBjb25uZWN0ZWQgdG8gU3BhY2VicmV3XG4gKi9cblNwYWNlYnJldy5DbGllbnQucHJvdG90eXBlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gKCl7XG5cdHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcdFxufTtcblxuXG5TcGFjZWJyZXcuQ2xpZW50LnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbiAoIG1peGluICkgeyAgICBcbiAgICBmb3IgKHZhciBwcm9wIGluIG1peGluKSB7XG4gICAgICAgIGlmIChtaXhpbi5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgdGhpc1twcm9wXSA9IG1peGluW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NiLTEuMS4wJykuU3BhY2VicmV3O1xuXG4iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUtBQTtBREFBO0FBQ0E7QUFDQTtBQUNBOztBREhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FEeGRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FEdkNBLE9BQU8sQ0FBQyxLQUFSLEdBQWdCOztBQUVoQixPQUFPLENBQUMsVUFBUixHQUFxQixTQUFBO1NBQ3BCLEtBQUEsQ0FBTSx1QkFBTjtBQURvQjs7QUFHckIsT0FBTyxDQUFDLE9BQVIsR0FBa0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVA7Ozs7QURUbEIsT0FBTyxDQUFDLFNBQVIsR0FBb0IsT0FBQSxDQUFRLFdBQVIifQ==
