from flask import Flask, render_template, request, redirect, url_for, session
import pymysql
from auth.decorators import login_required, admin_required
from db import get_connection  # Importar la función get_connection desde db.py
# Importar los blueprints de las APIs

# Importar blueprint después de definir get_connection si es necesario
from api.torneos import torneos_bp

from api.equipos import equipos_bp

from api.facultades import facultades_bp  # Importamos nuestro blueprint

from api.temporada import temporada_bp

from auth import auth_bp  #blueprint de autenticación



app = Flask(__name__)
app.secret_key = 'clave_super_secreta'

app.register_blueprint(auth_bp) 


# Configurar Blueprint de APIS
app.register_blueprint(torneos_bp, url_prefix='/api/torneos')

app.register_blueprint(equipos_bp, url_prefix='/api/equipos')
app.register_blueprint(facultades_bp, url_prefix='/api/facultades')
app.register_blueprint(temporada_bp, url_prefix='/api/temporadas')




#RUTAS 
@app.route('/')
def index():
    return render_template('index.html')

# Ruta de inicio de sesión


@app.route('/dashboard')
@login_required
def dashboard():
    if session['rol'] == 'ADMINISTRADOR':
        return "Panel ADMIN - Bienvenido, " + session['username']
    else:
        return "Panel USUARIO - Bienvenido, " + session['username']

# Ruta de inicio de sesión de ADMINISTRADORES
@app.route('/admin-only')
@admin_required
def admin_panel():
    return "Contenido exclusivo para administradores"


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

@app.route('/Temporada', methods=['GET', 'POST'])
def temporadas():
    if request.method == 'POST':
        # Procesar formulario enviado
        return redirect(url_for('temporadas'))
    return render_template('temporada.html')


if __name__ == '__main__':
    app.run(debug=True)
                             