# Rutas de login, registro, logout
from flask import render_template, request, redirect, session, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from auth import auth_bp
from db import get_connection

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM login WHERE username = %s AND estado = 'ACTIVO'", (username,))
        user = cursor.fetchone()

        #Hashear la contraseña ingresada
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
            flash('Bienvenido, ' + user['username'])
            return redirect(url_for('auth.portada')) 

        flash('Usuario o contraseña incorrectos', 'danger')
        return render_template('Login.html')  
    # <-- Agrega este return para el método GET
    return render_template('Login.html')  


#Ruta de registro
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
            flash("Registro exitoso")
            return redirect(url_for('auth.login'))
        except Exception as e:
            conn.rollback()
            print("Error en registro:", e) 
            flash("Error: " + str(e))
        finally:
            cursor.close()
            conn.close()    
    return render_template('registro.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))  



                                 



