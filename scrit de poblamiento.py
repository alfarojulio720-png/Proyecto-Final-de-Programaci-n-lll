import math
import random
import mysql.connector
from datetime import datetime

DB_CONF = {
    'host': 'localhost',
    'user': 'root',
    'password': '12345678',
    'database': 'mapa_empresas'
}

CENTER_LAT = 41.3879
CENTER_LNG = 2.16992

def rand_coord(lat0, lng0, radius_km=5):
    r = radius_km / 111.0
    u = random.random()
    v = random.random()
    w = r * math.sqrt(u)
    t = 2 * math.pi * v
    lat = lat0 + w * math.cos(t)
    lng = lng0 + w * math.sin(t) / math.cos(math.radians(lat0))
    return round(lat, 7), round(lng, 7)

def main():
    conn = mysql.connector.connect(**DB_CONF)
    cur = conn.cursor()

    empresas = [f'Empresa {i+1}' for i in range(5)]
    cur.executemany('INSERT INTO empresas (nombre) VALUES (%s)', [(e,) for e in empresas])
    conn.commit()

    cur.execute('SELECT id_empresa FROM empresas')
    empresa_ids = [row[0] for row in cur.fetchall()]

    locales = []
    for i in range(30):
        eid = random.choice(empresa_ids)
        nombre_local = f'Sucursal {i+1}'
        direccion = f'Calle Falsa #{random.randint(1, 200)}'
        lat, lng = rand_coord(CENTER_LAT, CENTER_LNG, radius_km=6)
        locales.append((eid, nombre_local, direccion, lat, lng))

    cur.executemany("""
        INSERT INTO locales (id_empresa, nombre_local, direccion, latitud, longitud)
        VALUES (%s,%s,%s,%s,%s)
    """, locales)
    conn.commit()

    cur.execute('SELECT id_local FROM locales')
    local_ids = [row[0] for row in cur.fetchall()]

    YEAR = datetime.now().year
    movimientos = []

    for lid in local_ids:
        base_ventas = random.uniform(2000, 60000)
        base_compras = base_ventas * random.uniform(0.5, 0.9)

        for mes in range(1, 12+1):
            ventas = round(base_ventas * random.uniform(0.7, 1.3), 2)
            compras = round(base_compras * random.uniform(0.7, 1.3), 2)
            movimientos.append((lid, mes, YEAR, ventas, compras))

    cur.executemany("""
        INSERT INTO movimientos_mensuales(id_local, mes, anio, ventas, compras)
        VALUES (%s,%s,%s,%s,%s)
    """, movimientos)
    conn.commit()

    cur.close()
    conn.close()
    print("✔ Poblamiento completado correctamente")

if __name__ == "__main__":
    main()
