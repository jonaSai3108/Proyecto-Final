from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash
import pymysql
from werkzeug.security import check_password_hash
from flask import session


app = Flask(__name__)
app.secret_key = 'una_clave_secreta'


# Configuracion de login
# Configuración para manejo de sesiones
app.config['SESSION_TYPE'] = 'filesystem'

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

# Función para crear la conexión a la base de datos
def get_connection():
    return pymysql.connect(
        host='127.0.0.1',  
        port=3306,        
        user='root',
        password='Evichs21!',
        db='DBTorneosFutbol',
        cursorclass=pymysql.cursors.DictCursor
    )

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

if __name__ == '__main__':
    app.run(debug=True)
try:
    mail.send(msg)
except Exception as e:
    print(f"Error al enviar el correo: {e}")
    flash("No se pudo enviar el correo, pero el usuario fue registrado.")
