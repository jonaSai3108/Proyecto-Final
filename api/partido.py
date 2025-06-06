from flask import Blueprint, request, jsonify
from db import get_connection

partido_bp = Blueprint('partido', __name__)

@partido_bp.route('/listar', methods=['GET'])
def listar_partidos():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.callproc('sp_ListarPartidosProximos')
        for result in cursor.stored_results():
            partidos = result.fetchall()

        return jsonify(partidos)

    finally:
        cursor.close()
        connection.close()


@partido_bp.route('/crear', methods=['POST'])
def crear_partido():
    data = request.json
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

    return jsonify({'mensaje': 'Partido creado exitosamente'})


@partido_bp.route('/editar/<int:id_partido>', methods=['PUT'])
def editar_partido(id_partido):
    data = request.json
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

    return jsonify({'mensaje': 'Partido editado correctamente'})


@partido_bp.route('/eliminar/<int:id_partido>', methods=['DELETE'])
def eliminar_partido(id_partido):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.callproc('sp_EliminarPartido', (id_partido,))
        connection.commit()
        return jsonify({'mensaje': 'Partido eliminado (desactivado)'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        connection.close()
