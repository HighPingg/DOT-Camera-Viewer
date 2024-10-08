var cameraListByArea = {};
var cameraIDsByArea = {};
var filterList = localStorage.getItem('filterList') ? new Set(localStorage.getItem('filterList').split(',')) : new Set();
var map = undefined;

var markerClusters = {};

document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Map
    map = L.map('map', {zoomControl: false, minZoom: 11}).setView([40.730610, -73.935242], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/legal">Carto</a>'
    }).addTo(map);

    // Get all cameras and add markers to map
    await fetch('./cameraDataNYC.json')
        .then(response => { 
            if (!response.ok) { 
                throw new Error('Network response was not ok'); 
            } 
            return response.json(); 
        })
        .then(data => {
            data.forEach(camera => {
                // Create a marker with popup and add it to the map
                var marker = L.marker([camera.latitude, camera.longitude], {
                    icon: L.icon({
                        iconUrl: './assets/cctv_icon.svg',
                        iconSize: [38, 45],
                        iconAnchor: [18.5, 45],
                        popupAnchor: [0, -46]
                    })
                });

                var popupText = [];
                popupText.push(
                    `<div>
                        <span class="popupLabel" >Area: </span>${camera.area}
                        <br>
                        <span class="popupLabel" >Name: </span>${camera.name}
                        <br>
                        <div class="popupButtonBox" >
                            <button type="button" class="popupButton"
                                id="${camera.id}/${camera.name}/marker"
                                onclick="watchCamera(event)"
                                >View</button>
                        </div>
                    </div>`
                )

                marker.bindPopup(popupText.join(''));

                // Add to Camera list
                if (cameraListByArea[camera.area] == undefined) {
                    cameraListByArea[camera.area] = [camera];
                    cameraIDsByArea[camera.area] = [marker];

                    markerClusters[camera.area] = L.markerClusterGroup();
                } else {
                    cameraListByArea[camera.area].push(camera);
                    cameraIDsByArea[camera.area].push(marker);
                }
                
                markerClusters[camera.area].addLayer(marker);
            });

            // Draw all cameras
            Object.keys(cameraIDsByArea).forEach((area) => {
                showByAreaMarker(area);
            });
        });
});

function showByAreaMarker(area) {
    if (filterList.has(area)) return;
    
    if (mapClustering) {
        if (!filterList.has(area)) {
            map.addLayer(markerClusters[area]);
        }
    } else {
        cameraIDsByArea[area].forEach((marker) => {
            map.addLayer(marker);
        })
    }
}

function clearMarkersInArea(area) {
    if (mapClustering) {
        map.removeLayer(markerClusters[area]);
    } else {
        cameraIDsByArea[area].forEach((marker) => {
            map.removeLayer(marker);
        })
    }
}

var cameraIntervalId = undefined;
var currCameraId = undefined;
var isMenuActive = false;
var currentMenuSelection = undefined;
var mapClustering = localStorage.getItem("mapClustering") == "false" ? false : true;

function setCameraURL() {
    cameraImage.src = `https://webcams.nyctmc.org/api/cameras/${currCameraId}/image?cacheAvoidance=${Math.floor(Math.random() * 100000)}`;
}

function watchCamera(event) {
    [id, camName, _] = event.target.id.split('/');

    cameraName.innerHTML = camName;
    cameraBox.style.display = 'flex';

    currCameraId = id;
    setCameraURL();
    cameraIntervalId = setInterval(setCameraURL, 1000);
}

function closeCamera() {
    cameraBox.style.display = 'none';
    cameraName.innerHTML = '';
    
    if (cameraIntervalId !== undefined) {
        clearInterval(cameraIntervalId);
        cameraIntervalId = undefined;
    }

    currCameraId = undefined;
}

function cameraError() {
    clearInterval(cameraIntervalId);
    cameraIntervalId = undefined;

    cameraImage.src = './assets/notfound.png';
}

function toggleOpenMenu() {
    if (currentMenuSelection == undefined) {
        controlMenu.style.display = "block";
        currentMenuSelection = "List";
        
        // Open opacity background
        menuContainingBox.style.height = '100vh';
        menuContainingBox.style.width = '100vw';

        // Change menu length
        menuBox.style.height = 'calc(100vh - 20px)';
        menuBox.style.width = 'calc(100vw - 20px)';

        // Display Menu Content
        document.getElementById(`${currentMenuSelection}menuSelectButton`).disabled = true;
        setMenuContent('List');

    } else {
        controlMenu.style.display = "none";
        currentMenuSelection = undefined;

        // Close Menu
        setMenuContent(null);
        for (var i = 0; i < controlMenuButtons.children.length; i++) {
            controlMenuButtons.children[i].disabled = false;
        }

        // Hide opacity background
        menuContainingBox.style.height = '0';
        menuContainingBox.style.width = '0';

        // Change menu length
        menuBox.style.height = '2.4rem';
        menuBox.style.width = '2.4rem';
    }
}

function switchMenuPages(event) {
    newPage = event.target.innerHTML;

    // Change button highlight
    document.getElementById(`${currentMenuSelection}menuSelectButton`).disabled = false;
    document.getElementById(`${newPage}menuSelectButton`).disabled = true;

    setMenuContent(newPage);

    currentMenuSelection = newPage;
}

function filterToggle(element) {
    toggleName = element.id.split('Checkbox')[0];
    if (element.checked) {
        filterList.delete(toggleName);
        showByAreaMarker(toggleName);
    } else {
        filterList.add(toggleName);
        clearMarkersInArea(toggleName);
    }

    localStorage.setItem('filterList', Array.from(filterList));
}

function setMenuContent(menuPage) {
    var innerContent = '';
    switch (menuPage) {
        case "List":
            for (const area in cameraListByArea) {
                innerContent += getCameraList(area, cameraListByArea[area]);
            }
            break;
        
        case "Settings":
            var getFilterList= () => {
                var filters = '';

                Object.keys(cameraListByArea).forEach(area => {
                    filters += `
                        <div>
                            <input type="checkbox"
                                   id="${area}Checkbox"
                                   name="${area}Checkbox"
                                   ${filterList.has(area) ? null : 'checked'}
                                   onchange={filterToggle(this)}
                                />
                            <label for="${area}Checkbox">${area}</label>
                        </div>`;
                });

                return filters;
            }

            innerContent = `<div id="mapOptions" >
                    <div class="mapSetting">
                        Map Clustering
                        <label class="switch">
                            <input type="checkbox" ${mapClustering ? 'checked' : null}
                                   onchange={toggleClustering()}
                                   name="clusterToggle"
                                   >
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                <h3>Filters</h3>
                <fieldset>
                    <legend>New York City</legend>
                    ${getFilterList()}
                </fieldset>`
            break;
    }

    menuContentBox.innerHTML = innerContent;
}

function getCameraList(area, list) {
    if (filterList.has(area)) return '';

    var elem = `<div class="areaList">
                    <h3>${area}</h3>`;

    for (var i = 0; i < list.length; i++) {
        if (i != 0) {
            elem += `<hr class="solid">`;
        }
        elem += `
            <div class="cameraListItem">
                ${list[i].name}
                <button class="popupButton"
                        id="${list[i].id}/${list[i].name}/list"
                        onclick="watchCamera(event)"
                        >
                    View
                </button>
            </div>
        `;
    }

    elem += `</div>`;

    return elem;
}

function toggleClustering() {
    // Remove all current markers and then redraw
    Object.keys(cameraIDsByArea).forEach((area) => {
        clearMarkersInArea(area);
    });

    mapClustering = !mapClustering;
    localStorage.setItem('mapClustering', mapClustering);
    Object.keys(cameraIDsByArea).forEach((area) => {
        showByAreaMarker(area);
    });
}

var currMarker;
var pannedMap = false;

function locateUser() {
    if (!currMarker) {
        map.locate({
            enableHighAccuracy: true,
            watch: true
        });
        
        map.on('locationfound', onLocationFound);
        map.on('movestart', onMapPan);
    } else {
        map.setView(currMarker.getLatLng(), 15);
    }

    if (currMarker) {
        locateIcon.style["background-color"] = "#0A66C2";
    }
}

function onLocationFound(e) {
    if (!currMarker) {
        currMarker = L.marker(e.latlng, {
            icon: L.icon({
                iconUrl: './assets/currentLocationMarker.svg',
                iconSize: [38, 45],
                iconAnchor: [18.5, 45]
            })
        }).addTo(map);

        map.setView(e.latlng, 15);
        locateIcon.style["background-color"] = "#0A66C2";

    } else {
        currMarker.setLatLng(e.latlng);
    }
}

function onMapPan(e) {
    if (pannedMap) {
        locateIcon.style["background-color"] = "grey";
    } else {
        pannedMap = true;
    }
}

window.addEventListener("click", (event) => {
    if (event.target == cameraBox) {
        closeCamera();
    } else if (event.target == menuContainingBox || event.target == menuBox) {
        toggleOpenMenu();
    }
})