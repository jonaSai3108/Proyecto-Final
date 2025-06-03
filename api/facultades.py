from flask import Blueprint, request, jsonify
from db import get_connection

facultades_bp = Blueprint('facultades_bp', __name__)

# Obtener todas las facultades
@facultades_bp.route('/', methods=['GET'])
def obtener_todas_las_facultades():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id_facultad, carrera FROM facultades")  
        facultades = cursor.fetchall()
        
        return jsonify(facultades), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()