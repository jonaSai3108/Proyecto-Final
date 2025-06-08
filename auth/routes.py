from flask import render_template, request, redirect, session, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from auth import auth_bp
from db import get_connection

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    registro_ok = request.args.get('registro')
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM login WHERE username = %s AND estado = 'ACTIVO'", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password_hash'], password):
            cursor.execute("""
                SELECT r.nombre_rol FROM login_rol lr
                JOIN rol r ON lr.id_rol = r.id_rol
                WHERE lr.id_login = %s
            """, (user['id_login'],))
            rol = cursor.fetchone()

            session['id_login'] = user['id_login']
            session['username'] = user['username']
            session['rol'] = rol['nombre_rol']

            return redirect(url_for('portada'))  # Redirige a portada si login exitoso

        else:
            # Si credenciales son incorrectas, mostrar alerta
            return render_template('login.html', message="Credenciales inválidas", category="danger", registro_ok=registro_ok)

    return render_template('login.html', message=None, category=None, registro_ok=registro_ok)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        correo = request.form['correo']
        password = request.form['password']

        hashed = generate_password_hash(password)
        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("INSERT INTO login (username, correo, password_hash) VALUES (%s, %s, %s)",
                           (username, correo, hashed))
            id_login = cursor.lastrowid

            cursor.execute("INSERT INTO login_rol (id_login, id_rol) VALUES (%s, %s)", (id_login, 2))  # ID 2 = usuario
            conn.commit()
            return redirect(url_for('auth.login', registro='ok'))
        except Exception as e:
            conn.rollback()
            print("Error en registro:", e)
        finally:
            cursor.close()
            conn.close()
    return render_template('registro.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))


                                 



