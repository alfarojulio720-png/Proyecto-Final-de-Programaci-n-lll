const API = 'http://127.0.0.1:8000';

// Crear mapa centrado en El Salvador
const map = L.map('map').setView([13.70, -89.20], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);

let currentMes = null;
let currentAnio = null;

// Función para ícono según ganancia
function iconoGanancia(ganancia) {
    return L.divIcon({
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
}

// Cargar locales
async function cargarLocales() {
    markers.clearLayers();

    const res = await fetch(`${API}/locales`);
    const locales = await res.json();

    locales.forEach(local => {
        const marker = L.marker([local.latitud, local.longitud]).addTo(markers);

        marker.bindTooltip(`${local.nombre_local} - ${local.empresa}`);

        marker.on("click", () => {
            mostrarDatosLocal(local.id_local, local.nombre_local, local.latitud, local.longitud, marker);
        });
    });
}

// Mostrar datos de ventas/compras/ganancia
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

    // Actualizar ícono
    marker.setIcon(iconoGanancia(ganancia));

    // Popup
    L.popup()
        .setLatLng([lat, lng])
        .setContent(`
            <div style="font-size:14px;">
                <b>${nombre}</b><br>
                <b>Mes:</b> ${currentMes}/${currentAnio}<br><br>
                <b>Ventas:</b> $${ventas}<br>
                <b>Compras:</b> $${compras}<br>
                <b>Ganancia:</b> 
                <span style="color:${ganancia >= 0 ? 'green' : 'red'};">
                    $${ganancia}
                </span>
            </div>
        `)
        .openOn(map);
}

// Filtros
document.getElementById("filtroMes").addEventListener("change", (e) => {
    currentMes = e.target.value;
    cargarLocales();
});

document.getElementById("filtroAnio").addEventListener("change", (e) => {
    currentAnio = e.target.value;
    cargarLocales();
});

// Inicio
cargarLocales();
