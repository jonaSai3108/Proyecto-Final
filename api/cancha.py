from flask import Blueprint, request, jsonify
from db import get_connection  # Asegúrate de tener esta función en un archivo llamado db.py

cancha_bp = Blueprint('cancha_bp', __name__)

@cancha_bp.route('/', methods=['GET'])
def obtener_canchas():
    accion = request.args.get('accion', 'SELECT')
    id_cancha = request.args.get('id_cancha', 0)

    conn = get_connection()
    if not conn:
        return jsonify({'error': 'No se pudo conectar a la base de datos'}), 500

    try:
        cursor = conn.cursor()
        if accion == 'SELECT':
            cursor.callproc('sp_gestion_canchas', ['SELECT', 0, '', '', 0, 1])
        elif accion == 'SELECT_ONE':
            cursor.callproc('sp_gestion_canchas', ['SELECT_ONE', int(id_cancha), '', '', 0, 1])
        elif accion == 'SELECT_ALL':
            cursor.callproc('sp_gestion_canchas', ['SELECT_ALL', 0, '', '', 0, 1])
        else:
            return jsonify({'error': 'Acción inválida'}), 400

        for result in cursor.stored_results():
            rows = result.fetchall()
            columns = result.column_names
            data = [dict(zip(columns, row)) for row in rows]

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cancha_bp.route('/', methods=['POST'])
def crear_cancha():
    data = request.json
    nombre = data.get('nombre')
    ubicacion = data.get('ubicacion')
    capacidad = data.get('capacidad')

    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Conexión fallida'}), 500

    try:
        cursor = conn.cursor()
        cursor.callproc('sp_gestion_canchas', ['INSERT', 0, nombre, ubicacion, capacidad, 1])
        for result in cursor.stored_results():
            inserted_id = result.fetchone()[0]
        conn.commit()
        return jsonify({'message': 'Cancha creada', 'id_cancha': inserted_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cancha_bp.route('/<int:id_cancha>', methods=['PUT'])
def actualizar_cancha(id_cancha):
    data = request.json
    nombre = data.get('nombre')
    ubicacion = data.get('ubicacion')
    capacidad = data.get('capacidad')
    activo = data.get('activo', 1)

    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Conexión fallida'}), 500

    try:
        cursor = conn.cursor()
        cursor.callproc('sp_gestion_canchas', ['UPDATE', id_cancha, nombre, ubicacion, capacidad, activo])
        for result in cursor.stored_results():
            affected_rows = result.fetchone()[0]
        conn.commit()
        return jsonify({'message': 'Cancha actualizada', 'rows_afectadas': affected_rows})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cancha_bp.route('/<int:id_cancha>', methods=['DELETE'])
def eliminar_cancha(id_cancha):
    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Conexión fallida'}), 500

    try:
        cursor = conn.cursor()
        cursor.callproc('sp_gestion_canchas', ['DELETE', id_cancha, '', '', 0, 0])
        for result in cursor.stored_results():
            affected_rows = result.fetchone()[0]
        conn.commit()
        return jsonify({'message': 'Cancha eliminada', 'rows_afectadas': affected_rows})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cancha_bp.route('/<int:id_cancha>/restaurar', methods=['PUT'])
def restaurar_cancha(id_cancha):
    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Conexión fallida'}), 500

    try:
        cursor = conn.cursor()
        cursor.callproc('sp_gestion_canchas', ['RESTORE', id_cancha, '', '', 0, 1])
        for result in cursor.stored_results():
            affected_rows = result.fetchone()[0]
        conn.commit()
        return jsonify({'message': 'Cancha restaurada', 'rows_afectadas': affected_rows})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
