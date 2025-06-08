from flask import Blueprint, request, jsonify
from db import get_connection

jugadores_bp = Blueprint('jugadores', __name__, url_prefix='/api/jugadores')

@jugadores_bp.route('/', methods=['GET'])
def listar_jugadores():
    try:
        nombre = request.args.get('nombre', '')
        id_equipo = int(request.args.get('id_equipo', 0))
        estado = request.args.get('estado', '-1')

        try:
            estado_int = int(estado)
        except ValueError:
            estado_int = -1

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('jugador_crud', ('BUSCAR_FILTRO', 0, nombre, '', 0, id_equipo, 0, estado_int))
        jugadores = []
        for result in cursor.stored_results():
            jugadores = result.fetchall()
        cursor.close()
        conn.close()

        return jsonify(jugadores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jugadores_bp.route('/<int:id>', methods=['GET'])
def obtener_jugador(id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('jugador_crud', ('BUSCAR', id, '', '', 0, 0, 0, 0))
        jugador = None
        for result in cursor.stored_results():
            jugador = result.fetchone()
        cursor.close()
        conn.close()

        if jugador:
            return jsonify(jugador)
        else:
            return jsonify({'message': 'Jugador no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jugadores_bp.route('/', methods=['POST'])
def agregar_jugador():
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        apellido = data.get('apellido', '').strip()
        edad = int(data.get('edad', 0))
        id_equipo = int(data.get('id_equipo', 0))
        dorsal = int(data.get('dorsal', 0))

        if not nombre or not apellido or edad <= 0 or id_equipo == 0:
            return jsonify({'error': 'Datos incompletos o inválidos'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('AGREGAR', 0, nombre, apellido, edad, id_equipo, dorsal, 1))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Jugador agregado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jugadores_bp.route('/<int:id>', methods=['PUT'])
def editar_jugador(id):
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        apellido = data.get('apellido', '').strip()
        edad = int(data.get('edad', 0))
        id_equipo = int(data.get('id_equipo', 0))
        dorsal = int(data.get('dorsal', 0))

        if not nombre or not apellido or edad <= 0 or id_equipo == 0:
            return jsonify({'error': 'Datos incompletos o inválidos'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('EDITAR', id, nombre, apellido, edad, id_equipo, dorsal, 1))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Jugador actualizado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jugadores_bp.route('/<int:id>', methods=['DELETE'])
def eliminar_jugador(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('ELIMINAR', id, '', '', 0, 0, 0, 0))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Jugador desactivado correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jugadores_bp.route('/<int:id>/estado', methods=['PUT'])
def cambiar_estado_jugador(id):
    try:
        data = request.get_json()
        nuevo_estado = data.get('activo', None)
        if nuevo_estado is None or nuevo_estado not in [0, 1]:
            return jsonify({'error': 'Estado inválido, debe ser 0 o 1'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('CAMBIAR_ESTADO', id, '', '', 0, 0, 0, nuevo_estado))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Estado actualizado correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
