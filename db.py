import pyodbc

def get_connection():
    try:
        connection = pyodbc.connect(
            r'DRIVER={ODBC Driver 17 for SQL Server};'
            r'SERVER=localhost\SQLEXPRESS;' 
            r'DATABASE=NombreDeTuBaseDeDatos;'  
            r'Trusted_Connection=yes;'

        )
        return connection
    except Exception as e:
        print("Error al conectra a la base de datos", e)
        return None