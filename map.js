var config = {
	pixelRadius: 20
};

var MapModule = require('ti.map');

exports.dist = dist = function(a,b) {
	return Math.sqrt(Math.pow(a,2)+Math.pow(b,2));
};

exports.cluster = function(e, markers){
	if (!(markers instanceof Backbone.Collection)) {
		throw 'Markers must be a Backbone Collection';
	}

	var c={}, g={}, id, jd, len;
	var latR = e.source.size.height/e.latitudeDelta;
	var lngR = e.source.size.width/e.longitudeDelta;
	var degreeLat = config.pixelRadius/latR;
	var degreeLng = config.pixelRadius/lngR;
	var bb = [
	e.latitude-e.latitudeDelta/2-degreeLat,
	e.longitude+e.longitudeDelta/2+degreeLng,
	e.latitude+e.latitudeDelta/2+degreeLat,
	e.longitude-e.longitudeDelta/2-degreeLng
	];

	// Compile only marker in my bounding box
	markers.map(function(m){
		var lat = parseFloat(m.get('lat')), lng = parseFloat(m.get('lng'));
		if (lat<bb[2] && lat>bb[0] && lng>bb[3] && lng<bb[1]) {
			c[m.get('id')] = { lat: lat, lng: lng };
		}
	});

	// Cycle over all markers, and group in {g} all nearest markers by {id}
	for (id in c) {
		for (jd in c) {
			if (id==jd) continue;
			if (dist(latR*Math.abs(c[id].lat-c[jd].lat), lngR*Math.abs(c[id].lng-c[jd].lng))<config.pixelRadius) {
				if (!(id in g)) g[id] = [id];
				g[id].push(jd);
				delete c[jd];
			}
		}
		if (!(id in g)) g[id] = [id];
		delete c[id];
	}

	// cycle all over pin and calculate the average of group pin
	for (id in g) {
		c[id] = { lat: 0.0, lng: 0.0, count: Object.keys(g[id]).length };
		for (jd in g[id]) {
			c[id].lat += parseFloat(markers.get(g[id][jd]).get('lat'));
			c[id].lng += parseFloat(markers.get(g[id][jd]).get('lng'));
		}
		c[id].lat = c[id].lat/c[id].count;
		c[id].lng = c[id].lng/c[id].count;
	}

	// Set all annotations
	var data = { markers: [], clusters: [] };
	for (id in c) {
		if (c[id].count>1) {
			data.clusters.push({
				latitude: c[id].lat.toFixed(4),
				longitude: c[id].lng.toFixed(4),
				count: c[id].count
			});
		} else {
			data.markers.push(id);
		}
	}

	return data;
};

exports.init = function(c) {
	config = _.extend(config, c);
};