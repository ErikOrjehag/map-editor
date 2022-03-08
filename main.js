
let map = L.map('map', {editable: true}).setView([59.3128551, 17.7677114], 18);
map.doubleClickZoom.disable();

const ICON_SCALE = 0.6;
const RANGE_COORDS_FILE_NAME = "range_coords.json"
const COVERAGE_AREAS_FILE_NAME = "coverage_areas.json"

let flagIcon = L.icon({
    iconUrl: '/img/flag-icon.png',
    iconSize: [64*ICON_SCALE, 64*ICON_SCALE],
    iconAnchor: [12*ICON_SCALE, 63*ICON_SCALE],
    popupAnchor: [0*ICON_SCALE, -60*ICON_SCALE],
});

let signIcon = L.icon({
    iconUrl: '/img/sign-icon.png',
    iconSize: [64*ICON_SCALE, 64*ICON_SCALE],
    iconAnchor: [32*ICON_SCALE, 63*ICON_SCALE],
    popupAnchor: [0*ICON_SCALE, -60*ICON_SCALE],
});

let holeIcon = L.icon({
    iconUrl: '/img/hole-icon.png',
    iconSize: [64*ICON_SCALE, 64*ICON_SCALE],
    iconAnchor: [30*ICON_SCALE, 63*ICON_SCALE],
    popupAnchor: [0*ICON_SCALE, -60*ICON_SCALE],
});

L.EditControl = L.Control.extend({
    options: {
        position: 'topleft',
        callback: null,
        kind: '',
        html: ''
    },
    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
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

L.NewFlagMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: placeFlagMarker,
        kind: 'flag obstacle',
        html: 'Flag'
    }
});

L.NewSignMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: placeSignMarker,
        kind: 'obstacle sign',
        html: 'Sign'
    }
});

L.NewHoleMarkerControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: placeHoleMarker,
        kind: 'obstacle hole',
        html: 'Hole'
    }
});

L.NewObstaclePolygonControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: placeObstacleArea,
        kind: 'obstacle area',
        html: 'OA'
    }
});

L.NewCoveragePolygonControl = L.EditControl.extend({
    options: {
        position: 'topleft',
        callback: placeCoverageArea,
        kind: 'coverage area',
        html: 'CA'
    }
});

L.ClickControl = L.Control.extend({
    options: {
        position: 'topleft',
        callback: null,
        title: '',
        html: ''
    },
    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
            link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = this.options.title;
        link.innerHTML = this.options.html;
        L.DomEvent.on(link, 'click', L.DomEvent.stop)
                  .on(link, 'click', function () {
                    this.options.callback.call(map);
                  }, this);
        return container;
    }
});

L.NewSaveRangeCoordsControl = L.ClickControl.extend({
    options: {
        position: 'topleft',
        callback: saveRangeCoordsFile,
        title: 'Save range coords',
        html: 'SR'
    }
});


L.NewSaveCoverageAreasControl = L.ClickControl.extend({
    options: {
        position: 'topleft',
        callback: saveCoverageAreasFile,
        title: 'Save coverage areas',
        html: 'SC'
    }
});

map.addControl(new L.NewFlagMarkerControl());
map.addControl(new L.NewSignMarkerControl());
map.addControl(new L.NewHoleMarkerControl());
map.addControl(new L.NewObstaclePolygonControl());
map.addControl(new L.NewCoveragePolygonControl());
map.addControl(new L.NewSaveRangeCoordsControl());
map.addControl(new L.NewSaveCoverageAreasControl());

const RELOX_OBSTACLE_FLAG = "obstacle-flag";
const RELOX_OBSTACLE_SIGN = "obstacle-sign";
const RELOX_OBSTACLE_HOLE = "obstacle-hole";
const RELOX_OBSTACLE_AREA = "obstacle-area";
const RELOX_RANGE_BOUNDARY = "range-boundary";
const RELOX_COVERAGE_AREA = "coverage-area";

function deleteShape(e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
        map.removeLayer(this);
        return true;
    }
    return false;
};

function placeFlagMarker() {
    let marker = this.startMarker(null, { icon: flagIcon }).on('click', L.DomEvent.stop).on('click', deleteShape);
    marker.reloxType = RELOX_OBSTACLE_FLAG;
}

function placeSignMarker() {
    let marker = this.startMarker(null, { icon: signIcon }).on('click', L.DomEvent.stop).on('click', deleteShape);
    marker.reloxType = RELOX_OBSTACLE_SIGN;
}

function placeHoleMarker() {
    let marker = this.startMarker(null, { icon: holeIcon }).on('click', L.DomEvent.stop).on('click', deleteShape);
    marker.reloxType = RELOX_OBSTACLE_HOLE;
}

function placeObstacleArea() {
    let polygon = this.startPolygon(null, {color: 'red'}).on("dblclick", (e) => {
        polygon.toggleEdit();
    }).on("click", deleteShape);
    polygon.reloxType = RELOX_OBSTACLE_AREA;
}

function placeCoverageArea() {
    makeCoverageArea(this.startPolygon(null, {color: 'blue'}));
}

function makeCoverageArea(polygon, initialAreaName, angles) {
    let popupContent = (`
        <input style="width: 100px;" placeholder="Set area name" type="text" />
    `);
    let onPopupInputChange = (e) => {
        polygon.reloxAreaName = e.target.value;
    }
    polygon.on("dblclick", (e) => {
        polygon.toggleEdit();
    }).on("click", deleteShape
    ).bindPopup(popupContent
    ).on("popupopen", (e) => {
        let inputName = e.target._popup._contentNode.getElementsByTagName("input")[0];
        inputName.value = polygon.reloxAreaName;
        inputName.addEventListener('change', onPopupInputChange);
    }).on("popupclose", (e) => {
        let inputName = e.target._popup._contentNode.getElementsByTagName("input")[0];
        inputName.removeEventListener('change', onPopupInputChange);
    });
    polygon.reloxType = RELOX_COVERAGE_AREA;
    polygon.reloxAreaName = initialAreaName || "";
    polygon.reloxAreaAngles = angles || [];
}

function saveRangeCoordsFile() {
    console.log("save range coords file");
    let data = {
        "flags": [],
        "signs": [],
        "holes": [],
        "boundary": [],
        "areas": [],
    }
    map.eachLayer((layer) => {
        if (layer.reloxType === RELOX_OBSTACLE_FLAG) {
            let utm = layer.getLatLng().utm();
            data["flags"].push({"E": utm.x, "N": utm.y});
        } else if (layer.reloxType == RELOX_OBSTACLE_SIGN) {
            let utm = layer.getLatLng().utm();
            data["signs"].push({"E": utm.x, "N": utm.y});
        } else if (layer.reloxType == RELOX_OBSTACLE_HOLE) {
            let utm = layer.getLatLng().utm();
            data["holes"].push({"E": utm.x, "N": utm.y});
        } else if (layer.reloxType == RELOX_RANGE_BOUNDARY) {
            let polys = layer.getLatLngs();
            if (polys.length == 1) {
                let coords = polys[0];
                if (coords.length >= 3) {
                    data["boundary"] = coords.map((latLng) => {
                        let utm = latLng.utm();
                        return {"E": utm.x, "N": utm.y};
                    });
                } else {
                    console.warn(`Ignoring boundary polygon with ${coords.length} coordinates`);
                }
            } else {
                console.warn("Ignoring boundary because it is a multi polygon");
            }
        } else if (layer.reloxType == RELOX_OBSTACLE_AREA) {
            let polys = layer.getLatLngs();
            if (polys.length == 1) {
                let coords = polys[0];
                if (coords.length >= 3) {
                    data["areas"].push(coords.map((latLng) => {
                        let utm = latLng.utm();
                        return {"E": utm.x, "N": utm.y};
                    }));
                } else {
                    console.warn(`Ignoring obstacle polygon with ${coords.length} coordinates`);
                }
            } else {
                console.warn("Ignoring obstacle because it is a multi polygon");
            }
        }
    });
    console.log(data);
    download(JSON.stringify(data, undefined, 4), RANGE_COORDS_FILE_NAME, "plain/text");
}


function saveCoverageAreasFile() {
    console.log("save coverage areas file");
    let data = {};
    map.eachLayer((layer) => {
        if (layer.reloxType === RELOX_COVERAGE_AREA) {
            if (layer.reloxAreaName) {
                let polys = layer.getLatLngs();
                if (polys.length == 1) {
                    let coords = polys[0];
                    if (coords.length >= 3) {
                        data[layer.reloxAreaName] = {
                            "points": coords.map((latLng) => {
                                let utm = latLng.utm();
                                return {"E": utm.x, "N": utm.y};
                            }),
                            "angles": layer.reloxAreaAngles
                        };
                    } else {
                        console.warn(`Ignoring coverage area polygon with ${coords.length} coordinates`);
                    }
                } else {
                    console.warn("Ignoring coverage area because it is a multi polygon");
                }
            } else {
                console.warn("Ignoring coverage area because it does not have an name")
            }
        }
    });
    console.log(data);
    download(JSON.stringify(data, undefined, 4), COVERAGE_AREAS_FILE_NAME, "plain/text");
}

let token = "pk.eyJ1IjoiZXJpa29yamVoYWciLCJhIjoiY2wwY2hmNG9mMDF4ajNqbXVocTVtaTJhdSJ9.-ESQzyFEAYCwX9z5pThA2w"

L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/{z}/{x}/{y}?access_token=${token}`, {
    maxNativeZoom: 18, maxZoom: 22
}).addTo(map);

const dragHandler = (event) => {
    event.preventDefault();
};

const dropHandler = (event) => {
    event.preventDefault();
    callbacks = {}
    callbacks[RANGE_COORDS_FILE_NAME] = rangeCoordsHandler;
    callbacks[COVERAGE_AREAS_FILE_NAME] = coverageAreasHandler;
    getDroppedJsonFile(event, callbacks);
};

function rangeCoordsHandler(rangeCoords) {
    map.eachLayer((layer) => {
        if ([RELOX_OBSTACLE_FLAG,
             RELOX_OBSTACLE_HOLE,
             RELOX_OBSTACLE_SIGN,
             RELOX_OBSTACLE_AREA,
             RELOX_RANGE_BOUNDARY].indexOf(layer.reloxType) != -1
        ) {
            map.removeLayer(layer);
        }
    });
    
    const flags = rangeCoords["flags"];
    const signs = rangeCoords["signs"];
    const holes = rangeCoords["holes"];
    const areas = rangeCoords["areas"];
    const boundary = rangeCoords["boundary"];
    
    let coords = boundary.map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
    let poly = L.polygon(coords, {color: 'green'}).addTo(map).on("dblclick", (e) => {
        poly.toggleEdit();
    });
    poly.reloxType = RELOX_RANGE_BOUNDARY;
    flags.forEach((flag, i) => {
        let marker = L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: flagIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape);
        marker.enableEdit();
        marker.reloxType = RELOX_OBSTACLE_FLAG;
    });
    signs.forEach((flag, i) => {
        let marker = L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: signIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape);
        marker.enableEdit();
        marker.reloxType = RELOX_OBSTACLE_SIGN;
    });
    holes.forEach((flag, i) => {
        let marker = L.marker(
            L.utm({x: flag["E"], y: flag["N"], zone: 33, band: 'V'}).latLng(),
            { icon: holeIcon }
        ).addTo(map).on('click', L.DomEvent.stop).on('click', deleteShape);
        marker.enableEdit();
        marker.reloxType = RELOX_OBSTACLE_HOLE;
    });
    areas.forEach((area, i) => {
        let coords = area.map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
        let polygon = L.polygon(coords, {color: 'red'}).addTo(map).on("dblclick", (e) => {
            polygon.toggleEdit();
        }).on("click", deleteShape);
        polygon.reloxType = RELOX_OBSTACLE_AREA;
    });
}

function coverageAreasHandler(coverageAreas) {
    map.eachLayer((layer) => {
        if ([RELOX_COVERAGE_AREA
             ].indexOf(layer.reloxType) != -1
        ) {
            map.removeLayer(layer);
        }
    });
    Object.entries(coverageAreas).forEach(([areaName, area]) => {
        let coords = area["points"].map((utm) => L.utm({x: utm["E"], y: utm["N"], zone: 33, band: 'V'}).latLng());
        makeCoverageArea(L.polygon(coords, {color: 'blue'}).addTo(map), areaName, area["angles"])
    });
}

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

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}