let allPlayers = [];
let allTeams   = [];
const apiBaseUrl = '/api/jugadores';

document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const playersContainer = document.getElementById('playersContainer');
    const playerModalEl = document.getElementById('playerModal');
    const playerModal = new bootstrap.Modal(playerModalEl);
    const editForm = document.getElementById('editPlayerForm');
    const agregarModalEl = document.getElementById('modalAgregarJugador');
    const agregarModal = new bootstrap.Modal(agregarModalEl);
    const agregarForm = document.getElementById('formAgregarJugador');
    const filterEquipo = document.getElementById('filterEquipo');
    const filterEstado = document.getElementById('filterEstado');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    // Eventos
    filterEquipo.addEventListener('change', filterPlayers);
    filterEstado.addEventListener('change', loadPlayers);
    searchButton.addEventListener('click', filterPlayers);

    // Buscar jugadores (no usado directamente pero útil si se desea buscar por nombre + filtros)
    async function buscarJugadores({ nombre = '', id_equipo = 0, estado = -1 }) {
        try {
            const params = new URLSearchParams();
            if (nombre) params.append('nombre', nombre);
            if (id_equipo) params.append('id_equipo', id_equipo);
            if (estado !== -1) params.append('estado', estado);

            const response = await fetch(`/api/jugadores/?${params.toString()}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error buscando jugadores:', error);
        }
    }

    async function cambiarEstadoJugador(id, nuevoEstado) {
        try {
            const response = await fetch(`/api/jugadores/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: nuevoEstado }),
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                loadPlayers();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    }

    window.toggleEstado = cambiarEstadoJugador;

    // Cargar equipos
    async function loadTeams() {
        try {
            const res = await fetch('/api/equipos/');
            allTeams = await res.json();
            ['nuevoIdEquipo', 'editIdEquipo', 'filterEquipo'].forEach(id => {
                const sel = document.getElementById(id);
                sel.innerHTML = `<option value="">${id === 'filterEquipo' ? 'Todos los equipos' : 'Seleccione un equipo'}</option>`;
                allTeams.forEach(eq => {
                    const o = document.createElement('option');
                    o.value = eq.id_equipo;
                    o.textContent = eq.nombre;
                    sel.appendChild(o);
                });
            });
        } catch (err) {
            console.error('Error al cargar equipos:', err);
        }
    }

    // Cargar jugadores
    async function loadPlayers() {
        try {
            const estado = filterEstado.value;
            const url = estado ? `${apiBaseUrl}/?estado=${estado}` : apiBaseUrl;
            const res = await fetch(url);
            allPlayers = await res.json();
            filterPlayers();
            document.getElementById('estadoCargando').classList.add('d-none');
            playersContainer.classList.remove('d-none');
        } catch (err) {
            playersContainer.innerHTML = '<div class="empty-state text-center">Error al cargar jugadores</div>';
        }
    }

    function filterPlayers() {
        const term = searchInput.value.trim().toLowerCase();
        const equipo = filterEquipo.value;
        const estado = filterEstado.value;

        let result = allPlayers;

        if (term) {
            result = result.filter(p => (`${p.nombre} ${p.apellido}`).toLowerCase().includes(term));
        }

        if (equipo) {
            result = result.filter(p => String(p.id_equipo) === equipo);
        }

        if (estado) {
            result = result.filter(p => {
                const isActive = p.activo === true || p.activo === 1;
                return estado === 'activo' ? isActive : !isActive;
            });
        }

        renderPlayers(result);
    }

    function renderPlayers(players) {
        playersContainer.innerHTML = '';
        if (!players.length) {
            playersContainer.innerHTML = '<div class="empty-state text-center">No se encontraron jugadores.</div>';
            return;
        }

        players.forEach(p => {
            const fullName = `${p.nombre} ${p.apellido}`;
            const isActive = Boolean(p.activo);
            playersContainer.insertAdjacentHTML('beforeend', `
                <div class="col-md-4 mb-4">
                    <div class="card player-card">
                        <div class="card-body text-center">
                            <h5 class="player-name">${fullName}</h5>
                            <p>Edad: ${p.edad || '-'}</p>
                            <p>Dorsal: ${p.dorsal || '-'}</p>
                            <p>Equipo: ${p.equipo || 'Sin equipo'}</p>
                            <p>Goles: ${p.total_goles ?? 0}</p>
                            <p>Tarjetas:<br> Amarillas: ${p.tarjetas_amarillas ?? 0}<br> Rojas: ${p.tarjetas_rojas ?? 0}</p>
                            <p>Suspendido: ${p.suspendido ? 'Sí' : 'No'}</p>
                            <button class="btn btn-outline-success btn-sm" onclick="editPlayer(${p.id_jugador})">
                                <i class="fas fa-edit"></i>
                    
                            <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-secondary'}" 
                                    onclick="toggleEstado(${p.id_jugador}, ${isActive ? 0 : 1})">
                                ${isActive ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>`);
        });
    }

    // Editar jugador
    editForm.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('editPlayerId').value;
        const nombre = document.getElementById('editNombre').value;
        const apellido = document.getElementById('editApellido').value;
        const edad = +document.getElementById('editEdad').value;
        const dorsal = +document.getElementById('editDorsal').value;
        const id_equipo = +document.getElementById('editIdEquipo').value;
        try {
            const res = await fetch(`${apiBaseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, edad, dorsal, id_equipo })
            });
            const j = await res.json();
            alert(j.message || 'Jugador actualizado');
            playerModal.hide();
            loadPlayers();
        } catch (err) {
            alert('Error al actualizar: ' + err);
        }
    });

    window.editPlayer = async id => {
        try {
            const res = await fetch(`${apiBaseUrl}/${id}`);
            const p = await res.json();
            document.getElementById('editPlayerId').value = p.id_jugador;
            document.getElementById('editNombre').value = p.nombre;
            document.getElementById('editApellido').value = p.apellido;
            document.getElementById('editEdad').value = p.edad;
            document.getElementById('editDorsal').value = p.dorsal;
            document.getElementById('editIdEquipo').value = p.id_equipo;
            playerModal.show();
        } catch (err) {
            alert('Error al obtener jugador: ' + err);
        }
    };

    window.deletePlayer = async id => {
        if (!confirm('¿Eliminar este jugador?')) return;
        try {
            const res = await fetch(`${apiBaseUrl}/${id}`, { method: 'DELETE' });
            const j = await res.json();
            alert(j.message || 'Jugador eliminado');
            loadPlayers();
        } catch (err) {
            alert('Error al eliminar: ' + err);
        }
    };

    // Agregar jugador
    agregarForm.addEventListener('submit', async e => {
        e.preventDefault();
        const nombre = document.getElementById('nuevoNombre').value;
        const apellido = document.getElementById('nuevoApellido').value;
        const edad = +document.getElementById('nuevaEdad').value;
        const dorsal = +document.getElementById('nuevoDorsal').value;
        const id_equipo = +document.getElementById('nuevoIdEquipo').value;
        try {
            const res = await fetch(apiBaseUrl + '/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, edad, dorsal, id_equipo })
            });
            const j = await res.json();
            alert(j.message || 'Jugador agregado');
            agregarModal.hide();
            agregarForm.reset();
            loadPlayers();
        } catch (err) {
            alert('Error al agregar: ' + err);
        }
    });

    // Iniciar carga inicial
    loadTeams();
    loadPlayers();
});
