let allPlayers = [];
const apiBaseUrl = '/api/jugadores';

document.addEventListener('DOMContentLoaded', () => {
    const playersContainer = document.getElementById('playersContainer');
    const playerModalEl = document.getElementById('playerModal');
    const playerModal = new bootstrap.Modal(playerModalEl);
    const editForm = document.getElementById('editPlayerForm');

    document.getElementById('searchButton').addEventListener('click', filterPlayers);
    document.getElementById('searchInput').addEventListener('keyup', e => {
        if (e.key === 'Enter') filterPlayers();
    });
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = '/torneos';
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editPlayerId').value;
        const nombre = document.getElementById('editNombre').value;
        const apellido = document.getElementById('editApellido').value;
        const edad = parseInt(document.getElementById('editEdad').value);
        const dorsal = parseInt(document.getElementById('editDorsal').value);
        const id_equipo = parseInt(document.getElementById('editIdEquipo').value);

        try {
            const response = await fetch(`${apiBaseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, edad, dorsal, id_equipo })
            });
            const result = await response.json();
            alert(result.message || 'Jugador actualizado');
            playerModal.hide();
            loadPlayers();
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
        }
    });

    async function loadPlayers() {
        playersContainer.innerHTML = '';
        try {
            const res = await fetch(apiBaseUrl + '/');
            allPlayers = await res.json();
            renderPlayers(allPlayers);
            document.getElementById('estadoCargando').classList.add('d-none');
            playersContainer.classList.remove('d-none');
        } catch (err) {
            playersContainer.innerHTML = '<div class="empty-state text-center">Error al cargar jugadores</div>';
        }
    }

    function filterPlayers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filtered = allPlayers.filter(p =>
            (`${p.nombre} ${p.apellido}`).toLowerCase().includes(searchTerm) ||
            (p.equipo && p.equipo.toLowerCase().includes(searchTerm))
        );
        renderPlayers(filtered);
    }

    function renderPlayers(players) {
        playersContainer.innerHTML = '';
        players.forEach(player => {
            const fullName = `${player.nombre || 'Sin'} ${player.apellido || 'nombre'}`;
            const equipo = player.equipo || 'Sin equipo';
            const goles = player.total_goles ?? 0;

            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card player-card">
                    <div class="card-body text-center">
                        <h5 class="player-name">${fullName}</h5>
                        <p>Edad: ${player.edad}</p>
                        <p>Dorsal: ${player.dorsal}</p>
                        <p>Equipo: ${equipo}</p>
                        <p>Goles: ${goles}</p>
                        <p>Tarjetas:<br> Amarillas: ${player.tarjetas_amarillas ?? 0}<br> Rojas: ${player.tarjetas_rojas ?? 0}</p>
                        <p>Suspendido: ${player.suspendido ?? 'No'}</p>
                        <button class="btn btn-outline-success btn-sm mt-1" onclick="editPlayer(${player.id_jugador})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm mt-1" onclick="deletePlayer(${player.id_jugador})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>`;
            playersContainer.appendChild(card);
        });
    }

    window.editPlayer = async function (id) {
        try {
            const response = await fetch(`${apiBaseUrl}/${id}`);
            const player = await response.json();

            document.getElementById('editPlayerId').value = player.id_jugador;
            document.getElementById('editNombre').value = player.nombre || '';
            document.getElementById('editApellido').value = player.apellido || '';
            document.getElementById('editEdad').value = player.edad || 0;
            document.getElementById('editDorsal').value = player.dorsal || 0;
            document.getElementById('editIdEquipo').value = player.id_equipo || 0;

            playerModal.show();
        } catch (err) {
            alert('Error al obtener jugador: ' + err.message);
        }
    };

    window.deletePlayer = async function (id) {
        if (!confirm('¿Estás seguro de eliminar este jugador?')) return;
        try {
            const res = await fetch(`${apiBaseUrl}/${id}`, { method: 'DELETE' });
            const result = await res.json();
            alert(result.message || 'Jugador eliminado');
            loadPlayers();
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    loadPlayers();
});
