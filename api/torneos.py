from flask import Blueprint, jsonify, request
from db import get_connection

torneos_bp = Blueprint('torneos', __name__, url_prefix='/api/torneos')

# Crear un nuevo torneo
@torneos_bp.route('/', methods=['POST'])
def crear_torneo():
    datos = request.json
    campos = [
        'nombre', 'id_tipo_torneo', 'id_temporada', 'fecha_inicio', 'fecha_fin',
        'descripcion', 'reglamento', 'limite_equipos', 'fecha_insc_inicio', 'fecha_insc_fin'
    ]

    if not all(campo in datos for campo in campos):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    db = get_connection()
    with db.cursor() as cursor:
        cursor.callproc('sp_crear_torneo', (
            datos['nombre'],
            datos['id_tipo_torneo'],
            datos['id_temporada'],
            datos['fecha_inicio'],
            datos['fecha_fin'],
            datos['descripcion'],
            datos['reglamento'],
            datos['limite_equipos'],
            datos['fecha_insc_inicio'],
            datos['fecha_insc_fin']
        ))

        for result in cursor.stored_results():
            torneo_id = result.fetchone()['id_torneo']
            break

        db.commit()

    return jsonify({'mensaje': 'Torneo creado exitosamente', 'id_torneo': torneo_id}), 201

# Listar todos los torneos
@torneos_bp.route('/', methods=['GET'])
def listar_torneos():
    db = get_connection()
    if db is None:
        return jsonify({'error': 'No se pudo conectar a la base de datos'}), 500

    cursor = db.cursor(dictionary=True)
    cursor.execute('SELECT * FROM torneo')
    torneos = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(torneos)

#Modificar un torneo existente
@torneos_bp.route('/<int:id_torneo>', methods=['PUT'])
def modificar_torneo(id_torneo):
    datos = request.json
    campos = [
        'nombre', 'id_tipo_torneo', 'id_temporada', 'fecha_inicio', 'fecha_fin',
        'descripcion', 'reglamento', 'limite_equipos', 'fecha_insc_inicio', 'fecha_insc_fin'
    ]

    if not all(campo in datos for campo in campos):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    db = get_connection()
    with db.cursor() as cursor:
        cursor.execute('''
            UPDATE torneo SET
                nombre = %s,
                id_tipo_torneo = %s,
                id_temporada = %s,
                fecha_inicio = %s,
                fecha_fin = %s,
                descripcion = %s,
                reglamento = %s,
                limite_equipos = %s,
                fecha_insc_inicio = %s,
                fecha_insc_fin = %s
            WHERE id_torneo = %s
        ''', (
            datos['nombre'],
            datos['id_tipo_torneo'],
            datos['id_temporada'],
            datos['fecha_inicio'],
            datos['fecha_fin'],
            datos['descripcion'],
            datos['reglamento'],
            datos['limite_equipos'],
            datos['fecha_insc_inicio'],
            datos['fecha_insc_fin'],
            id_torneo
        ))
        db.commit()

    return jsonify({'mensaje': 'Torneo modificado correctamente'})

# Eliminar un torneo
@torneos_bp.route('/<int:id_torneo>', methods=['DELETE'])
def eliminar_torneo(id_torneo):
    db = get_connection()
    with db.cursor() as cursor:
        cursor.execute('DELETE FROM torneo WHERE id_torneo = %s', (id_torneo,))
        db.commit()
    return jsonify({'mensaje': 'Torneo eliminado correctamente'})