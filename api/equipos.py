from flask import Blueprint, request, jsonify
from db import get_connection

equipos_bp = Blueprint('equipos_bp', __name__)

@equipos_bp.route('/', methods=['GET'])
def obtener_todos_los_equipos():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc('equipo_crud', ('SELECT_ALL', 0, '', '', '', '', None, 0))

        for result in cursor.stored_results():
            equipos = result.fetchall()

        return jsonify(equipos), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# INSERTAR EQUIPO
@equipos_bp.route('/insertar', methods=['POST'])
def insertar_equipo():
    data = request.json
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.callproc('equipo_crud', (
            'INSERT',
            0,
            data['nombre'],
            data['representante'],
            data['contacto'],
            data['estado'],
            data['fecha_registro'],
            data['id_facultad'] 
        ))
        conn.commit()

        return jsonify({'mensaje': 'Equipo insertado correctamente'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# OBTENER UN EQUIPO POR ID
@equipos_bp.route('/<int:id_equipo>', methods=['GET'])
def obtener_equipo(id_equipo):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc('equipo_crud', (
            'SELECT',
            id_equipo,
            '', '', '', '', None, 0
        ))

        equipo = None
        for result in cursor.stored_results():
            data = result.fetchall()
            if data:
                equipo = data[0]  

        if equipo is None:
            return jsonify({'error': 'Equipo no encontrado'}), 404

        return jsonify(equipo), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ACTUALIZAR EQUIPO
@equipos_bp.route('/actualizar/<int:id_equipo>', methods=['PUT'])
def actualizar_equipo(id_equipo):
    data = request.json
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.callproc('equipo_crud', (
            'UPDATE',
            id_equipo,
            data['nombre'],
            data['representante'],
            data['contacto'],
            data['estado'],
            data['fecha_registro'],
            data['id_facultad'] 
        ))
        conn.commit()

        return jsonify({'mensaje': 'Equipo actualizado correctamente'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ELIMINAR EQUIPO
@equipos_bp.route('/eliminar/<int:id_equipo>', methods=['DELETE'])
def eliminar_equipo(id_equipo):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.callproc('equipo_crud', (
            'DELETE',
            id_equipo,
            '', '', '', '', None, 0
        ))
        conn.commit()

        return jsonify({'mensaje': 'Equipo eliminado correctamente'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


#Ruta para consumir la vista que nos muestra los detalles de cualquier equipo
@equipos_bp.route('/vista/<int:id_equipo>', methods=['GET'])
def obtener_equipo_vista(id_equipo):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM vista_equipo_facultad WHERE id_equipo = %s", (id_equipo,))
        equipo = cursor.fetchone()

        if equipo is None:
            return jsonify({'error': 'Equipo no encontrado'}), 404

        return jsonify(equipo), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()