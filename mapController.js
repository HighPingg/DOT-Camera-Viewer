var cameraListByArea = {}

document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Map
    var map = L.map('map', {zoomControl: false}).setView([40.730610, -73.935242], 11);
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
                        iconUrl: 'assets/cctv_icon.png',
                        iconSize: [38, 38],
                        iconAnchor: [18.5, 45],
                        popupAnchor: [0, -46]
                    })
                }).addTo(map);

                var popupText = [];
                popupText.push(
                    `<div>
                        <span class="popupLabel" >Area: </span>${camera.area}
                        <br>
                        <span class="popupLabel" >Name: </span>${camera.name}
                        <br>
                        <div class="popupButtonBox" >
                            <button type="button" class="popupButton"
                                id="${camera.id}/${camera.name}"
                                onclick="watchCamera(event)"
                                >View</button>
                        </div>
                    </div>`
                )

                marker.bindPopup(popupText.join(''));

                // Add to Camera list
                if (cameraListByArea[camera.area] == undefined) {
                    cameraListByArea[camera.area] = [camera];
                } else {
                    cameraListByArea[camera.area].push(camera);
                }
            });
        });
});

function getCameraList(area, list) {
    var elem = `<div class="areaList">
                    <h2>${area}</h2>`;

    for (var i = 0; i < list.length; i++) {
        if (i != 0) {
            elem += `<hr class="solid">`;
        }

        elem += `
            <div class="cameraListItem">
                ${list[i].name}
                <button class="popupButton">View</button>
            </div>
        `;
    }

    elem += `</div>`;

    return elem;
}

var cameraIntervalId = undefined;
var currCameraId = undefined;
var isMenuActive = false;
var currentMenuSelection = undefined;

function setCameraURL() {
    cameraImage.src = `https://webcams.nyctmc.org/api/cameras/${currCameraId}/image?cacheAvoidance=${Math.floor(Math.random() * 100000)}`;
}

function watchCamera(event) {
    [id, camName] = event.target.id.split('/');

    cameraName.innerHTML = camName;
    cameraBox.style.display = 'flex';

    currCameraId = id;
    setCameraURL();
    cameraIntervalId = setInterval(setCameraURL, 1000);
}

function closeCamera() {
    cameraBox.style.display = 'none';
    cameraName.innerHTML = '';
    
    clearInterval(cameraIntervalId);
    cameraIntervalId = undefined;
    currCameraId = undefined;
}

window.addEventListener("click", (event) => {
    if (event.target == cameraBox) {
        closeCamera();
    }
})

function toggleOpenMenu() {
    if (currentMenuSelection == undefined) {
        controlMenu.style.display = "block";
        currentMenuSelection = "List";
        document.getElementById(`${currentMenuSelection}menuSelectButton`).disabled = true;
        
        setMenuContent('List');

    } else {
        controlMenu.style.display = "none";
        currentMenuSelection = undefined;

        setMenuContent(null);
        for (var i = 0; i < controlMenuButtons.children.length; i++) {
            controlMenuButtons.children[i].disabled = false;
        }
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

function setMenuContent(menuPage) {
    var innerContent = '';
    switch (menuPage) {
        case "List":
            for (const area in cameraListByArea) {
                innerContent += getCameraList(area, cameraListByArea[area]);
            }
            break;
    
        default:
            break;
    }

    menuContentBox.innerHTML = innerContent;
}