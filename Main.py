from fastapi import FastAPI, HTTPException
import mysql.connector

app = FastAPI()

DB_CONF = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "mapa_empresas"
}

def get_db():
    return mysql.connector.connect(**DB_CONF)


# ---------------------------------------------------------
# 1. Obtener todos los locales
# ---------------------------------------------------------
@app.get("/locales")
def get_locales():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT 
            l.id_local,
            l.nombre_local,
            l.latitud,
            l.longitud,
            l.direccion,
            e.nombre AS empresa
        FROM locales l
        JOIN empresas e ON e.id_empresa = l.id_empresa
    """)

    rows = cur.fetchall()
    cur.close()
    db.close()
    return rows


# ---------------------------------------------------------
# 2. Datos mensuales o anuales de un local
# ---------------------------------------------------------
@app.get("/local/{id_local}/mensual")
def get_local_mensual(id_local: int, mes: int = None, anio: int = None):

    db = get_db()
    cur = db.cursor(dictionary=True)

    if mes and anio:
        cur.execute("""
            SELECT ventas, compras, (ventas - compras) AS ganancia
            FROM movimientos_mensuales
            WHERE id_local=%s AND mes=%s AND anio=%s
        """, (id_local, mes, anio))

        row = cur.fetchone()

        cur.close()
        db.close()

        if not row:
            raise HTTPException(status_code=404, detail="Datos no encontrados")

        return row

    cur.execute("""
        SELECT 
            SUM(ventas) AS ventas,
            SUM(compras) AS compras,
            SUM(ventas - compras) AS ganancia
        FROM movimientos_mensuales
        WHERE id_local=%s
    """, (id_local,))

    row = cur.fetchone()
    cur.close()
    db.close()
    return row


# ---------------------------------------------------------
# 3. Filtro por ventas/compras/ganancia + fecha
# ---------------------------------------------------------
@app.get("/locales/por_filtro")
def locales_por_filtro(tipo: str = "ventas", mes: int = None, anio: int = None):

    if tipo not in ["ventas", "compras", "ganancia"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    db = get_db()
    cur = db.cursor(dictionary=True)

    if mes and anio:
        cur.execute(f"""
            SELECT 
                l.id_local,
                l.nombre_local,
                l.latitud,
                l.longitud,
                m.ventas,
                m.compras,
                (m.ventas - m.compras) AS ganancia
            FROM locales l
            JOIN movimientos_mensuales m ON m.id_local = l.id_local
            WHERE m.mes=%s AND m.anio=%s
        """, (mes, anio))

    else: 
        cur.execute("""
            SELECT 
                l.id_local,
                l.nombre_local,
                l.latitud,
                l.longitud,
                SUM(m.ventas) AS ventas,
                SUM(m.compras) AS compras,
                SUM(m.ventas - m.compras) AS ganancia
            FROM locales l
            JOIN movimientos_mensuales m ON m.id_local = l.id_local
            GROUP BY l.id_local
        """)

    rows = cur.fetchall()
    cur.close()
    db.close()
    return rows

@app.get("/local/{id_local}/porcentaje")
def porcentaje_local(id_local: int, mes: int, anio: int):
    conn = mysql.connector.connect(**db)
    cur = conn.cursor(dictionary=True)

    query = """
        SELECT ventas, compras
        FROM movimientos_mensuales
        WHERE id_local = %s AND mes = %s AND anio = %s
    """

    cur.execute(query, (id_local, mes, anio))
    data = cur.fetchone()

    ventas = data["ventas"] or 0
    compras = data["compras"] or 0
    ganancia = ventas - compras
    porcentaje = (ganancia / ventas * 100) if ventas > 0 else 0

    return {
        "id_local": id_local,
        "ventas": ventas,
        "compras": compras,
        "ganancia": ganancia,
        "porcentaje": round(porcentaje, 2)
    }
