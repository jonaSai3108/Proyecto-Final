from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
from db import get_connection  # Importamos la función directamente

# Configuración de la aplicación
app = Flask(__name__)
app.secret_key = 'una_clave_secreta'
app.config['SESSION_TYPE'] = 'filesystem'

# Configuración de correo
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'rodemirovail@gmail.com'
app.config['MAIL_PASSWORD'] = '123456' 
mail = Mail(app)

# Importar y registrar blueprints
from api.torneos import torneos_bp
from api.equipos import equipos_bp
from api.facultades import facultades_bp
from api.temporada import temporada_bp
from api.cancha import cancha_bp
from api.partido import partido_bp
from api.jugadores import jugadores_bp

app.register_blueprint(torneos_bp, url_prefix='/api/torneos')
app.register_blueprint(equipos_bp, url_prefix='/api/equipos')
app.register_blueprint(facultades_bp, url_prefix='/api/facultades')
app.register_blueprint(temporada_bp, url_prefix='/api/temporadas')
app.register_blueprint(cancha_bp, url_prefix='/api/cancha')
app.register_blueprint(partido_bp, url_prefix='/api/partido')
app.register_blueprint(jugadores_bp, url_prefix='/api/jugadores')

# Rutas principales
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        try:
            conn = get_connection()  # Usamos la función directamente
            with conn.cursor() as cursor:
                cursor.execute("SELECT password FROM Usuarios WHERE username = %s", (username,))
                usuario = cursor.fetchone()

                if usuario and check_password_hash(usuario['password'], password):
                    session['usuario'] = username
                    flash(f"¡Bienvenido, {username}!")
                    return redirect(url_for('index'))
                else:
                    flash("Usuario o contraseña incorrectos.")
                    return redirect(url_for('login'))

        except Exception as e:
            flash(f"Ocurrió un error: {str(e)}")
            return redirect(url_for('login'))
        finally:
            if 'conn' in locals() and conn.is_connected():
                conn.close()

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        correo = request.form['correo']
        password = request.form['password']
        password_hash = generate_password_hash(password)

        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                cursor.callproc('sp_InsertarLogin', (username, correo, password_hash))
                conn.commit()

            # Enviar correo de bienvenida
            msg = Message(subject='🎉 ¡Bienvenido a la aplicación!',
                         recipients=[correo])
            msg.html = f"""
            <div style="font-family:sans-serif;">
                <h2>Hola, {username} 👋</h2>
                <p>Gracias por registrarte en nuestra aplicación.</p>
                <p><strong>Tu usuario:</strong> {username}</p>
                <p>¡Esperamos que disfrutes la experiencia!</p>
                <hr>
                <small>Este es un mensaje automático. No respondas a este correo.</small>
            </div>
            """
            mail.send(msg)

            flash('Registro exitoso. Revisa tu correo 📧')
            return redirect(url_for('register'))

        except pymysql.err.IntegrityError:
            flash('El nombre de usuario ya existe.')
            return redirect(url_for('register'))
        except Exception as e:
            flash(f'Ocurrió un error: {str(e)}')
            return redirect(url_for('register'))
        finally:
            if 'conn' in locals() and conn.is_connected():
                conn.close()

    return render_template('registro.html')

# Rutas de vistas
@app.route('/portada')
def portada():
    return render_template('pantalla_principal.html')

@app.route('/torneo')
def torneo():
    return render_template('torneos.html')

@app.route('/Jugadores')
def jugadores():
    return render_template('Jugadores.html')

@app.route('/Equipos')
def equipos():
    return render_template('Equipo.html')

@app.route('/Cancha')
def cancha():
    return render_template('Cancha.html')

@app.route('/Partidos')
def Partidos():
    return render_template('Partidos.html')

@app.route('/Resultados')
def Resultados():
    return render_template('Resultado.html')

@app.route('/Arbitros')
def Arbitros():
    return render_template('Arbitros.html')

@app.route('/TablaPosiciones')
def TablaPosiciones():
    return render_template('TablaPosisiones.html')

@app.route('/EquiposCRUD')
def EquiposCRUD():
    return render_template('equiposCRUD.html')

@app.route('/Editar_equipo')
def editar_equipo():
    return render_template('Editar_equipo.html')

@app.route('/Temporada')
def temporadas():
    return render_template('temporada.html')

if __name__ == '__main__':
    app.run(debug=True)