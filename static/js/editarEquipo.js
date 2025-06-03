const API_BASE_URL = "/api/equipos";

// Cargar facultades en el combo
async function cargarFacultades(selectedId) {
  try {
    const res = await fetch('/api/facultades');
    const facultades = await res.json();
    const select = document.getElementById('id_facultad');
    facultades.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id_facultad;
      option.textContent = f.carrera;
      if (f.id_facultad === selectedId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (err) {
    alert('Error al cargar facultades');
  }
}

// Cargar datos en formulario
document.addEventListener("DOMContentLoaded", () => {
  const equipo = JSON.parse(localStorage.getItem('equipoEditar'));
  if (!equipo) {
    alert('No hay datos del equipo para editar');
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('id_equipo').value = equipo.id_equipo;
  document.getElementById('nombre').value = equipo.nombre;
  document.getElementById('representante').value = equipo.representante;
  document.getElementById('contacto').value = equipo.contacto;
  document.getElementById('estado').value = equipo.estado;
  document.getElementById('fecha_registro').value = equipo.fecha_registro;

  cargarFacultades(equipo.id_facultad);
});

// Enviar cambios
document.getElementById('formEditar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('id_equipo').value;
  const data = {
    nombre: document.getElementById('nombre').value,
    representante: document.getElementById('representante').value,
    contacto: document.getElementById('contacto').value,
    estado: document.getElementById('estado').value,
    fecha_registro: document.getElementById('fecha_registro').value,
    id_facultad: parseInt(document.getElementById('id_facultad').value),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/actualizar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.mensaje);
      localStorage.removeItem('equipoEditar');
      window.location.href = '/EquiposCRUD';
    } else {
      alert('Error: ' + result.error);
    }
  } catch (err) {
    alert('Error al actualizar equipo');
  }
});