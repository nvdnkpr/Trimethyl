var config = {
	accuracy: "ACCURACY_HIGH",
	checkForGooglePlayServices: true,
	directionUrl: "http://appcaffeina.com/static/maps/directions",
};

exports.getRoute = getRoute = function(args, rargs, cb) {
	require('network').send({
		url: config.directionUrl,
		data: args,
		success: function(resp){
			var points = [];
			for (var k in resp) points.push({ latitude: resp[k][0], longitude: resp[k][1] });
			return cb(require('ti.map').createRoute(_.extend({
				name: 'Route',
				color: '#000',
				points: points,
				width: 6
			}, rargs)));
		}
	});
};

exports.getRouteFromUserLocation = function(destination, args, rargs, cb) {
	localize(function(e){
		var userLocation = { latitude: e.coords.latitude, longitude: e.coords.longitude };
		getRoute(_.extend({
			origin: userLocation.latitude+','+userLocation.longitude,
			destination: destination
		}, args||{}), rargs||{}, cb);
	});
};

exports.localize = localize = function(cb) {
	if (!Ti.Geolocation.locationServicesEnabled) {
		require('util').alertError(L('geo.error', "To use this feature, please enable location services."));
		return;
	}

	Ti.App.fireEvent('geo.start');
	Ti.Geolocation.purpose = L('geo.purpose', "Let us use your GPS position!");
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

	Ti.Geolocation.getCurrentPosition(function(e){
		Ti.App.fireEvent('geo.end');
		if (e.error) return require('util').alertError( e.error || L('Unkown GPS error') );
		if (cb) cb(e, e.coords.latitude, e.coords.longitude);
	});
};


exports.startNavigator = function(lat, lng, mode) {
	localize(function(e, mylat, mylng) {
		var D = OS_IOS ? "http://maps.apple.com/" : "https://maps.google.com/maps";
		Ti.Platform.openURL(D+"?directionsmode="+(mode||'walking')+"&daddr="+lat+","+lng+"&saddr="+mylat+","+mylng);
	});
};

exports.init = function(c) {
	config = _.extend(config, c);
	if (OS_ANDROID && config.checkForGooglePlayServices) {
		try {
			var rc = M.isGooglePlayServicesAvailable();
			switch (rc) {
				case M.SUCCESS: break;
				case M.SERVICE_MISSING: throw ('Google Play services is missing. Please install Google Play services from the Google Play store.');
				case M.SERVICE_VERSION_UPDATE_REQUIRED: throw ('Google Play services is out of date. Please update Google Play services.');
				case M.SERVICE_DISABLED: throw ('Google Play services is disabled. Please enable Google Play services.');
				case M.SERVICE_INVALID: throw ('Google Play services cannot be authenticated. Reinstall Google Play services.');
				default: throw ('Unknown Google Play services error.');
			}
		} catch (e) {
			require('util').alertError(e);
		}
	}
};

