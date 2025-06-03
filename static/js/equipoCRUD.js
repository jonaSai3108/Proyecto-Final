const API_BASE_URL = "/api/equipos";
const API_INSERT_URL = "/api/equipos/insertar";

// Ejecutar funciones al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarFacultades();
  cargarEquipos();
});

// Cargar facultades en el select
async function cargarFacultades() {
  try {
    const res = await fetch('/api/facultades');
    const facultades = await res.json();
    const select = document.getElementById('id_facultad');
    facultades.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id_facultad;
      option.textContent = f.carrera;
      select.appendChild(option);
    });
  } catch (err) {
    alert('No se pudieron cargar las facultades');
  }
}

// Manejar el formulario de inserción
document.getElementById('formEquipo').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = getFormData();

  // Validación simple
  if (!data.nombre || !data.representante || !data.contacto || !data.estado || !data.fecha_registro || !data.id_facultad) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const res = await fetch(API_INSERT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.mensaje);
      document.getElementById('formEquipo').reset();
      cargarEquipos(); // Recargar la tabla
    } else {
      alert('Error: ' + result.error);
    }
  } catch (err) {
    alert('Error al conectar con el servidor');
  }
});

// Extraer datos del formulario
function getFormData() {
  return {
    nombre: document.getElementById('nombre').value,
    representante: document.getElementById('representante').value,
    contacto: document.getElementById('contacto').value,
    estado: document.getElementById('estado').value,
    fecha_registro: document.getElementById('fecha_registro').value,
    id_facultad: parseInt(document.getElementById('id_facultad').value)
  };
}

// Cargar tabla de equipos
async function cargarEquipos() {
  try {
    const res = await fetch(API_BASE_URL);
    const equipos = await res.json();
    const tbody = document.querySelector('#tablaEquipos tbody');
    tbody.innerHTML = '';

    equipos.forEach(e => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${e.id_equipo}</td>
        <td>${e.nombre}</td>
        <td>${e.representante}</td>
        <td>${e.contacto}</td>
        <td>${e.estado}</td>
        <td>${e.fecha_registro}</td>
        <td>${e.fecha_creacion ?? ''}</td>
        <td>${e.fecha_modificacion ?? ''}</td>
        <td>${e.id_facultad}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-primary" onclick='editar(${JSON.stringify(e)})'>Editar</button>
            <button class="btn btn-sm btn-danger" onclick='eliminar(${e.id_equipo})'>Eliminar</button>
          </div>
        </td>
      `;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar equipos:", error);
    alert("No se pudieron cargar los equipos.");
  }
}

// Editar equipo
function editar(equipo) {
  localStorage.setItem('equipoEditar', JSON.stringify(equipo));
  window.location.href = '/Editar_equipo';

}

// Eliminar equipo(pasar el estado a inactivo)
async function eliminar(id) {
  if (confirm('¿Eliminar este equipo?')) {
    try {
      await fetch(`${API_BASE_URL}/eliminar/${id}`, {
        method: 'DELETE'
      });
      cargarEquipos();
    } catch (error) {
      alert("No se pudo eliminar el equipo");
    }
  }
}
