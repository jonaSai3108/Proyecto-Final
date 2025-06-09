$(document).ready(function () {
  const API_URL = "/api/partidos"; // Ajusta esta URL si tu endpoint es otro
  const API_JORNADAS = "/api/jornadas";
  const API_CANCHAS = "/api/canchas";

  let partidos = [];
  let jornadas = [];
  let canchas = [];
  let partidoEliminarId = null;

  // Inicialización
  cargarJornadas();
  cargarCanchas();
  cargarPartidos();

  // Evento formulario: Crear o editar partido
  $("#formPartido").submit(function (e) {
    e.preventDefault();
    guardarPartido();
  });

  // Cancelar formulario
  $("#btnCancelar").click(function () {
    limpiarFormulario();
  });

  // Confirmar eliminar partido
  $("#confirmButton").click(function () {
    if (partidoEliminarId) {
      eliminarPartido(partidoEliminarId);
      partidoEliminarId = null;
      $("#confirmModal").modal("hide");
    }
  });

  // Funciones

  function cargarJornadas() {
    $.get(API_JORNADAS, function (data) {
      jornadas = data;
      let options = <option value="" disabled selected>Seleccione una jornada</option>;
      jornadas.forEach((j) => {
        options += <option value="${j.id_jornada}">${j.nombre || j.descripcion || j.id_jornada}</option>;
      });
      $("#id_jornada").html(options);
    }).fail(() => {
      mostrarAlerta("Error cargando jornadas", "danger");
      $("#id_jornada").html(<option value="" disabled selected>Error cargando jornadas</option>);
    });
  }

  function cargarCanchas() {
    $.get(API_CANCHAS, function (data) {
      canchas = data;
      let options = <option value="" disabled selected>Seleccione una cancha</option>;
      canchas.forEach((c) => {
        options += <option value="${c.id_cancha}">${c.nombre || c.descripcion || c.id_cancha}</option>;
      });
      $("#id_cancha").html(options);
    }).fail(() => {
      mostrarAlerta("Error cargando canchas", "danger");
      $("#id_cancha").html(<option value="" disabled selected>Error cargando canchas</option>);
    });
  }

  function cargarPartidos() {
    $("#tablaPartidos").html(<tr><td colspan="7" class="text-center">Cargando partidos...</td></tr>);
    $.get(API_URL, function (data) {
      partidos = data;
      if (partidos.length === 0) {
        $("#tablaPartidos").html(<tr><td colspan="7" class="text-center">No hay partidos registrados</td></tr>);
        $("#tarjetasPartidos").html(<p class="text-center">No hay próximos partidos</p>);
        return;
      }
      renderizarTabla(partidos);
      renderizarTarjetas(partidos);
    }).fail(() => {
      mostrarAlerta("Error cargando partidos", "danger");
      $("#tablaPartidos").html(<tr><td colspan="7" class="text-center text-danger">Error al cargar partidos</td></tr>);
      $("#tarjetasPartidos").html(<p class="text-center text-danger">Error al cargar próximos partidos</p>);
    });
  }

  function renderizarTabla(partidos) {
    let filas = partidos.map((p) => {
      const jornada = jornadas.find(j => j.id_jornada === p.id_jornada);
      const cancha = canchas.find(c => c.id_cancha === p.id_cancha);
      return `
        <tr>
          <td>${p.id_partido}</td>
          <td>${p.fecha_partido}</td>
          <td>${p.hora_partido}</td>
          <td>${cancha ? cancha.nombre || cancha.descripcion : p.id_cancha}</td>
          <td>${jornada ? jornada.nombre || jornada.descripcion : p.id_jornada}</td>
          <td>${p.estado}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editarPartido(${p.id_partido})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="confirmarEliminar(${p.id_partido})" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
    $("#tablaPartidos").html(filas);
  }

  function renderizarTarjetas(partidos) {
    const proximos = partidos.filter(p => p.estado === "Programado" || p.estado === "En juego");

    if (proximos.length === 0) {
      $("#tarjetasPartidos").html(<p class="text-center">No hay próximos partidos</p>);
      return;
    }

    let tarjetasHtml = proximos.map(p => {
      const jornada = jornadas.find(j => j.id_jornada === p.id_jornada);
      const cancha = canchas.find(c => c.id_cancha === p.id_cancha);
      return `
        <div class="col-md-4 mb-3">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Partido #${p.id_partido}</h5>
              <p><strong>Fecha:</strong> ${p.fecha_partido}</p>
              <p><strong>Hora:</strong> ${p.hora_partido}</p>
              <p><strong>Cancha:</strong> ${cancha ? cancha.nombre || cancha.descripcion : p.id_cancha}</p>
              <p><strong>Jornada:</strong> ${jornada ? jornada.nombre || jornada.descripcion : p.id_jornada}</p>
              <p><strong>Estado:</strong> ${p.estado}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");
    $("#tarjetasPartidos").html(tarjetasHtml);
  }

  function guardarPartido() {
    if (!$("#formPartido")[0].checkValidity()) {
      $("#formPartido")[0].reportValidity();
      return;
    }

    const id_partido = $("#id_partido").val();
    const partidoData = {
      id_jornada: $("#id_jornada").val(),
      id_cancha: $("#id_cancha").val(),
      fecha_partido: $("#fecha_partido").val(),
      hora_partido: $("#hora_partido").val(),
      estado: $("#estado").val(),
    };

    if (!partidoData.id_jornada || !partidoData.id_cancha) {
      mostrarAlerta("Seleccione jornada y cancha", "warning");
      return;
    }

    if (id_partido) {
      $.ajax({
        url: '${API_URL}/${id_partido}',
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(partidoData),
        success: function () {
          mostrarAlerta("Partido actualizado correctamente", "success");
          limpiarFormulario();
          cargarPartidos();
        },
        error: function () {
          mostrarAlerta("Error al actualizar el partido", "danger");
        },
      });
    } else {
      $.ajax({
        url: API_URL,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(partidoData),
        success: function () {
          mostrarAlerta("Partido creado correctamente", "success");
          limpiarFormulario();
          cargarPartidos();
        },
        error: function () {
          mostrarAlerta("Error al crear el partido", "danger");
        },
      });
    }
  }

  window.editarPartido = function (id) {
    const partido = partidos.find((p) => p.id_partido === id);
    if (!partido) {
      mostrarAlerta("Partido no encontrado", "warning");
      return;
    }
    $("#id_partido").val(partido.id_partido);
    $("#id_jornada").val(partido.id_jornada);
    $("#id_cancha").val(partido.id_cancha);
    $("#fecha_partido").val(partido.fecha_partido);
    $("#hora_partido").val(partido.hora_partido);
    $("#estado").val(partido.estado);
    $("#btnGuardar").text("Actualizar Partido");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  };

  window.confirmarEliminar = function (id) {
    partidoEliminarId = id;
    $("#confirmModal").modal("show");
  };

  function eliminarPartido(id) {
    $.ajax({
      url: '${API_URL}/${id}',
      type: "DELETE",
      success: function () {
        mostrarAlerta("Partido eliminado correctamente", "success");
        cargarPartidos();
      },
      error: function () {
        mostrarAlerta("Error al eliminar el partido", "danger");
      },
    });
  }

  function limpiarFormulario() {
    $("#formPartido")[0].reset();
    $("#id_partido").val("");
    $("#btnGuardar").text("Crear Partido");
  }

  function mostrarAlerta(mensaje, tipo) {
    const alerta = $(`
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `);
    $("#alertaContainer").html(alerta);
    setTimeout(() => {
      alerta.alert("close");
    }, 4000);
  }
});