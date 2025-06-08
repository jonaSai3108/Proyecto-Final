// Variables globales
let temporadas = [];
let temporadaAEliminar = null;
let temporadasArchivadas = [];

// Modal de archivadas: cargar datos al abrir
document.getElementById('modalArchivadas').addEventListener('show.bs.modal', async function () {
    const response = await fetch('/api/temporadas/archivadas');
    const data = await response.json();
    temporadasArchivadas = data.temporadas || [];
    const tbody = document.getElementById('tablaArchivadas');
    tbody.innerHTML = '';
    temporadasArchivadas.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.id_temporada}</td>
            <td>${t.nombre}</td>
            <td>${t.fecha_inicio}</td>
            <td>${t.fecha_fin}</td>
            <td>${t.torneos}</td>
            <td>${t.equipos_inscritos}</td>
            <td>
                <button class="btn btn-sm btn-success" title="Descargar PDF"
                    onclick="descargarTemporadaArchivadaPDF(${t.id_temporada})">
                    <i class="bi bi-file-earmark-pdf"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
});

// Renderizar tabla de temporadas
function renderizarTemporadas() {
    const tbody = document.getElementById('tablaTemporadas');
    tbody.innerHTML = '';

    if (temporadas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
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
            <td>${temporada.torneos}</td>
            <td>${temporada.equipos_inscritos}</td>
            <td>${temporada.fecha_inicio}</td>
            <td>${temporada.fecha_fin}</td>
            <td><span class="badge ${badgeClass}">${temporada.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" 
                        onclick="cargarParaEditar(${temporada.id_temporada})"
                        title="Editar Torneo">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" 
                        onclick="confirmarArchivar(${temporada.id_temporada}, '${temporada.nombre}')"
                        title="Archivar Torneo">
                    <i class="bi bi-archive"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function () {
    cargarTemporadas();

    // Filtros 
    const filtroEstado = document.getElementById('filtroEstado');
    if (filtroEstado) filtroEstado.addEventListener('change', cargarTemporadas);

    const filtroDesde = document.getElementById('filtroDesde');
    if (filtroDesde) filtroDesde.addEventListener('change', cargarTemporadas);

    const filtroHasta = document.getElementById('filtroHasta');
    if (filtroHasta) filtroHasta.addEventListener('change', cargarTemporadas);

     // Búsqueda reactiva
    const inputBusqueda = document.getElementById('busquedaTemporada');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', buscarTemporada);
    }
});

// Cargar temporadas desde la API
async function cargarTemporadas() {
    try {
        const estado = document.getElementById('filtroEstado') ? document.getElementById('filtroEstado').value : '';
        const desde = document.getElementById('filtroDesde') ? document.getElementById('filtroDesde').value : '';
        const hasta = document.getElementById('filtroHasta') ? document.getElementById('filtroHasta').value : '';

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

// Actualizar resumen
function actualizarResumen() {
    document.getElementById('totalTemporadas').textContent = temporadas.length;
    document.getElementById('totalActivas').textContent = temporadas.filter(t => t.estado === 'Activa').length;
    document.getElementById('totalPendientes').textContent = temporadas.filter(t => t.estado === 'Pendiente').length;
    document.getElementById('totalFinalizadas').textContent = temporadas.filter(t => t.estado === 'Finalizada').length;
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

            mostrarExito('Temporada actualizada exitosamente');
        } else {
            mostrarError(result.error || 'Error al actualizar temporada');
        }
    } catch (error) {
        mostrarError('Error de conexión: ' + error.message);
    }
}

// Archivar temporada (no eliminar)
function confirmarArchivar(id, nombre) {
    temporadaAEliminar = id;
    document.getElementById('nombreTemporadaEliminar').textContent = nombre;
    const modal = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
    document.querySelector('#confirmarEliminarModal .modal-title').textContent = 'Confirmar Archivado';
    document.querySelector('#confirmarEliminarModal .btn-danger').textContent = 'Archivar';
    modal.show();
}

async function archivarTemporadaConfirmada() {
    if (!temporadaAEliminar) return;
    try {
        const response = await fetch(`/api/temporadas/archivar/${temporadaAEliminar}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminarModal'));
            modal.hide();
            mostrarExito(result.mensaje || 'Temporada archivada exitosamente');
            await cargarTemporadas();
        } else {
            mostrarError(result.error || 'Error al archivar temporada');
        }
    } catch (error) {
        mostrarError('Error de conexión: ' + error.message);
    } finally {
        temporadaAEliminar = null;
    }
}

// Mostrar mensajes
function mostrarError(mensaje) {
    alert(mensaje);
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

// Utilidad para convertir imagen a base64
function getImageBase64FromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Descargar todas las temporadas archivadas como PDF
async function descargarArchivadasPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logoUrl = '/static/imagenes/Logo_UMES.png';

    try {
        const logoBase64 = await getImageBase64FromUrl(logoUrl);
        doc.addImage(logoBase64, 'PNG', 10, 8, 50, 25);
    } catch (e) {
        console.warn('No se pudo cargar el logo:', e);
    }

    doc.setFontSize(18);
    doc.setTextColor(7, 91, 94);
    doc.text('Temporadas Archivadas', 70, 20);

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Descargado el: ${fechaStr} a las ${horaStr}`, 10, 40);

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Este PDF contiene el listado de todas las temporadas archivadas.', 10, 50);

    const rows = temporadasArchivadas.map(t => [
        t.nombre, t.fecha_inicio, t.fecha_fin, t.torneos, t.equipos_inscritos
    ]);

    doc.autoTable({
        head: [['Nombre', 'Fecha Inicio', 'Fecha Fin', 'Torneos', 'Equipos Inscritos']],
        body: rows,
        startY: 60,
        styles: {
            fillColor: [250, 246, 233],
            textColor: [40, 40, 40],
            fontStyle: 'normal',
            fontSize: 12
        },
        headStyles: {
            fillColor: [7, 91, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [220, 220, 255]
        }
    });

    doc.save('temporadas_archivadas.pdf');
}

// Descargar temporada archivada específica como PDF
async function descargarTemporadaArchivadaPDF(id_temporada) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logoUrl = '/static/imagenes/Logo_UMES.png';

    try {
        const logoBase64 = await getImageBase64FromUrl(logoUrl);
        doc.addImage(logoBase64, 'PNG', 10, 8, 50, 25);
    } catch (e) {
        console.warn('No se pudo cargar el logo:', e);
    }

    doc.setFontSize(18);
    doc.setTextColor(7, 91, 94);
    doc.text('Temporada Archivada', 70, 20);

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Descargado el: ${fechaStr} a las ${horaStr}`, 10, 40);

    const t = temporadasArchivadas.find(temp => temp.id_temporada === id_temporada);
    if (!t) {
        mostrarError('Temporada no encontrada');
        return;
    }

    doc.autoTable({
        head: [['Nombre', 'Fecha Inicio', 'Fecha Fin', 'Torneos', 'Equipos Inscritos']],
        body: [[
            t.nombre, t.fecha_inicio, t.fecha_fin, t.torneos, t.equipos_inscritos
        ]],
        startY: 60,
        styles: {
            fillColor: [250, 246, 233],
            textColor: [40, 40, 40],
            fontStyle: 'normal',
            fontSize: 12
        },
        headStyles: {
            fillColor: [7, 91, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [250, 246, 233]
        }
    });

    doc.save(`temporada_archivada_${t.id_temporada}.pdf`);
}

// Barra de búsqueda por nombre o ID
function buscarTemporada() {
    const input = document.getElementById('busquedaTemporada');
    if (!input) return;
    const valor = input.value.trim().toLowerCase();
    const filas = document.querySelectorAll('#tablaTemporadas tr');

    if (valor === '') {
        // Si el campo está vacío, recarga los datos originales
        cargarTemporadas();
        return;
    }

    filas.forEach(fila => {
        const id = fila.children[0].textContent.trim().toLowerCase();
        const nombre = fila.children[1].textContent.trim().toLowerCase();
        if (id.includes(valor) || nombre.includes(valor)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}