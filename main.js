

const iconScale = 0.6;

var flagIcon = L.icon({
    iconUrl: 'flag-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [12*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});


var signIcon = L.icon({
    iconUrl: 'sign-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [32*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});

var holeIcon = L.icon({
    iconUrl: 'hole-icon.png',
    iconSize: [64*iconScale, 64*iconScale],
    iconAnchor: [30*iconScale, 63*iconScale],
    popupAnchor: [0*iconScale, -60*iconScale],
});


var map = L.map('map').setView([59.3128551, 17.7677114], 18);

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
    L.polygon(coords, {color: 'green'}).addTo(map);
    coords.forEach((c) => {
        L.marker(
            c,
            { draggable: true, opacity: 0.8 }
        ).addTo(map);
    })
    flags.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { draggable: true, opacity: 0.8, icon: flagIcon }
        ).bindPopup(`Flag ${i}`
        ).addTo(map);
    });
    signs.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { draggable: true, opacity: 0.8, icon: signIcon }
        ).bindPopup(`Sign ${i}`
        ).addTo(map);
    });
    holes.forEach((flag, i) => {
        L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { draggable: true, opacity: 0.8, icon: holeIcon }
        ).bindPopup(`Hole ${i}`
        ).addTo(map);
    });
    areas.forEach((area, i) => {
        console.log(area);
        let coords = area.map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
        console.log(coords);
        L.polygon(coords, {color: 'red'}).addTo(map);
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

map.on('click', onMapClick);

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