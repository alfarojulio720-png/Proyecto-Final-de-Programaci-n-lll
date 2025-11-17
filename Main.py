from fastapi import FastAPI, HTTPException
import mysql.connector

app = FastAPI()

# -----------------------------
# CONFIGURACIÓN DE BASE DE DATOS
# -----------------------------
DB_CONF = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "12345678",
    "database": "BD programacion"
}

def get_db():
    return mysql.connector.connect(**DB_CONF)


# -----------------------------------------
# 1. LISTA DE LOCALES + INFORMACIÓN BÁSICA
# -----------------------------------------
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


# ----------------------------------------------
# 2. DATOS MENSUALES DE UN LOCAL (ventas/compras)
# ----------------------------------------------
@app.get("/local/{id_local}/mensual")
def get_local_mensual(id_local: int, mes: int = None, anio: int = None):
    db = get_db()
    cur = db.cursor(dictionary=True)

    # Si vienen mes y año → retorna datos del mes
    if mes is not None and anio is not None:
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

    # Si NO se pasan mes y año → RESUMEN ANUAL
    cur.execute("""
        SELECT 
            SUM(ventas) AS ventas, 
            SUM(compras) AS compras, 
            SUM(ventas) - SUM(compras) AS ganancia
        FROM movimientos_mensuales 
        WHERE id_local=%s
    """, (id_local,))

    row = cur.fetchone()
    cur.close()
    db.close()

    return row


# --------------------------------------------------------
# 3. FILTRO DE LOCALES POR TIPO (ventas/compras/ganancia)
# --------------------------------------------------------
@app.get("/locales/por_filtro")
def locales_por_filtro(tipo: str = "ventas", mes: int = None, anio: int = None):

    if tipo not in ["ventas", "compras", "ganancia"]:
        raise HTTPException(status_code=400, detail="Tipo inválido. Use: ventas | compras | ganancia")

    db = get_db()
    cur = db.cursor(dictionary=True)

    # Filtro por mes y año
    if mes and anio:
        cur.execute("""
            SELECT 
                l.id_local, l.nombre_local, l.latitud, l.longitud,
                m.ventas, m.compras, (m.ventas - m.compras) AS ganancia
            FROM locales l
            JOIN movimientos_mensuales m ON m.id_local = l.id_local
            WHERE m.mes=%s AND m.anio=%s
        """, (mes, anio))

    else:
        cur.execute("""
            SELECT 
                l.id_local, l.nombre_local, l.latitud, l.longitud,
                SUM(m.ventas) AS ventas, 
                SUM(m.compras) AS compras, 
                SUM(m.ventas) - SUM(m.compras) AS ganancia
            FROM locales l
            JOIN movimientos_mensuales m ON m.id_local = l.id_local
            GROUP BY l.id_local
        """)

    rows = cur.fetchall()
    cur.close()
    db.close()

    return rows
