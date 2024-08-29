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
                var marker = L.marker([camera.latitude, camera.longitude]).addTo(map);
            });
        })
});
