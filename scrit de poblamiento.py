# populate_db.py
import math
import mysql.connector
from datetime import datetime


DB_CONF = {
'host': 'localhost',
'user': 'root',
'password': '',
'database': 'mapa_empresas'
}


# Coordenadas centrales (ejemplo Barcelona). Modifica si quieres otra ciudad.
CENTER_LAT = 41.3879
CENTER_LNG = 2.16992


def rand_coord(lat0, lng0, radius_km=5):
# genera coordenadas aleatorias alrededor de un punto central
r = radius_km / 111.0 # aprox grados
u = random.random()
v = random.random()
w = r * math.sqrt(u)
t = 2 * math.pi * v
lat = lat0 + w * math.cos(t)
lng = lng0 + w * math.sin(t) / math.cos(math.radians(lat0))
return round(lat,7), round(lng,7)


def main():
conn = mysql.connector.connect(**DB_CONF)
cur = conn.cursor()


# Crear empresas
empresas = [f'Empresa {i+1}' for i in range(10)]
cur.executemany('INSERT INTO empresas (nombre) VALUES (%s)', [(e,) for e in empresas])
conn.commit()


cur.execute('SELECT id_empresa FROM empresas')
empresa_ids = [r[0] for r in cur.fetchall()]


# Crear 100 locales repartidos entre empresas
locales = []
for i in range(100):
eid = random.choice(empresa_ids)
nombre_local = f'Sucursal {i+1}'
direccion = f'C/ Falsa {random.randint(1,200)}, Ciudad'
lat, lng = rand_coord(CENTER_LAT, CENTER_LNG, radius_km=6)
locales.append((eid, nombre_local, direccion, lat, lng))


cur.executemany('INSERT INTO locales (id_empresa, nombre_local, direccion, latitud, longitud) VALUES (%s,%s,%s,%s,%s)', locales)
conn.commit()


# Obtener ids de locales
cur.execute('SELECT id_local FROM locales')
local_ids = [r[0] for r in cur.fetchall()]


# Crear movimientos para 12 meses (anio actual - 2025 por defecto)
YEAR = datetime.now().year
movimientos = []
for lid in local_ids:
# base de ventas/compra aleatoria por local
base_ventas = random.uniform(2000, 50000)
base_compras = base_ventas * random.uniform(0.5, 0.95)
for mes in range(1,13):
# fluctuación mensual
ventas = round(base_ventas * random.uniform(0.7, 1.3),2)
compras = round(base_compras * random.uniform(0.7, 1.3),2)
movimientos.append((lid, mes, YEAR, ventas, compras))


cur.executemany('INSERT INTO movimientos_mensuales (id_local, mes, anio, ventas, compras) VALUES (%s,%s,%s,%s,%s)', movimientos)
conn.commit()


cur.close()
conn.close()
print('Población completada: empresas, locales y movimientos insertados.')


if __name__ == '__main__':
main()