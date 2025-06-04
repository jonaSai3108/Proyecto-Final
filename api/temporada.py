from flask import Blueprint, request, jsonify
from datetime import datetime
from db import mysql

temporada_bp = Blueprint('temporada', __name__, url_prefix='/api/temporadas')

# Crear nueva temporada
@temporada_bp.route('/crear', methods=['POST'])
def crear_temporada():
    datos = request.get_json()
    
    required_fields = ['nombre', 'fecha_inicio', 'fecha_fin']
    if not all(field in datos for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin'}), 400
    
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('crear_temporada', [
            datos['nombre'],
            datos['fecha_inicio'],
            datos['fecha_fin'],
            0,  # placeholder para p_id
            ''   # placeholder para p_resultado
        ])
        
        cursor.execute('SELECT @p_id, @p_resultado')
        resultado = cursor.fetchone()
        cursor.close()
        
        if resultado['@p_id'] == -1:
            return jsonify({'error': resultado['@p_resultado']}), 400
        
        return jsonify({
            'id': resultado['@p_id'],
            'mensaje': resultado['@p_resultado'],
            'temporada': {
                'nombre': datos['nombre'],
                'fecha_inicio': datos['fecha_inicio'],
                'fecha_fin': datos['fecha_fin'],
                'estado': 'Pendiente'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Error al crear temporada: {str(e)}'}), 500

# Listar todas las temporadas
@temporada_bp.route('/listar', methods=['GET'])
def obtener_temporadas():
    try:
        # Actualizar estados primero
        cursor = mysql.connection.cursor()
        cursor.callproc('actualizar_estados_temporadas')
        cursor.close()
        
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%%Y-%%m-%%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%%Y-%%m-%%d') as fecha_fin,
                   estado
            FROM temporada
            ORDER BY fecha_inicio DESC
        """)
        
        temporadas = cursor.fetchall()
        cursor.close()
        
        return jsonify({
            'total': len(temporadas),
            'temporadas': temporadas
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al listar temporadas: {str(e)}'}), 500

# Obtener detalles de una temporada específica
@temporada_bp.route('/obtener/<int:id_temporada>', methods=['GET'])
def obtener_temporada(id_temporada):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%%Y-%%m-%%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%%Y-%%m-%%d') as fecha_fin,
                   estado
            FROM temporada
            WHERE id_temporada = %s
        """, (id_temporada,))
        
        temporada = cursor.fetchone()
        cursor.close()
        
        if not temporada:
            return jsonify({'error': f'Temporada con ID {id_temporada} no encontrada'}), 404
            
        return jsonify({'temporada': temporada}), 200
    except Exception as e:
        return jsonify({'error': f'Error al obtener temporada: {str(e)}'}), 500

# Actualizar una temporada existente
@temporada_bp.route('/actualizar/<int:id_temporada>', methods=['PUT'])
def actualizar_temporada(id_temporada):
    datos = request.get_json()
    
    required_fields = ['nombre', 'fecha_inicio', 'fecha_fin']
    if not all(field in datos for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin'}), 400
    
    try:
        # Verificar si existe la temporada
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT nombre FROM temporada WHERE id_temporada = %s", (id_temporada,))
        temp_existente = cursor.fetchone()
        
        if not temp_existente:
            cursor.close()
            return jsonify({'error': f'Temporada con ID {id_temporada} no encontrada'}), 404
        
        # Actualizar la temporada
        cursor.execute("""
            UPDATE temporada 
            SET nombre = %s, 
                fecha_inicio = %s, 
                fecha_fin = %s
            WHERE id_temporada = %s
        """, (datos['nombre'], datos['fecha_inicio'], datos['fecha_fin'], id_temporada))
        
        mysql.connection.commit()
        
        # Obtener datos actualizados
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%%Y-%%m-%%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%%Y-%%m-%%d') as fecha_fin,
                   estado
            FROM temporada
            WHERE id_temporada = %s
        """, (id_temporada,))
        
        temporada_actualizada = cursor.fetchone()
        cursor.close()
        
        return jsonify({
            'mensaje': 'Temporada actualizada correctamente',
            'temporada': temporada_actualizada
        }), 200
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': f'Error al actualizar temporada: {str(e)}'}), 500

# Eliminar una temporada
@temporada_bp.route('/eliminar/<int:id_temporada>', methods=['DELETE'])
def eliminar_temporada(id_temporada):
    try:
        cursor = mysql.connection.cursor()
        
        # Primero obtener datos para respuesta
        cursor.execute("""
            SELECT nombre, fecha_inicio, fecha_fin 
            FROM temporada 
            WHERE id_temporada = %s
        """, (id_temporada,))
        
        temp_eliminada = cursor.fetchone()
        
        if not temp_eliminada:
            cursor.close()
            return jsonify({'error': f'Temporada con ID {id_temporada} no encontrada'}), 404
        
        # Eliminar la temporada
        cursor.execute("DELETE FROM temporada WHERE id_temporada = %s", (id_temporada,))
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({
            'mensaje': 'Temporada eliminada correctamente',
            'temporada_eliminada': {
                'id': id_temporada,
                'nombre': temp_eliminada['nombre'],
                'fecha_inicio': temp_eliminada['fecha_inicio'].strftime('%Y-%m-%d'),
                'fecha_fin': temp_eliminada['fecha_fin'].strftime('%Y-%m-%d')
            }
        }), 200
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': f'Error al eliminar temporada: {str(e)}'}), 500

# Obtener la temporada actualmente activa
@temporada_bp.route('/actual', methods=['GET'])
def temporada_actual():
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('actualizar_estados_temporadas')
        
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%%Y-%%m-%%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%%Y-%%m-%%d') as fecha_fin
            FROM temporada
            WHERE estado = 'Activa'
            LIMIT 1
        """)
        
        temporada = cursor.fetchone()
        cursor.close()
        
        if not temporada:
            return jsonify({'mensaje': 'No hay temporada activa actualmente'}), 404
            
        return jsonify({
            'mensaje': 'Temporada activa encontrada',
            'temporada_actual': temporada
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al obtener temporada actual: {str(e)}'}), 500