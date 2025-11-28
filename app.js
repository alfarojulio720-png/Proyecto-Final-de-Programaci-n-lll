const API = 'http://127.0.0.1:8000';

// Crear mapa centrado en El Salvador
const map = L.map('map').setView([13.70, -89.20], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);

// Variables
let currentMes = null;
let currentAnio = null;

// ------------ Cargar locales -------------
async function cargarLocales() {
    markers.clearLayers();

    const res = await fetch(`${API}/locales`);
    const locales = await res.json();

    locales.forEach(local => {

        const marker = L.marker([local.latitud, local.longitud]).addTo(markers);

        // evento click
        marker.on("click", () => {
            mostrarDatosLocal(local.id_local, marker, local.nombre_local);
        });
    });
}

// ------------ Mostrar datos de local -------------
async function mostrarDatosLocal(id_local, marker, nombre) {

    if (!currentMes || !currentAnio) {
        alert("Selecciona Mes y Año primero.");
        return;
    }

    const res = await fetch(`${API}/local/${id_local}/porcentaje?mes=${currentMes}&anio=${currentAnio}`);
    const data = await res.json();

    let ventas = data.ventas;
    let compras = data.compras;
    let ganancia = data.ganancia;
    let porcentaje = data.porcentaje;

    // Cambiar color del pin según porcentaje
    const icon = L.divIcon({
        className: "",
        html: `
            <div style="
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: ${porcentaje >= 0 ? "green" : "red"};
                border: 2px solid white;">
            </div>`
    });

    marker.setIcon(icon);

    // popup
    L.popup()
        .setLatLng(marker.getLatLng())
        .setContent(`
            <b>${nombre}</b><br>
            <hr>
            Ventas: $${ventas}<br>
            Compras: $${compras}<br>
            Ganancia: $${ganancia}<br>
            Porcentaje: <b style="color:${porcentaje >= 0 ? 'green' : 'red'}">${porcentaje}%</b>
        `)
        .openOn(map);
}

// ------------ Filtros -------------
document.getElementById("filtroMes").addEventListener("change", (e) => {
    currentMes = e.target.value;
    cargarLocales();
});

document.getElementById("filtroAnio").addEventListener("change", (e) => {
    currentAnio = e.target.value;
    cargarLocales();
});

// ------------ Iniciar -------------
cargarLocales();
