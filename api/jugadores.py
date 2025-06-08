from flask import Blueprint, request, jsonify
from db import get_connection

jugadores_bp = Blueprint('jugadores', __name__, url_prefix='/api/jugadores')



@jugadores_bp.route('/', methods=['GET'])
def listar_jugadores():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('jugador_crud', ('INFO_COMPLETA', 0, '', '', 0, 0, 0))
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
        cursor.callproc('jugador_crud', ('BUSCAR', id, '', '', 0, 0, 0))
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
        nombre = data.get('nombre', '')
        apellido = data.get('apellido', '')
        edad = data.get('edad', 0)
        id_equipo = data.get('id_equipo', 0)
        dorsal = data.get('dorsal', 0)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('AGREGAR', 0, nombre, apellido, edad, id_equipo, dorsal))
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
        nombre = data.get('nombre', '')
        apellido = data.get('apellido', '')
        edad = data.get('edad', 0)
        id_equipo = data.get('id_equipo', 0)
        dorsal = data.get('dorsal', 0)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc('jugador_crud', ('EDITAR', id, nombre, apellido, edad, id_equipo, dorsal))
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
        cursor.callproc('jugador_crud', ('ELIMINAR', id, '', '', 0, 0, 0))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Jugador eliminado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500