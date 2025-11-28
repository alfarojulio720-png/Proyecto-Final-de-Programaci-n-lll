const API = 'http://127.0.0.1:8000';

// MAPA EN EL SALVADOR
const map = L.map('map').setView([13.70, -89.20], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = L.layerGroup().addTo(map);

let currentMes = null;
let currentAnio = null;
let filtroEmpresa = "todas";

// Ícono según porcentaje
function iconoPorcentaje(porcentaje) {
    let color = "gray";

    if (porcentaje > 20) color = "green";
    else if (porcentaje >= 0) color = "orange";
    else color = "red";

    return L.divIcon({
        className: "",
        html: `
            <div style="
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background-color: ${color};
                border: 2px solid white;">
            </div>`
    });
}

// Cargar sucursales
async function cargarLocales() {
    markers.clearLayers();

    const res = await fetch(`${API}/locales`);
    let locales = await res.json();

    // FILTRO POR EMPRESA
    if (filtroEmpresa !== "todas") {
        locales = locales.filter(l => l.empresa === filtroEmpresa);
    }

    locales.forEach(local => {
        const marker = L.marker([local.latitud, local.longitud]).addTo(markers);

        marker.bindTooltip(`${local.nombre_local} - ${local.empresa}`);

        marker.on("click", () => {
            mostrarDatosLocal(
                local.id_local,
                local.nombre_local,
                local.empresa,
                local.latitud,
                local.longitud,
                marker
            );
        });
    });

    if (currentMes && currentAnio) {
        calcularTotales();
    }
}

// Mostrar ventas, compras, productos, porcentaje
async function mostrarDatosLocal(id_local, nombre, empresa, lat, lng, marker) {

    if (!currentMes || !currentAnio) {
        alert("Selecciona Mes y Año primero.");
        return;
    }

    const res = await fetch(`${API}/local/${id_local}/mensual?mes=${currentMes}&anio=${currentAnio}`);
    const data = await res.json();

    let ventas = data.ventas ?? 0;
    let compras = data.compras ?? 0;
    let productos = data.productos ?? 0;
    let ganancia = ventas - compras;

    let porcentaje = ventas > 0 ? ((ganancia / ventas) * 100).toFixed(2) : 0;

    marker.setIcon(iconoPorcentaje(porcentaje));

    L.popup()
        .setLatLng([lat, lng])
        .setContent(`
            <div style="font-size:14px;">
                <b>${nombre}</b><br>
                <b>Empresa:</b> ${empresa}<br><br>

                <b>Mes:</b> ${currentMes}/${currentAnio}<br><br>

                <b>Ventas:</b> $${ventas}<br>
                <b>Compras:</b> $${compras}<br>
                <b>Ganancia:</b> $${ganancia}<br>
                <b>Productos vendidos:</b> ${productos}<br><br>

                <b>Porcentaje de ganancia:</b>
                <span style="color:${porcentaje >= 0 ? 'green' : 'red'};">
                    ${porcentaje}%
                </span>
            </div>
        `)
        .openOn(map);
}

// CALCULAR TOTALES GENERALES
async function calcularTotales() {

    const res = await fetch(`${API}/locales`);
    let locales = await res.json();

    // FILTRO POR EMPRESA
    if (filtroEmpresa !== "todas") {
        locales = locales.filter(l => l.empresa === filtroEmpresa);
    }

    let totalVentas = 0;
    let totalCompras = 0;
    let totalProductos = 0;

    for (let local of locales) {
        const r = await fetch(`${API}/local/${local.id_local}/mensual?mes=${currentMes}&anio=${currentAnio}`);
        const data = await r.json();

        totalVentas += data.ventas ?? 0;
        totalCompras += data.compras ?? 0;
        totalProductos += data.productos ?? 0;
    }

    let gananciaTotal = totalVentas - totalCompras;
    let porcentajeTotal = totalVentas > 0 ? ((gananciaTotal / totalVentas) * 100).toFixed(2) : 0;

    document.getElementById("panelTotales").innerHTML = `
        <b>TOTALES GENERALES (${filtroEmpresa === "todas" ? "Todas las empresas" : filtroEmpresa})</b><br>
        Ventas: $${totalVentas}<br>
        Compras: $${totalCompras}<br>
        Ganancia: $${gananciaTotal}<br>
        Productos: ${totalProductos}<br>
        Porcentaje: ${porcentajeTotal}%<br>
    `;
}

// EVENTOS DE FILTRO
document.getElementById("filtroMes").addEventListener("change", (e) => {
    currentMes = e.target.value;
    cargarLocales();
});

document.getElementById("filtroAnio").addEventListener("change", (e) => {
    currentAnio = e.target.value;
    cargarLocales();
});

document.getElementById("filtroEmpresa").addEventListener("change", (e) => {
    filtroEmpresa = e.target.value;
    cargarLocales();
});

cargarLocales();
