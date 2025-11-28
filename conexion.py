import mysql.connector

def conectar():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="12345678",
            database="bd_programacion"  
        )
        print("✅ Conexión exitosa a MySQL")
        return conn
    except mysql.connector.Error as error:
        print("❌ Error al conectar:", error)

# Ejecución de prueba
if __name__ == "__main__":
    conexion = conectar()
    if conexion:
        conexion.close()
