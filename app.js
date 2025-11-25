const API = 'http://localhost:8000';
const map = L.map('map').setView([41.3879, 2.16992], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);
let currentFiltro = 'ventas';
let currentMes = null;
let markerMap = new Map();

// ----------------------
// Colores por tipo/valor
// ----------------------
function colorPorValor(tipo, valor) {
    if (tipo === 'ganancia') {
        return valor >= 0 ? 'green' : 'red';
    }
    return 'blue';
}

// ----------------------
// Filtros
// ----------------------
function cargarFiltro(tipo = 'ventas') {
    currentFiltro = tipo;
    cargarFiltroActual();
}

function cargarFiltroActual() {
    const mesInput = document.getElementById('mesinput').value;

    if (mesInput) {
        const [year, month] = mesInput.split('-');
        currentMes = { mes: parseInt(month), anio: parseInt(year) };
    } else {
        currentMes = null;
    }

    let url = API + '/locales/por_filtro?tipo=' + currentFiltro;
    if (currentMes) url += `&mes=${currentMes.mes}&anio=${currentMes.anio}`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            markers.clearLayers();
            markerMap.clear();

            data.forEach(item => {
                const val = item[currentFiltro] !== undefined ? Number(item[currentFiltro]) : 0;
                const c = colorPorValor(currentFiltro, val); // ← CORREGIDO

                const marker = L.circleMarker([item.latitud, item.longitud], {
                    radius: 10,
                    color: c,
                    fillColor: c,
                    fillOpacity: 0.8
                }).addTo(markers);

                marker.bindPopup(`
                    <b>${item.nombre}</b><br>
                    ${currentFiltro}: ${val}
                `);

                markerMap.set(item.id, marker);
            });
        });
}
