document.addEventListener('DOMContentLoaded', function() {
    const selectPartido = document.getElementById('selectPartido');
    const formResultado = document.getElementById('formResultado');
    const partidoInfo = document.getElementById('partidoInfo');
    const tablaResultados = document.getElementById('tablaResultados');

    // Cargar partidos disponibles
    fetch('/api/resultado/partidos')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar partidos');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                selectPartido.innerHTML = '<option value="" selected disabled>Seleccione un partido</option>';
                data.data.forEach(partido => {
                    const option = document.createElement('option');
                    option.value = partido.id_partido;
                    option.textContent = `${partido.equipo_local} vs ${partido.equipo_visitante} - ${new Date(partido.fecha).toLocaleDateString()}`;
                    selectPartido.appendChild(option);
                });
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error al cargar partidos', 'danger');
        });

    // Evento al seleccionar partido
    selectPartido.addEventListener('change', function() {
        const idPartido = this.value;
        if (!idPartido) return;

        fetch(`/api/resultado/${idPartido}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar partido');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Actualizar campos del formulario
                    document.getElementById('golesLocal').value = data.data.goles_local || '';
                    document.getElementById('golesVisitante').value = data.data.goles_visitante || '';

                    // Mostrar información del partido
                    partidoInfo.innerHTML = `
                        <h4>${data.data.equipo_local} vs ${data.data.equipo_visitante}</h4>
                        <p class="text-muted">${new Date(data.data.fecha).toLocaleString()}</p>
                        <div class="display-4">
                            ${data.data.goles_local || '0'} - ${data.data.goles_visitante || '0'}
                        </div>
                    `;
                } else {
                    partidoInfo.innerHTML = '<p class="text-danger">No se encontraron datos</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                partidoInfo.innerHTML = '<p class="text-danger">Error al cargar datos</p>';
            });
    });

    // Enviar formulario
    formResultado.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const idPartido = selectPartido.value;
        const golesLocal = document.getElementById('golesLocal').value;
        const golesVisitante = document.getElementById('golesVisitante').value;

        fetch('/api/resultado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_partido: idPartido,
                goles_local: golesLocal,
                goles_visitante: golesVisitante
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Error al guardar');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert('Resultado guardado exitosamente', 'success');
                loadResults();
                // Actualizar información del partido seleccionado
                if (selectPartido.value) {
                    const event = new Event('change');
                    selectPartido.dispatchEvent(event);
                }
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message, 'danger');
        });
    });

    // Cargar resultados iniciales
    loadResults();

    // Función para cargar resultados
    function loadResults() {
        fetch('/api/resultado')
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar resultados');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    tablaResultados.innerHTML = '';
                    data.data.forEach(resultado => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${resultado.equipo_local} vs ${resultado.equipo_visitante}</td>
                            <td>${new Date(resultado.fecha).toLocaleDateString()}</td>
                            <td><strong>${resultado.goles_local || '0'} - ${resultado.goles_visitante || '0'}</strong></td>
                            <td><span class="badge bg-${resultado.estado === 'Finalizado' ? 'success' : 'warning'}">${resultado.estado}</span></td>
                        `;
                        tablaResultados.appendChild(row);
                    });
                } else {
                    throw new Error(data.error || 'Error desconocido');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                tablaResultados.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar resultados</td></tr>';
            });
    }

    // Función para mostrar alertas
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container');
        container.prepend(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
});