var config = {};

var cc = null;
var ccs = null;
var cca = null;
var hist = [];

function closeController(c) {
	if (!c) return;
	try {
		c.close();
		c.destroy();
	} catch (e) {
		console.error(e);
	}
}

exports.create = exports.open = create = function(controller, args, unclosePrev) {
	args = args || {};

	var C = require('alloy').createController(controller, args);
	C.open();

	hist.push({ controller: controller, args: args });

	if (cc && !unclosePrev) closeController(cc);
	ccs = controller;

	cca = args;
	cc = C;

	return cc;
};

exports.back = exports.goBack = back = function() {
	if (hist.length<2) return;
	var last = hist.pop().pop();
	create(last.controller, last.args);
};

exports.getCurrentControllerStr = function(){ return ccs; };
exports.getCurrentControllerArgs = function() { return cca; };
exports.current = exports.getCurrentController = function() { return cc; };
exports.closeCurrent = function() { closeController(cc); };

exports.getHistory = function() { return hist; };
exports.clearHistory = function(){ hist = []; };

exports.reload = function() { open(ccs, cca); };

exports.init = function(c) {
	config = _.extend(config, c);
};
