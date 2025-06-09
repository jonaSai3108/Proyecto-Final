document.addEventListener("DOMContentLoaded", function () {
  obtenerPartidos();
  cargarSelects();
  document.getElementById("formPartido").addEventListener("submit", guardarPartido);
});

/**
 * Obtiene la lista de partidos desde la API y los renderiza
 */
async function obtenerPartidos() {
  try {
    const response = await fetch("/api/partidos/");
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.success) {
      throw new Error(data.error || "No se pudieron obtener los partidos");
    }
    
    renderizarTabla(data.data);
    renderizarTarjetas(data.data);
    
  } catch (error) {
    console.error("Error al obtener partidos:", error);
    mostrarAlerta("Error al cargar partidos: " + error.message, "danger");
    
    // Mostrar mensaje en la tabla cuando hay error
    document.getElementById("tablaPartidos").innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error al cargar los partidos</td>
      </tr>
    `;
  }
}

/**
 * Carga los selects de jornadas y canchas
 */
async function cargarSelects() {
  try {
    // Cargar jornadas
    const jornadasResponse = await fetch("/api/jornadas");
    const jornadasData = await jornadasResponse.json();
    
    if (jornadasResponse.ok && jornadasData.success) {
      const selectJornada = document.getElementById("id_jornada");
      selectJornada.innerHTML = jornadasData.data.map(j => 
        `<option value="${j.id_jornada}">${j.nombre}</option>`
      ).join("");
    } else {
      throw new Error(jornadasData.error || "Error al cargar jornadas");
    }
    
    // Cargar canchas
    const canchasResponse = await fetch("/api/canchas");
    const canchasData = await canchasResponse.json();
    
    if (canchasResponse.ok && canchasData.success) {
      const selectCancha = document.getElementById("id_cancha");
      selectCancha.innerHTML = canchasData.data.map(c => 
        `<option value="${c.id_cancha}">${c.nombre}</option>`
      ).join("");
    } else {
      throw new Error(canchasData.error || "Error al cargar canchas");
    }
    
  } catch (error) {
    console.error("Error cargando selects:", error);
    mostrarAlerta("Error al cargar opciones: " + error.message, "warning");
  }
}

/**
 * Renderiza la tabla de partidos
 */
function renderizarTabla(partidos) {
  const cuerpo = document.getElementById("tablaPartidos");
  
  if (!partidos || partidos.length === 0) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No hay partidos registrados</td>
      </tr>
    `;
    return;
  }
  
  cuerpo.innerHTML = partidos.map(p => `
    <tr>
      <td>${p.id_partido}</td>
      <td>${formatearFecha(p.fecha_partido)}</td>
      <td>${p.hora_partido || '--:--'}</td>
      <td>${p.cancha || 'N/A'}</td>
      <td>${p.jornada || 'N/A'}</td>
      <td><span class="badge ${obtenerClaseEstado(p.estado)}">${p.estado}</span></td>
      <td>
        <button class="btn btn-sm btn-warning me-2" onclick="editarPartido(${p.id_partido})">
          <i class="bi bi-pencil"></i> Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="confirmarEliminacion(${p.id_partido})">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </td>
    </tr>
  `).join("");
}

/**
 * Renderiza las tarjetas de partidos
 */
function renderizarTarjetas(partidos) {
  const contenedor = document.getElementById("tarjetasPartidos");
  
  if (!partidos || partidos.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">No hay partidos próximos</div>
      </div>
    `;
    return;
  }
  
  contenedor.innerHTML = partidos.map(p => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-primary text-white">
          <h5 class="card-title mb-0">Jornada ${p.jornada || 'N/A'}</h5>
        </div>
        <div class="card-body">
          <p class="card-text"><strong>Fecha:</strong> ${formatearFecha(p.fecha_partido)}</p>
          <p class="card-text"><strong>Hora:</strong> ${p.hora_partido || '--:--'}</p>
          <p class="card-text"><strong>Cancha:</strong> ${p.cancha || 'N/A'}</p>
          <p class="card-text">
            <strong>Estado:</strong> 
            <span class="badge ${obtenerClaseEstado(p.estado)}">${p.estado}</span>
          </p>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarPartido(${p.id_partido})">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminacion(${p.id_partido})">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

/**
 * Guarda un partido (crear o editar)
 */
async function guardarPartido(e) {
  e.preventDefault();
  
  const partido = {
    id_partido: document.getElementById("id_partido").value || null,
    id_jornada: document.getElementById("id_jornada").value,
    id_cancha: document.getElementById("id_cancha").value,
    fecha_partido: document.getElementById("fecha_partido").value,
    hora_partido: document.getElementById("hora_partido").value,
    estado: document.getElementById("estado").value,
  };

  // Validación básica
  if (!partido.id_jornada || !partido.id_cancha || !partido.fecha_partido) {
    mostrarAlerta("Por favor complete todos los campos requeridos", "warning");
    return;
  }

  try {
    const metodo = partido.id_partido ? "PUT" : "POST";
    const url = partido.id_partido ? `/api/partidos/${partido.id_partido}` : "/api/partidos/";

    const response = await fetch(url, {
      method: metodo,
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partido)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Error al guardar el partido");
    }

    mostrarAlerta(data.mensaje || "Partido guardado exitosamente", "success");
    limpiarFormulario();
    await obtenerPartidos();
    
  } catch (error) {
    console.error("Error al guardar partido:", error);
    mostrarAlerta("Error: " + error.message, "danger");
  }
}

/**
 * Edita un partido existente
 */
async function editarPartido(id) {
  try {
    const response = await fetch(`/api/partidos/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.success) {
      throw new Error(data.error || "No se pudo obtener el partido");
    }
    
    const partido = data.data;
    document.getElementById("id_partido").value = partido.id_partido;
    document.getElementById("id_jornada").value = partido.id_jornada;
    document.getElementById("id_cancha").value = partido.id_cancha;
    document.getElementById("fecha_partido").value = partido.fecha_partido;
    document.getElementById("hora_partido").value = partido.hora_partido || '';
    document.getElementById("estado").value = partido.estado;
    
    // Scroll al formulario
    document.getElementById("formPartido").scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    console.error("Error al editar partido:", error);
    mostrarAlerta("Error al cargar partido: " + error.message, "danger");
  }
}

/**
 * Confirma antes de eliminar un partido
 */
function confirmarEliminacion(id) {
  Swal.fire({
    title: '¿Está seguro?',
    text: "¡No podrá revertir esta acción!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      eliminarPartido(id);
    }
  });
}

/**
 * Elimina un partido
 */
async function eliminarPartido(id) {
  try {
    const response = await fetch(`/api/partidos/${id}`, { 
      method: "DELETE" 
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Error al eliminar el partido");
    }
    
    mostrarAlerta(data.mensaje || "Partido eliminado correctamente", "success");
    await obtenerPartidos();
    
  } catch (error) {
    console.error("Error al eliminar partido:", error);
    mostrarAlerta("Error: " + error.message, "danger");
  }
}

/**
 * Limpia el formulario
 */
function limpiarFormulario() {
  document.getElementById("formPartido").reset();
  document.getElementById("id_partido").value = "";
}

/**
 * Formatea una fecha para mostrarla
 */
function formatearFecha(fechaString) {
  if (!fechaString) return 'N/A';
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(fechaString).toLocaleDateString('es-ES', opciones);
}

/**
 * Obtiene la clase CSS para el estado
 */
function obtenerClaseEstado(estado) {
  const estados = {
    'Programado': 'bg-primary',
    'En juego': 'bg-warning text-dark',
    'Finalizado': 'bg-success',
    'Cancelado': 'bg-danger',
    'Suspendido': 'bg-secondary'
  };
  return estados[estado] || 'bg-info text-dark';
}

/**
 * Muestra una alerta al usuario
 */
function mostrarAlerta(mensaje, tipo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show fixed-top mx-auto mt-3`;
  alerta.style.maxWidth = '600px';
  alerta.style.zIndex = '1100';
  alerta.role = 'alert';
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alerta);
  
  // Eliminar la alerta después de 5 segundos
  setTimeout(() => {
    alerta.classList.remove('show');
    setTimeout(() => alerta.remove(), 150);
  }, 5000);
}

// Hacer funciones accesibles globalmente
window.editarPartido = editarPartido;
window.confirmarEliminacion = confirmarEliminacion;
window.eliminarPartido = eliminarPartido;