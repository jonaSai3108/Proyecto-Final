from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
from flask import session

# Importar blueprint después de definir get_connection si es necesario
from api.torneos import torneos_bp

from api.equipos import equipos_bp

from api.facultades import facultades_bp  # Importamos nuestro blueprint



app = Flask(__name__)
app.secret_key = 'una_clave_secreta'
# Configuracion de login
# Configuración para manejo de sesiones
app.config['SESSION_TYPE'] = 'filesystem'


# Configurar Blueprint de APIS
app.register_blueprint(torneos_bp, url_prefix='/api/torneos')

app.register_blueprint(equipos_bp, url_prefix='/api/equipos')
app.register_blueprint(facultades_bp, url_prefix='/api/facultades')




@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                # Verificar si el usuario existe
                cursor.execute("SELECT password FROM Usuarios WHERE username = %s", (username,))
                usuario = cursor.fetchone()

                if usuario and check_password_hash(usuario['password'], password):
                    session['usuario'] = username  # Guardar en sesión
                    flash(f"¡Bienvenido, {username}!")
                    return redirect(url_for('index'))
                else:
                    flash("Usuario o contraseña incorrectos.")
                    return redirect(url_for('login'))

        except Exception as e:
            flash(f"Ocurrió un error: {str(e)}")
            return redirect(url_for('login'))
        finally:
            conn.close()

    return render_template('login.html')







# Configurar correo
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'rodemirovail@gmail.com'  
app.config['MAIL_PASSWORD'] = '123456' 
mail = Mail(app)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        correo = request.form['correo']
        password = request.form['password']
        password_hash = generate_password_hash(password)

        try:
            conn = get_connection()  # creas nueva conexión
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
            conn.close()
            
        

    return render_template('registro.html')



#portada
@app.route('/portada', methods=['GET', 'POST'])
def portada():
    return render_template('pantalla_principal.html')


@app.route('/torneo', methods=['GET', 'POST'])
def torneo():
    return render_template('torneos.html')

@app.route('/Jugadores', methods=['GET', 'POST'])
def jugadores():
    return render_template('Jugadores.html')

@app.route('/Equipos', methods=['GET', 'POST'])
def equipos():
    return render_template('Equipo.html')

@app.route('/Cancha', methods=['GET', 'POST'])
def cancha():
    return render_template('Cancha.html')

@app.route('/Partidos', methods=['GET', 'POST'])
def Partidos():
    return render_template('Partidos.html')

@app.route('/Resultados', methods=['GET', 'POST'])
def Resultados():
    return render_template('Resultado.html')

@app.route('/Arbitros', methods=['GET', 'POST'])
def Arbitros():
    return render_template('Arbitros.html')

@app.route('/TablaPosiciones', methods=['GET', 'POST'])
def TablaPosiciones():
    return render_template('TablaPosisiones.html')


@app.route('/EquiposCRUD', methods=['GET', 'POST'])
def EquiposCRUD():
    return render_template('equiposCRUD.html')

@app.route('/Editar_equipo')
def editar_equipo():
    return render_template('Editar_equipo.html')

if __name__ == '__main__':
    app.run(debug=True)
                             