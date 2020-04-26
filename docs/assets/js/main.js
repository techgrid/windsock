var dropzones = [
    {name: "Skydive Spaceland Dallas", coords: {longitude: -96.378156, latitude: 33.449757}}
];

var tableView = false;

var distanceThreshold = 50;
var longitude = -96.378156;
var latitude = 33.449757;
var lastAngle = 0;
function distance(lat1, lat2, lon1, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

function findNearestDropzone(coords) {
    var nearest = undefined;
    var nearestDistance = distanceThreshold;
    for (var i = 0; i < dropzones.length; i++) {
        var dz = dropzones[i];
        var d = distance(coords.latitude, dz.coords.latitude, coords.longitude, dz.coords.longitude, 'M');
        if (d < nearestDistance) {
            nearest = dz;
            nearestDistance = d;
        }
    }
    return nearest ? nearest.coords : coords;
}


var thickness = 2;
var arrowlength = 10;
var altlimit = 15000;
var directions = {
    0: 180
};
var speeds = {
    0: 0
};


function update(latitude, longitude) {
    fetch('https://cors-anywhere.herokuapp.com/https://www.markschulze.net/winds/winds.php?lat='+latitude+'&lon='+ longitude + '&hourOffset=0&referrer=MSWA')
    .then(response => response.json())
    .then(json => {
        console.log(json);
        directions = {};
        speeds = {};
        var row = '';
        var altitudes = json.altFt;
        for (var i = 0; i < altitudes.length; i++) {
            var altitude = altitudes[i];
            if (altitude > altlimit)
                break;   
            directions[altitude] = json.direction[altitude];
            speeds[altitude] = json.speed[altitude];
            row += '<tr onclick="rowClicked(this, '+altitude+');"><th scope="row">'+altitude+' ft</th><td>'+json.direction[altitude]+'º</td><td>'+json.speed[altitude]+' kts</td></tr>';
        }
        document.getElementById("altitudeTableBody").innerHTML = row;
        draw(0);
    });
}


function loadMap(dzCoords) {
    longitude = dzCoords.longitude;
    latitude = dzCoords.latitude;
    require([
    "esri/Map",
    "esri/views/MapView",
    ], function(Map, MapView) {
                var map = new Map({
                    basemap: "satellite"
                });

                var view = new MapView({
                    container: "viewDiv",
                    map: map,
                    center: [longitude, latitude],
                    zoom: 17
                });
                map.on("drag", function(){
                    console.log('map changed');
                });
                view.on("layerview-create", function(){
                    console.log('view changed');
                });
                view.when(() => {
                    update(latitude, longitude);
                });
            });
}

function limits(speed) {
    if (speed < 10)
        return '#ECFF33';
    else if (speed <= 15)
        return '#46FF33';
    else if (speed <= 20)
        return '#FFDA33';
    else if (speed <= 25)
        return '#FF9F33';
    else
        return '#FF4C33';

}

function sock(speed) {
    if (speed == 0)
        return 0;
    else if (speed <= 10)
        return 20;
    else if (speed <= 15)
        return 40;
    else if (speed <= 20)
        return 60;
    else if (speed <= 25)
        return 80;
    else
        return 100;

}

function toggleTableView() {
    tableView = !tableView;
    if (tableView) {
        var selected = document.getElementsByClassName('table-warning');
        for (var i = 0; i < selected.length; i++)
            selected[i].className = '';
        document.getElementById("altitudeSlider").style.display = 'none';
        document.getElementById("summary").style.display = 'none';
        document.getElementById("altitudeTable").style.display = 'table';
        document.getElementById("tableMode").innerHTML = `<svg class="bi bi-x-circle" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/>
</svg>`;
    } else {
        document.getElementById("altitudeSlider").value = 0;
        document.getElementById("altitudeSlider").style.display = 'block';
        document.getElementById("summary").style.display = 'block';
        document.getElementById("altitudeTable").style.display = 'none';
        document.getElementById("tableMode").innerHTML = `<svg class="bi bi-table" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M15 4H1V3h14v1z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M5 15.5v-14h1v14H5zm5 0v-14h1v14h-1z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M15 8H1V7h14v1zm0 4H1v-1h14v1z" clip-rule="evenodd"/>
  <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v2H0V2z"/>
</svg>`;
    }
}

function sliderChanged() {
    var w = document.getElementById("altitudeSlider").value;
    draw(w);
}
function rowClicked(el, altitude) {
    console.log(el, altitude);
    var selected = document.getElementsByClassName('table-warning');
    for (var i = 0; i < selected.length; i++)
        selected[i].className = '';
    
    el.className = 'table-warning';
    draw(altitude);
}
function draw(w) {
    var div = document.getElementById("arrow");
    var deg = directions[w];
    var rotation = deg - lastAngle;
    if (rotation > 180)
        rotation = 180 - rotation;
    if (rotation < 180)
        rotation = - 1 * rotation - 180;
    
    lastAngle = deg;
    
    div.style.webkitTransform = 'rotate('+deg+'deg)'; 
    div.style.mozTransform    = 'rotate('+deg+'deg)'; 
    div.style.msTransform     = 'rotate('+deg+'deg)'; 
    div.style.oTransform      = 'rotate('+deg+'deg)'; 
    div.style.transform       = 'rotate('+deg+'deg)'; 
    
    document.getElementById('altitudedisplay').innerHTML = ''+w;
    document.getElementById('speed').innerHTML = ''+speeds[w];
    document.getElementById('direction').innerHTML = ''+directions[w];
    document.getElementById('arrow').className = 'arrow arrow-' + sock(speeds[w]);
    document.getElementById('loading').style.display = 'none';
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        var dzCoords = findNearestDropzone(position.coords);
        loadMap(dzCoords);
    }, error => {
        document.getElementById('alert').style.display = 'block';    
    });
} else {
    document.getElementById('alert').style.display = 'block';
}