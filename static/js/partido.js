document.addEventListener("DOMContentLoaded", function () {
  obtenerPartidos();
  cargarSelects();
  document.getElementById("formPartido").addEventListener("submit", guardarPartido);
});

function obtenerPartidos() {
  fetch("/api/partidos")
    .then(res => res.json())
    .then(data => {
      renderizarTabla(data);
      renderizarTarjetas(data);
    });
}

function cargarSelects() {
  fetch("/api/jornadas").then(res => res.json()).then(data => {
    const select = document.getElementById("id_jornada");
    select.innerHTML = data.map(j => `<option value="${j.id_jornada}">${j.nombre}</option>`).join("");
  });

  fetch("/api/canchas").then(res => res.json()).then(data => {
    const select = document.getElementById("id_cancha");
    select.innerHTML = data.map(c => `<option value="${c.id_cancha}">${c.nombre}</option>`).join("");
  });
}

function renderizarTabla(partidos) {
  const cuerpo = document.getElementById("tablaPartidos");
  cuerpo.innerHTML = partidos.map(p => `
    <tr>
      <td>${p.id_partido}</td>
      <td>${p.fecha_partido}</td>
      <td>${p.hora_partido}</td>
      <td>${p.cancha}</td>
      <td>${p.jornada}</td>
      <td>${p.estado}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editarPartido(${p.id_partido})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="eliminarPartido(${p.id_partido})">Eliminar</button>
      </td>
    </tr>
  `).join("");
}

function renderizarTarjetas(partidos) {
  const contenedor = document.getElementById("tarjetasPartidos");
  contenedor.innerHTML = partidos.map(p => `
    <div class="col-md-6 col-lg-4">
      <div class="card-partido">
        <div class="card-header">
          <h3>Jornada ${p.jornada}</h3>
          <span>${p.fecha_partido}, ${p.hora_partido}</span>
        </div>
        <div class="card-body">
          <p><strong>Cancha:</strong> ${p.cancha}</p>
          <p><strong>Estado:</strong> ${p.estado}</p>
        </div>
        <div class="card-actions">
          <button class="btn-edit" onclick="editarPartido(${p.id_partido})">Editar</button>
          <button class="btn-delete" onclick="eliminarPartido(${p.id_partido})">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");
}

function guardarPartido(e) {
  e.preventDefault();
  const partido = {
    id_partido: document.getElementById("id_partido").value,
    id_jornada: document.getElementById("id_jornada").value,
    id_cancha: document.getElementById("id_cancha").value,
    fecha_partido: document.getElementById("fecha_partido").value,
    hora_partido: document.getElementById("hora_partido").value,
    estado: document.getElementById("estado").value,
  };

  const metodo = partido.id_partido ? "PUT" : "POST";
  const url = partido.id_partido ? `/api/partidos/${partido.id_partido}` : "/api/partidos";

  fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partido)
  }).then(res => res.json())
    .then(() => {
      limpiarFormulario();
      obtenerPartidos();
    });
}

function editarPartido(id) {
  fetch(`/api/partidos/${id}`)
    .then(res => res.json())
    .then(p => {
      document.getElementById("id_partido").value = p.id_partido;
      document.getElementById("id_jornada").value = p.id_jornada;
      document.getElementById("id_cancha").value = p.id_cancha;
      document.getElementById("fecha_partido").value = p.fecha_partido;
      document.getElementById("hora_partido").value = p.hora_partido;
      document.getElementById("estado").value = p.estado;
    });
}

function eliminarPartido(id) {
  if (confirm("¿Está seguro de eliminar este partido?")) {
    fetch(`/api/partidos/${id}`, { method: "DELETE" })
      .then(() => obtenerPartidos());
  }
}

function limpiarFormulario() {
  document.getElementById("formPartido").reset();
  document.getElementById("id_partido").value = "";
}
