from flask import Blueprint, request, jsonify
from db import get_connection

temporada_bp = Blueprint('temporada',__name__, url_prefix='/api/temporadas')

# Crear nueva temporada
@temporada_bp.route('/crear', methods=['POST'])
def crear_temporada():
    datos = request.get_json()
    required_fields = ['nombre', 'fecha_inicio', 'fecha_fin']
    if not all(field in datos for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin'}), 400

    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500

        cursor = connection.cursor()
        args = [datos['nombre'], datos['fecha_inicio'], datos['fecha_fin'], 0, '']
        result_args = cursor.callproc('crear_temporada', args)

        p_id = result_args[3]
        p_resultado = result_args[4]
        print('DEBUG crear_temporada:', p_id, p_resultado)

        if p_id == -1:
            connection.rollback()
            cursor.close()
            connection.close()
            return jsonify({'error': p_resultado}), 400

        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({'mensaje': p_resultado}), 201

    except Exception as e:
        return jsonify({'error': f'Error inesperado: {str(e)}'}), 500
        
        

# Listar todas las temporadas
@temporada_bp.route('/listar', methods=['GET'])
def obtener_temporadas():
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500
            
        cursor = connection.cursor(dictionary=True)
        cursor.callproc('actualizar_estados_temporadas')
        connection.commit()
        
        # Solo muestra temporadas que NO están archivadas
        cursor.execute("""
            SELECT t.id_temporada, t.nombre, 
                DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                DATE_FORMAT(t.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                t.estado,
                COUNT(DISTINCT tr.id_torneo) AS torneos,
                COUNT(DISTINCT eg.id_equipo) AS equipos_inscritos
            FROM temporada t
            LEFT JOIN torneo tr ON t.id_temporada = tr.id_temporada
            LEFT JOIN grupo g ON tr.id_torneo = g.id_torneo
            LEFT JOIN equipo_grupo eg ON g.id_grupo = eg.id_grupo
            WHERE t.estado != 'Archivada'
            GROUP BY t.id_temporada, t.nombre, t.fecha_inicio, t.fecha_fin, t.estado
            ORDER BY t.fecha_inicio DESC;
        """)
        temporadas = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return jsonify({
            'total': len(temporadas),
            'temporadas': temporadas
        }), 200
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al listar temporadas: {str(e)}'}), 500

# Obtener detalles de una temporada específica
@temporada_bp.route('/obtener/<int:id_temporada>', methods=['GET'])
def obtener_temporada(id_temporada):
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500
            
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.id_temporada, t.nombre, 
                   DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') as fecha_inicio,
                   DATE_FORMAT(t.fecha_fin, '%Y-%m-%d') as fecha_fin,
                   t.estado
            FROM temporada t
            WHERE t.id_temporada = %s
        """, (id_temporada,))
        temporada = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if not temporada:
            return jsonify({'error': f'Temporada con ID {id_temporada} no encontrada'}), 404
            
        return jsonify({'temporada': temporada}), 200
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al obtener temporada: {str(e)}'}), 500

# Actualizar una temporada existente
@temporada_bp.route('/actualizar/<int:id_temporada>', methods=['PUT'])
def actualizar_temporada(id_temporada):
    datos = request.get_json()
    
    required_fields = ['nombre', 'fecha_inicio', 'fecha_fin']
    if not all(field in datos for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin'}), 400
    
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500
            
        cursor = connection.cursor(dictionary=True)
        
        # Verificar si existe la temporada
        cursor.execute("SELECT nombre FROM temporada WHERE id_temporada = %s", (id_temporada,))
        temp_existente = cursor.fetchone()
        
        if not temp_existente:
            cursor.close()
            connection.close()
            return jsonify({'error': f'Temporada con ID {id_temporada} no encontrada'}), 404
        
        # Actualizar la temporada
        cursor.execute("""
            UPDATE temporada 
            SET nombre = %s, 
                fecha_inicio = %s, 
                fecha_fin = %s
            WHERE id_temporada = %s
        """, (datos['nombre'], datos['fecha_inicio'], datos['fecha_fin'], id_temporada))
        
        connection.commit()
        
        # Obtener datos actualizados
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%Y-%m-%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%Y-%m-%d') as fecha_fin,
                   estado
            FROM temporada
            WHERE id_temporada = %s
        """, (id_temporada,))
        
        temporada_actualizada = cursor.fetchone()
        cursor.close()
        connection.close()
        
        return jsonify({
            'mensaje': 'Temporada actualizada correctamente',
            'temporada': temporada_actualizada
        }), 200
        
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al actualizar temporada: {str(e)}'}), 500

# Arcivar una temporada una vez que ha finalizado
# Esto se puede hacer cambiando el estado de la temporada a 'Archivada'
@temporada_bp.route('/archivar/<int:id_temporada>', methods=['PUT'])
def archivar_temporada(id_temporada):
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500

        cursor = connection.cursor(dictionary=True)
        
        # Verificar si existe la temporada primero
        cursor.execute("SELECT id_temporada FROM temporada WHERE id_temporada = %s", (id_temporada,))
        if not cursor.fetchone():
            return jsonify({'error': 'Temporada no encontrada'}), 404
            
        # Actualizar el estado
        cursor.execute("UPDATE temporada SET estado = 'Archivada' WHERE id_temporada = %s", (id_temporada,))
        
        # Verificar cuántas filas fueron afectadas
        if cursor.rowcount == 0:
            connection.rollback()
            return jsonify({'error': 'No se pudo archivar la temporada'}), 400
            
        connection.commit()
        
        # Obtener los datos actualizados para devolverlos
        cursor.execute("""
            SELECT id_temporada, nombre, estado 
            FROM temporada 
            WHERE id_temporada = %s
        """, (id_temporada,))
        temporada = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'mensaje': 'Temporada archivada correctamente',
            'temporada': temporada
        }), 200
        
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al archivar temporada: {str(e)}'}), 500

# Obtener la temporada actualmente activa
@temporada_bp.route('/actual', methods=['GET'])
def temporada_actual():
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500
            
        cursor = connection.cursor(dictionary=True)
        cursor.callproc('actualizar_estados_temporadas')
        connection.commit()
        
        cursor.execute("""
            SELECT id_temporada, nombre, 
                   DATE_FORMAT(fecha_inicio, '%Y-%m-%d') as fecha_inicio,
                   DATE_FORMAT(fecha_fin, '%Y-%m-%d') as fecha_fin
            FROM temporada
            WHERE estado = 'Activa'
            LIMIT 1
        """)
        
        temporada = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if not temporada:
            return jsonify({'mensaje': 'No hay temporada activa actualmente'}), 404
            
        return jsonify({
            'mensaje': 'Temporada activa encontrada',
            'temporada_actual': temporada
        }), 200
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al obtener temporada actual: {str(e)}'}), 500
 
 # Listar temporadas archivadas
@temporada_bp.route('/archivadas', methods=['GET'])
def listar_temporadas_archivadas():
    try:
        connection = get_connection()
        if not connection:
            return jsonify({'error': 'Error al conectar con la base de datos'}), 500

        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.id_temporada, t.nombre, 
                   DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                   DATE_FORMAT(t.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                   t.estado,
                   COUNT(DISTINCT tr.id_torneo) AS torneos,
                   COUNT(DISTINCT eg.id_equipo) AS equipos_inscritos
            FROM temporada t
            LEFT JOIN torneo tr ON t.id_temporada = tr.id_temporada
            LEFT JOIN grupo g ON tr.id_torneo = g.id_torneo
            LEFT JOIN equipo_grupo eg ON g.id_grupo = eg.id_grupo
            WHERE t.estado = 'Archivada'
            GROUP BY t.id_temporada, t.nombre, t.fecha_inicio, t.fecha_fin, t.estado
            ORDER BY t.fecha_inicio DESC;
        """)
        temporadas = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify({'temporadas': temporadas}), 200
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
        return jsonify({'error': f'Error al listar archivadas: {str(e)}'}), 500