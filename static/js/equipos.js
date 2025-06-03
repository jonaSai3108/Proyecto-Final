 let allTeams = [];
    const apiBaseUrl = '/api/equipos';

    const teamsContainer = document.getElementById('teamsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterStatus = document.getElementById('filterStatus');
    const backButton = document.getElementById('backButton');
    const teamModal = new bootstrap.Modal(document.getElementById('teamModal'));

    document.addEventListener('DOMContentLoaded', loadTeams);
    searchButton.addEventListener('click', filterTeams);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterTeams();
    });
    filterStatus.addEventListener('change', filterTeams);
    backButton.addEventListener('click', () => {
        window.location.href = '/torneos';
    });

    async function loadTeams() {
        try {
            teamsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h4>Cargando equipos...</h4>
                    <p>Por favor espera mientras se cargan los datos</p>
                </div>`;

            const response = await fetch(apiBaseUrl);
            if (!response.ok) throw new Error('Error al cargar los equipos');

            allTeams = await response.json();
            renderTeams(allTeams);
        } catch (error) {
            teamsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar los equipos</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="loadTeams()">Reintentar</button>
                </div>`;
        }
    }

    function filterTeams() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = filterStatus.value;
        const filteredTeams = allTeams.filter(team => {
            const matchesSearch = team.nombre.toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter ? team.estado === statusFilter : true;
            return matchesSearch && matchesStatus;
        });
        renderTeams(filteredTeams);
    }

    function renderTeams(teams) {
        if (teams.length === 0) {
            teamsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <h4>No se encontraron equipos</h4>
                </div>`;
            return;
        }

        teamsContainer.innerHTML = '';
        teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'col-md-4 mb-4';
            teamCard.innerHTML = `
                <div class="card team-card">
                    <div class="card-body text-center">
                        <img src="/static/imagenes/logos/${team.id_equipo}.png" alt="Logo del equipo" class="team-logo">
                        <h5 class="team-name">${team.nombre}</h5>
                        <p class="text-muted">Estado: ${team.estado}</p>
                        <button class="btn btn-details" onclick="showTeamDetails(${team.id_equipo})">
                            <i class="fas fa-info-circle"></i> Más información
                        </button>
                    </div>
                </div>`;
            teamsContainer.appendChild(teamCard);
        });
    }
    

    async function showTeamDetails(id_equipo) {
    try {
        const response = await fetch(`${apiBaseUrl}/vista/${id_equipo}`);
        if (!response.ok) throw new Error('No se pudo obtener la información del equipo');

        const team = await response.json();

        const modalBody = `
            <p><strong>Nombre del Equipo:</strong> ${team.nombre_equipo}</p>
            <p><strong>Estado:</strong> ${team.estado_equipo}</p>
            <p><strong>Facultad:</strong> ${team.nombre_facultad}</p>
            <p><strong>Carrera:</strong> ${team.carrera}</p>
            <p><strong>Semestre:</strong> ${team.semestre}</p>`;

        document.getElementById('teamModalTitle').textContent = `Detalles del Equipo: ${team.nombre_equipo}`;
        document.getElementById('teamModalBody').innerHTML = modalBody;
        teamModal.show();

    } catch (error) {
        document.getElementById('teamModalBody').innerHTML = `<p class="text-danger">${error.message}</p>`;
        teamModal.show();
    }
}