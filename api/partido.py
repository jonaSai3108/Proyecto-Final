from flask import Blueprint, request, jsonify
from db import get_connection


partido_bp = Blueprint('partido_bp', __name__, url_prefix='/api/partidos')
  

@partido_bp.route('/', methods=['GET'])
def listar_partidos():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.callproc('sp_ListarPartidosProximos')
        
        partidos = []
        for result in cursor.stored_results():
            partidos = result.fetchall()

        if not partidos:
            return jsonify({"mensaje": "No hay partidos disponibles", "data": []}), 200

        return jsonify({
            "success": True,
            "data": partidos,
            "count": len(partidos)
        })

    except Exception as e:
        print(f"Error al obtener partidos: {str(e)}")  # Log para depuración
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@partido_bp.route('/', methods=['POST'])
def crear_partido():
    try:
        data = request.get_json()  # Mejor usar get_json() para manejo de errores
        
        if not data:
            return jsonify({"success": False, "error": "Datos no proporcionados"}), 400

        required_fields = ['id_jornada', 'id_cancha', 'fecha_partido', 'hora_partido', 'estado']
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "error": "Faltan campos requeridos"}), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.callproc('sp_InsertarPartido', (
            data['id_jornada'],
            data['id_cancha'],
            data['fecha_partido'],
            data['hora_partido'],
            data['estado']
        ))
        connection.commit()

        return jsonify({
            "success": True,
            "mensaje": "Partido creado exitosamente"
        })

    except Exception as e:
        print(f"Error al crear partido: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()




@partido_bp.route('/editar/<int:id_partido>', methods=['PUT'])
def editar_partido(id_partido):
    try:
        data = request.get_json()

        required_fields = ['id_jornada', 'id_cancha', 'fecha_partido', 'hora_partido', 'estado']
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "error": "Faltan campos requeridos"}), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.callproc('sp_EditarPartido', (
            id_partido,
            data['id_jornada'],
            data['id_cancha'],
            data['fecha_partido'],
            data['hora_partido'],
            data['estado']
        ))
        connection.commit()

        return jsonify({'success': True, 'mensaje': 'Partido editado correctamente'})

    except Exception as e:
        print(f"Error al editar partido: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()



@partido_bp.route('/eliminar/<int:id_partido>', methods=['DELETE'])
def eliminar_partido(id_partido):
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.callproc('sp_EliminarPartido', (id_partido,))
        connection.commit()

        return jsonify({'success': True, 'mensaje': 'Partido eliminado (desactivado)'})

    except Exception as e:
        error_msg = str(e)
        print(f"Error al eliminar partido: {error_msg}")
        return jsonify({'success': False, 'error': error_msg}), 400

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()