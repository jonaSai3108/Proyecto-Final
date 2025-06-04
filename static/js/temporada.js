
// Variables globales
let temporadas = [];
let temporadaAEliminar = null;

// Cargar datos al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarTemporadas();
            
            // Configurar filtros
            document.getElementById('filtroEstado').addEventListener('change', cargarTemporadas);
            document.getElementById('filtroDesde').addEventListener('change', cargarTemporadas);
            document.getElementById('filtroHasta').addEventListener('change', cargarTemporadas);
        });

        // Cargar temporadas desde la API
        async function cargarTemporadas() {
            try {
                const estado = document.getElementById('filtroEstado').value;
                const desde = document.getElementById('filtroDesde').value;
                const hasta = document.getElementById('filtroHasta').value;
                
                let url = '/api/temporadas/listar';
                const params = new URLSearchParams();
                
                if (estado) params.append('estado', estado);
                if (desde) params.append('desde', desde);
                if (hasta) params.append('hasta', hasta);
                
                if (params.toString()) url += `?${params.toString()}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (response.ok) {
                    temporadas = data.temporadas;
                    renderizarTemporadas();
                    actualizarResumen();
                } else {
                    mostrarError(data.error || 'Error al cargar temporadas');
                }
            } catch (error) {
                mostrarError('Error de conexión: ' + error.message);
            }
        }

        // Renderizar tabla de temporadas
        function renderizarTemporadas() {
            const tbody = document.getElementById('tablaTemporadas');
            tbody.innerHTML = '';
            
            if (temporadas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">
                            No se encontraron temporadas
                        </td>
                    </tr>
                `;
                return;
            }
            
            temporadas.forEach(temporada => {
                const badgeClass = {
                    'Activa': 'badge-activa',
                    'Pendiente': 'badge-pendiente',
                    'Finalizada': 'badge-finalizada'
                }[temporada.estado] || 'bg-secondary';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${temporada.id_temporada}</td>
                    <td>${temporada.nombre}</td>
                    <td>${temporada.fecha_inicio}</td>
                    <td>${temporada.fecha_fin}</td>
                    <td><span class="badge ${badgeClass}">${temporada.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="cargarParaEditar(${temporada.id_temporada})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar(${temporada.id_temporada}, '${temporada.nombre}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Actualizar resumen
        function actualizarResumen() {
            document.getElementById('totalTemporadas').textContent = temporadas.length;
            document.getElementById('totalActivas').textContent = temporadas.filter(t => t.estado === 'Activa').length;
            document.getElementById('totalPendientes').textContent = temporadas.filter(t => t.estado === 'Pendiente').length;
        }

        // Crear nueva temporada
        async function crearTemporada() {
            const form = document.getElementById('formCrearTemporada');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/temporadas/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Cerrar modal y recargar datos
                    const modal = bootstrap.Modal.getInstance(document.getElementById('crearTemporadaModal'));
                    modal.hide();
                    form.reset();
                    cargarTemporadas();
                    
                    // Mostrar mensaje de éxito
                    mostrarExito('Temporada creada exitosamente');
                } else {
                    mostrarError(result.error || 'Error al crear temporada');
                }
            } catch (error) {
                mostrarError('Error de conexión: ' + error.message);
            }
        }

        // Cargar datos para editar
        async function cargarParaEditar(id) {
            try {
                const response = await fetch(`/api/temporadas/obtener/${id}`);
                const data = await response.json();
                
                if (response.ok) {
                    const form = document.getElementById('formEditarTemporada');
                    form.querySelector('[name="id_temporada"]').value = data.temporada.id_temporada;
                    form.querySelector('[name="nombre"]').value = data.temporada.nombre;
                    form.querySelector('[name="fecha_inicio"]').value = data.temporada.fecha_inicio;
                    form.querySelector('[name="fecha_fin"]').value = data.temporada.fecha_fin;
                    
                    // Mostrar modal
                    const modal = new bootstrap.Modal(document.getElementById('editarTemporadaModal'));
                    modal.show();
                } else {
                    mostrarError(data.error || 'Error al cargar temporada');
                }
            } catch (error) {
                mostrarError('Error de conexión: ' + error.message);
            }
        }

        // Actualizar temporada
        async function actualizarTemporada() {
            const form = document.getElementById('formEditarTemporada');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const id = data.id_temporada;
            
            try {
                const response = await fetch(`/api/temporadas/actualizar/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Cerrar modal y recargar datos
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editarTemporadaModal'));
                    modal.hide();
                    cargarTemporadas();
                    
                    // Mostrar mensaje de éxito
                    mostrarExito('Temporada actualizada exitosamente');
                } else {
                    mostrarError(result.error || 'Error al actualizar temporada');
                }
            } catch (error) {
                mostrarError('Error de conexión: ' + error.message);
            }
        }

        // Confirmar eliminación
        function confirmarEliminar(id, nombre) {
            temporadaAEliminar = id;
            document.getElementById('nombreTemporadaEliminar').textContent = nombre;
            const modal = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
            modal.show();
        }

        // Eliminar temporada confirmada
        async function eliminarTemporadaConfirmada() {
            if (!temporadaAEliminar) return;
            
            try {
                const response = await fetch(`/api/temporadas/eliminar/${temporadaAEliminar}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Cerrar modal y recargar datos
                    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminarModal'));
                    modal.hide();
                    cargarTemporadas();
                    
                    // Mostrar mensaje de éxito
                    mostrarExito('Temporada eliminada exitosamente');
                } else {
                    mostrarError(result.error || 'Error al eliminar temporada');
                }
            } catch (error) {
                mostrarError('Error de conexión: ' + error.message);
            } finally {
                temporadaAEliminar = null;
            }
        }

        // Mostrar mensaje de error
        function mostrarError(mensaje) {
            // Implementar toast o alerta de error
            console.error(mensaje);
            alert(`Error: ${mensaje}`);
        }

        // Mostrar mensaje de éxito
        function mostrarExito(mensaje) {
            // Implementar toast o alerta de éxito
            console.log(mensaje);
            alert(`Éxito: ${mensaje}`);
        }
