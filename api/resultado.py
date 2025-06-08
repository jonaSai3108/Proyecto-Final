from flask import Blueprint, request, jsonify
from db import get_connection

resultado_bp = Blueprint('resultado', __name__)

@resultado_bp.route('/resultado/<int:id_partido>', methods=['GET'])
def obtener_resultado(id_partido):
    try:
        conn = get_connection()
        if conn is None:
            return jsonify({'success': False, 'mensaje': 'No se pudo conectar a la base de datos'}), 500

        cursor = conn.cursor(dictionary=True)
        print(f"Consultando resultado para id_partido={id_partido}")

        cursor.callproc('sp_GestionResultadoPartido', ('SELECT_PARTIDO', id_partido, None, None))

        datos = []
        for result in cursor.stored_results():
            datos = result.fetchall()
            print(f"Datos obtenidos: {datos}")

        cursor.close()
        conn.close()

        if datos:
            return jsonify({'success': True, 'resultado': datos[0]})
        else:
            return jsonify({'success': False, 'mensaje': 'Partido no encontrado'}), 404

    except Exception as e:
        print(f"Error en obtener_resultado: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@resultado_bp.route('/resultado', methods=['POST'])
def registrar_resultado():
    try:
        data = request.get_json()
        print(f"Datos recibidos para registrar resultado: {data}")

        id_partido = data.get('id_partido')
        goles_local = data.get('goles_local')
        goles_visitante = data.get('goles_visitante')
        modo = data.get('modo', 'INSERT')  # Por defecto 'INSERT'

        if id_partido is None or goles_local is None or goles_visitante is None:
            return jsonify({'success': False, 'mensaje': 'Datos incompletos: id_partido, goles_local y goles_visitante son requeridos'}), 400

        conn = get_connection()
        if conn is None:
            return jsonify({'success': False, 'mensaje': 'No se pudo conectar a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.callproc('sp_GestionResultadoPartido', (modo, id_partido, goles_local, goles_visitante))
        conn.commit()

        print(f"Resultado {modo} para partido {id_partido} registrado con éxito")

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'mensaje': f'Resultado {modo.lower()} exitosamente'})

    except Exception as e:
        print(f"Error en registrar_resultado: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
