var $ = require('dk.napp.testflight');
var config = {};

exports.checkpoint = function(s) {
	$.passCheckpoint(s);
};

exports.log = function(s) {
	$.log(s);
};

exports.init = function(c) {
	$.takeOff(c.appToken);
};