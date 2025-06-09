from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from db import get_connection
from PIL import Image
from io import BytesIO

equipos_bp = Blueprint('equipos_bp', __name__)
UPLOAD_FOLDER = 'static/imagenes/logos'

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
    conn = None
    cursor = None
    try:
        nombre = request.form['nombre']
        representante = request.form['representante']
        contacto = request.form['contacto']
        estado = request.form['estado']
        fecha_registro = request.form['fecha_registro']
        id_facultad = request.form['id_facultad']
        logo = request.files.get('logo')

        print("Logo recibido:", logo.filename if logo else None)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc('equipo_crud', (
            'INSERT',
            0, 
            nombre,
            representante,
            contacto,
            estado,
            fecha_registro,
            id_facultad,
        ))
        conn.commit()
      
        nuevo_id = None
        for result in cursor.stored_results():
            row = result.fetchone()
            print("Resultado SP:", row)
            if row and 'id_equipo' in row:
                nuevo_id = row['id_equipo']

        print("Nuevo ID generado:", nuevo_id)

        if logo and logo.filename and nuevo_id:
            try:
                img = Image.open(logo.stream)
                png_path = os.path.join(UPLOAD_FOLDER, f"{nuevo_id}.png")
                print("Guardando logo en:", png_path)
                img.convert("RGBA").save(png_path, format="PNG")
                print("Logo guardado correctamente.")
            except Exception as img_err:
                print("Error al guardar la imagen:", img_err)
        else:
            print("No se guardó el logo (falta archivo o id).")

        return jsonify({'mensaje': 'Equipo insertado correctamente'}), 201

    except Exception as e:
        print("Error en insertar_equipo:", e)
        return jsonify({'error': str(e)}), 500

    finally:
        try:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
        except Exception as close_err:
            print("Error cerrando conexión/cursor:", close_err)


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

    
# Obtener detalles de un equipo
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