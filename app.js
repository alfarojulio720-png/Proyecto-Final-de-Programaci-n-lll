const API = 'http://localhost:8000';
const map = L.map('map').setView([41.3879, 2.16992], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);
let currentFiltro = 'ventas';
let currentMes = null;

function colorPorValor(tipo, valor) {
    if (tipo === 'ganancia') {
        return valor >= 0 ? 'green' : 'red';
    }
    return 'blue';
}

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

            data.forEach(item => {
                const val = Number(item[currentFiltro]);
                const c = colorPorValor(currentFiltro, val);

                const marker = L.circleMarker([item.latitud, item.longitud], {
                    radius: 10,
                    color: c,
                    fillColor: c,
                    fillOpacity: 0.8
                }).addTo(markers);

                marker.bindPopup(`
                    <b>${item.nombre_local}</b><br>
                    ${currentFiltro}: ${val}
                `);
            });
        });
}
