from flask import Blueprint, request, jsonify
from db import get_connection  # Import relativo al padre

resultado_bp = Blueprint('resultado', __name__)

@resultado_bp.route('/partidos', methods=['GET'])
def obtener_partidos():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_partido, equipo_local, equipo_visitante, fecha
            FROM partidos
            WHERE estado IN ('Programado', 'Jugando')
        """)
        return jsonify({
            'success': True,
            'data': cursor.fetchall()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@resultado_bp.route('/<int:id_partido>', methods=['GET'])
def obtener_resultado(id_partido):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_GestionResultadoPartido', ('SELECT', id_partido, None, None))
        
        if (result := next(cursor.stored_results(), None)):
            if (data := result.fetchone()):
                return jsonify({'success': True, 'data': data})
        
        return jsonify({'success': False, 'message': 'No encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@resultado_bp.route('', methods=['GET'])
def listar_resultados():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.id_partido, p.fecha, p.estado,
                   r.goles_local, r.goles_visitante
            FROM partidos p
            LEFT JOIN resultados r ON p.id_partido = r.id_partido
        """)
        return jsonify({
            'success': True,
            'data': cursor.fetchall()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@resultado_bp.route('', methods=['POST'])
def registrar_resultado():
    try:
        data = request.get_json()
        if not all(k in data for k in ['id_partido', 'goles_local', 'goles_visitante']):
            return jsonify({'success': False, 'message': 'Datos incompletos'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('sp_GestionResultadoPartido', (
            data.get('modo', 'INSERT'),
            data['id_partido'],
            data['goles_local'],
            data['goles_visitante']
        ))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Operación exitosa'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()