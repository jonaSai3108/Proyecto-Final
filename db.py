import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',         # o el host donde tengas el servidor MySQL
            port=3306,                # puerto por defecto de MySQL
            user='root',        # tu usuario, por ejemplo 'root'
            password='1230', # tu contraseña
            database='DBTorneosFutbol'
        )
        if connection.is_connected():
            print("Conexión exitosa a la base de datos")
            return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None