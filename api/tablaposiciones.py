from flask import Blueprint, jsonify
from db import get_connection

posiciones_bp = Blueprint('posiciones_bp', __name__)

@posiciones_bp.route('/', methods=['GET'])  # ruta raíz del blueprint
def obtener_posiciones():
    try:
        cnx = get_connection()
        cursor = cnx.cursor(dictionary=True)
        cursor.callproc('sp_posiciones')

        posiciones = []
        for result in cursor.stored_results():
            posiciones = result.fetchall()

        cursor.close()
        cnx.close()

        return jsonify(posiciones)
    except Exception as e:
        return jsonify({'error': str(e)})
