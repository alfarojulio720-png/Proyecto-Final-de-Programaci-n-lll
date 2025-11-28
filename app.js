const API = 'http://127.0.0.1:8000';

// Crear mapa
const map = L.map('map').setView([13.6929, -89.2182], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);

// Variables de filtros
let currentMes = null;
let currentAnio = null;

// ----------- FUNCIÓN PARA CREAR ÍCONO SEGÚN GANANCIA ----------
function iconoPorGanancia(ganancia) {
    return L.circleMarker([0, 0], {
        radius: 10,
        color: ganancia >= 0 ? "green" : "red",
        fillColor: ganancia >= 0 ? "lightgreen" : "pink",
        fillOpacity: 0.8,
        weight: 2
    }); 
}

// ----------- Cargar Locales ----------
async function cargarLocales() {
    markers.clearLayers();

    const res = await fetch(`${API}/locales`);
    const locales = await res.json();

    locales.forEach(local => {
        const marker = L.marker([local.latitud, local.longitud]).addTo(markers);

        marker.bindTooltip(local.nombre_local);

        marker.on("click", () => {
            mostrarDatosLocal(local.id_local, local.nombre_local, local.latitud, local.longitud, marker);
        });
    });
}

// ----------- Mostrar datos de ventas/compras/ganancia ----------
async function mostrarDatosLocal(id_local, nombre, lat, lng, marker) {

    if (!currentMes || !currentAnio) {
        alert("Selecciona Mes y Año primero.");
        return;
    }

    const res = await fetch(`${API}/local/${id_local}/mensual?mes=${currentMes}&anio=${currentAnio}`);
    const data = await res.json();

    let ventas = data.ventas ?? 0;
    let compras = data.compras ?? 0;
    let ganancia = ventas - compras;

    // Cambiar color del marcador dependiendo de ganancia
    const icon = L.divIcon({
        className: "",
        html: `
            <div style="
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: ${ganancia >= 0 ? "green" : "red"};
                border: 2px solid white;">
            </div>`
    });

    marker.setIcon(icon);

    L.popup()
        .setLatLng([lat, lng])
        .setContent(`
            <div style="font-size:14px;">
                <b>${nombre}</b><br>
                <hr>
                <b>Mes:</b> ${currentMes}/${currentAnio}<br><br>
                <b>Ventas:</b> $${ventas}<br>
                <b>Compras:</b> $${compras}<br>
                <b>Ganancia:</b> <span style="color:${ganancia >= 0 ? 'green' : 'red'};">
                    $${ganancia}
                </span><br>
            </div>
        `)
        .openOn(map);
}

// ----------- Filtros -----------
document.getElementById("filtroMes").addEventListener("change", (e) => {
    currentMes = e.target.value;
    cargarLocales();
});

document.getElementById("filtroAnio").addEventListener("change", (e) => {
    currentAnio = e.target.value;
    cargarLocales();
});

// ----------- Iniciar -----------
cargarLocales();
