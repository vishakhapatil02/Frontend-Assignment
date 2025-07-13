let map = L.map('map').setView([17.385044, 78.486671], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let coords = [], marker, i = 0, interval;

let markerIcon = L.divIcon({
  className: 'rotating-car',
  html: `<img class="car-image" src="icons8-car-isometric-color-favicons/web/icons8-car-isometric-color-96.png" />`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

async function fetchRoute(start, end) {
  const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA1OTU1YjRlYzE3NTQ1YmZhZGRlYzQ4YzBhYjE0M2YxIiwiaCI6Im11cm11cjY0In0=';
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.features || data.features.length === 0) {
      throw new Error("No route found between these locations.");
    }

    const geometry = data.features[0].geometry.coordinates;
    coords = geometry.map(coord => [coord[1], coord[0]]);

    map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.polyline(coords, { color: 'blue' }).addTo(map);
    map.fitBounds(coords);

    marker = L.marker(coords[0], { icon: markerIcon }).addTo(map);
    i = 0;

  } catch (error) {
    alert("Failed to fetch route: " + error.message);
  }
}

async function geocode(place) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
  const data = await res.json();
  if (data.length === 0) throw new Error("Place not found");
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

document.getElementById('fetchRoute').addEventListener('click', async () => {
  const startPlace = document.getElementById('start').value;
  const endPlace = document.getElementById('end').value;
  if (!startPlace || !endPlace) return alert("Please enter both locations.");

  try {
    const [startCoords, endCoords] = await Promise.all([
      geocode(startPlace),
      geocode(endPlace)
    ]);
    await fetchRoute(startCoords, endCoords);
  } catch (err) {
    alert("Failed to fetch route. " + err.message);
  }
});

function animate() {
  if (!coords.length || i >= coords.length - 1) return;
  let start = coords[i];
  let end = coords[i + 1];
  let steps = 50, currentStep = 0;

  let latStep = (end[0] - start[0]) / steps;
  let lngStep = (end[1] - start[1]) / steps;
  const angle = getAngle(start[0], start[1], end[0], end[1]);

  clearInterval(interval);
  interval = setInterval(() => {
    let newLat = start[0] + latStep * currentStep;
    let newLng = start[1] + lngStep * currentStep;
    marker.setLatLng([newLat, newLng]);

    const img = document.querySelector('.car-image');
    if (img) img.style.transform = `rotate(${angle}deg)`;

    currentStep++;
    if (currentStep > steps) {
      clearInterval(interval);
      i++;
      animate();
    }
  }, 20);
}

function getAngle(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * (Math.PI / 180);
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const angle = Math.atan2(y, x);
  return (angle * 180 / Math.PI + 360) % 360;
}

document.getElementById('playBtn').addEventListener('click', () => {
  animate();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  clearInterval(interval);
});
