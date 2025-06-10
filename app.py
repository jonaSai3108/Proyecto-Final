from flask import Flask, render_template, redirect, session
from auth.decorators import login_required, admin_required
from db import get_connection  # Importar la función get_connection desde db.py
# Importar los blueprints de las APIs

# Importar blueprint después de definir get_connection si es necesario
from api.torneos import torneos_bp
from api.equipos import equipos_bp
from api.facultades import facultades_bp  
from api.temporada import temporada_bp
from api.cancha import cancha_bp
from api.partido import partido_bp
from api.resultado import resultado_bp
from api.jugadores import jugadores_bp
from auth import auth_bp






app = Flask(__name__)
app.secret_key = 'una_clave_secreta'
# Configuracion de login


app.register_blueprint(torneos_bp, url_prefix='/api/torneos')
app.register_blueprint(equipos_bp, url_prefix='/api/equipos')
app.register_blueprint(facultades_bp, url_prefix='/api/facultades')
app.register_blueprint(temporada_bp, url_prefix='/api/temporadas')
app.register_blueprint(cancha_bp, url_prefix='/api/cancha')
app.register_blueprint(partido_bp, url_prefix='/api/partido')
app.register_blueprint(resultado_bp, url_prefix='/api/resultados')
app.register_blueprint(jugadores_bp, url_prefix='/api/jugadores')

# Configuración para manejo de sesiones
app.register_blueprint(auth_bp)


# Rutas principales
@app.route('/')
def index():   
    return render_template('index.html')


@app.route('/dashboard')
@login_required
def dashboard():
    if session['rol'] == 'ADMINISTRADOR':
        return "Panel ADMIN - Bienvenido, " + session['username']
    else:
        return "Panel USUARIO - Bienvenido, " + session['username']

@app.route('/admin-only')
@admin_required
def admin_panel():
    return "Contenido exclusivo para administradores"


#portada
@app.route('/portada', methods=['GET', 'POST'])

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

@app.route('/UEquipos')
def UEquipos():
    return render_template('UEquipos.html')

@app.route('/UJugadores')
def Ujugadores():
    return render_template('UJugadores.html')

@app.route('/UPantalla_Principal')
def UPantalla_Principal():
    return render_template('UPantalla_Principal.html')

@app.route('/UPartidos')
def  Upartidos():
    return render_template('UPartidos.html')

@app.route('/UResultados')
def  UResultados():
    return render_template('UResultados.html')

@app.route('/UTablaPosiciones')
def  UTablaPosiciones():
    return render_template('UTablaPosiciones.html')

@app.route('/UTorneo')
def  UTorneo():
    return render_template('UTorneo.html')


if __name__ == '__main__':
    app.run(debug=True)