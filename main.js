

const iconScale = 0.6;

var flagIcon = L.icon({
    iconUrl: 'img/flag-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [12*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});


var signIcon = L.icon({
    iconUrl: 'img/sign-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [32*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});

var holeIcon = L.icon({
    iconUrl: 'img/hole-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [30*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});

L.EditControl = L.Control.extend({

    options: {
        position: 'topleft',
        callback: null,
        kind: '',
        html: ''
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
            link = L.DomUtil.create('a', '', container);

        link.href = '#';
        link.title = 'Create a new ' + this.options.kind;
        link.innerHTML = this.options.html;
        L.DomEvent.on(link, 'click', L.DomEvent.stop)
                  .on(link, 'click', function () {
                    window.LAYER = this.options.callback.call(map.editTools);
                  }, this);

        return container;
    }

});

var map = L.map('map', {editable: true}).setView([59.3128551, 17.7677114], 18);
map.doubleClickZoom.disable();

L.NewFlagMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: map.editTools.startMarker,
        kind: 'marker',
        html: 'Flag'
    }
});

L.NewSignMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: map.editTools.startMarker,
        kind: 'marker',
        html: 'Sign'
    }
});

L.NewHoleMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: map.editTools.startMarker,
        kind: 'marker',
        html: 'Hole'
    }
});

L.NewRectangleControl = L.EditControl.extend({

    options: {
        position: 'topleft',
        callback: map.editTools.startRectangle,
        kind: 'rectangle',
        html: '⬛'
    }

});

map.addControl(new L.NewFlagMarkerControl());
map.addControl(new L.NewSignMarkerControl());
map.addControl(new L.NewHoleMarkerControl());
map.addControl(new L.NewRectangleControl());

var deleteShape = function (e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) map.removeLayer(this);
};

let token = "pk.eyJ1IjoiZXJpa29yamVoYWciLCJhIjoiY2wwY2hmNG9mMDF4ajNqbXVocTVtaTJhdSJ9.-ESQzyFEAYCwX9z5pThA2w"

L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/{z}/{x}/{y}?access_token=${token}`, {
    maxNativeZoom: 18, maxZoom: 22
}).addTo(map);

const dragHandler = (event) => {
    event.preventDefault();
    console.log("drag");
};

const dropHandler = (event) => {
    event.preventDefault();
    console.log("drop", event);

    getDroppedJsonFile(event, {
        "range_coords.json": rangeCoordsHandler,
        "coverage_areas.json": coverageAreasHandler,
    });
};

function rangeCoordsHandler(rangeCoords) {
    const flags = rangeCoords["flags"];
    const signs = rangeCoords["signs"];
    const holes = rangeCoords["holes"];
    const areas = rangeCoords["areas"];
    const boundary = rangeCoords["boundary"];
    let coords = boundary.map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
    let poly = L.polygon(coords, {color: 'green'}).addTo(map).on("dblclick", (e) => {
        poly.toggleEdit();
    });
    flags.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: flagIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape).enableEdit();
    });
    signs.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: signIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape).enableEdit();
    });
    holes.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: holeIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape).enableEdit();
    });
    areas.forEach((area, i) => {
        console.log(area);
        let coords = area.map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
        console.log(coords);
        let poly = L.polygon(coords, {color: 'red'}).addTo(map).on("dblclick", (e) => {
            poly.toggleEdit();
        });
    });
}

function coverageAreasHandler(coverageAreas) {
    console.log(coverageAreas);
}

// const onMapClick = (e) => {
//     // poly.push(e.latlng);
//     // if (true || poly.length == 3) {
//     //     var polygon = L.polygon(poly, {color: 'red'}).addTo(map);
//     // }
//     marker = new L.marker(e.latlng, { draggable:'true' });
//     map.addLayer(marker);
// };
// map.on('click', onMapClick);

function getDroppedJsonFile(event, callbacks) {
    if (!event.dataTransfer.items) {
        console.error(`Expected event with "event.dataTransfer.items"`)
    } else {
        if (event.dataTransfer.items.length !== 1) {
            console.error(`Expected 1 item but got ${event.dataTransfer.items.length} items`)
        } else {
            let item = event.dataTransfer.items[0];
            if (item.kind !== 'file') {
                console.error(`Expected type "file" but got type "${item.kind}"`);
            } else {
                let file = item.getAsFile();
                if (!(file.name in callbacks)) {
                    console.error(`No callback for file ${file.name}`);
                } else {
                    let callback = callbacks[file.name];
                    let read = new FileReader();
                    read.readAsBinaryString(file);
                    read.onloadend = function() {
                        try {
                            let content = JSON.parse(read.result);
                            callback(content);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        }
    }
}