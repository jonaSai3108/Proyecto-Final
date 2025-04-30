from flask import Flask, render_template
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash
import pymysql

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')



#Seccion de Registro
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        correo = request.form['correo']
        password = request.form['password']
        password_hash = generate_password_hash(password)

        try:
            with conn.cursor() as cursor:
                cursor.callproc('sp_InsertarLogin', (username, correo, password_hash))
                conn.commit()

                # Enviar correo HTML
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

    return render_template('registro.html')




if __name__ == '__main__':
    app.run(debug=True)