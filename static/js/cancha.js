$(document).ready(function () {
    // Cargar canchas activas por defecto
    cargarCanchas('SELECT');

    // Al cambiar el filtro de estado (activas, inactivas, todas)
    $('#filtroEstado').on('change', function () {
        const valor = $(this).val();
        cargarCanchas(valor);
    });

    // Mostrar el formulario para agregar nueva cancha
    $('#btnAgregarCancha').on('click', function () {
        $('#canchaForm')[0].reset();
        $('#id_cancha').val('');
        $('#formModalLabel').text('Agregar Cancha');
        $('#formModal').modal('show');
    });

    // Guardar nueva cancha o editar existente
    $('#canchaForm').on('submit', function (e) {
        e.preventDefault();
        const id = $('#id_cancha').val();
        const accion = id ? 'UPDATE' : 'INSERT';

        const canchaData = {
            accion: accion,
            id_cancha: id || 0,
            nombre: $('#nombre').val(),
            ubicacion: $('#ubicacion').val(),
            capacidad: parseInt($('#capacidad').val()),
            activo: 1
        };

        $.ajax({
            url: '/api/cancha',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(canchaData),
            success: function () {
                $('#formModal').modal('hide');
                Swal.fire('Éxito', 'Cancha guardada correctamente', 'success');
                cargarCanchas($('#filtroEstado').val());
            },
            error: function () {
                Swal.fire('Error', 'No se pudo guardar la cancha', 'error');
            }
        });
    });

    // Editar cancha
    $(document).on('click', '.btn-editar', function () {
        const id = $(this).data('id');

        $.ajax({
            url: '/api/cancha',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ accion: 'SELECT_ONE', id_cancha: id }),
            success: function (cancha) {
                $('#id_cancha').val(cancha.id_cancha);
                $('#nombre').val(cancha.nombre);
                $('#ubicacion').val(cancha.ubicacion);
                $('#capacidad').val(cancha.capacidad);
                $('#formModalLabel').text('Editar Cancha');
                $('#formModal').modal('show');
            },
            error: function () {
                Swal.fire('Error', 'No se pudo cargar la cancha', 'error');
            }
        });
    });

    // Eliminar cancha
    $(document).on('click', '.btn-eliminar', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción desactivará la cancha.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/api/cancha',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ accion: 'DELETE', id_cancha: id }),
                    success: function () {
                        Swal.fire('Éxito', 'Cancha eliminada correctamente', 'success');
                        cargarCanchas($('#filtroEstado').val());
                    },
                    error: function () {
                        Swal.fire('Error', 'No se pudo eliminar la cancha', 'error');
                    }
                });
            }
        });
    });

    // Restaurar cancha
    $(document).on('click', '.btn-restaurar', function () {
        const id = $(this).data('id');

        $.ajax({
            url: '/api/cancha',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ accion: 'RESTORE', id_cancha: id }),
            success: function () {
                Swal.fire('Éxito', 'Cancha restaurada correctamente', 'success');
                cargarCanchas($('#filtroEstado').val());
            },
            error: function () {
                Swal.fire('Error', 'No se pudo restaurar la cancha', 'error');
            }
        });
    });
});

// Función para cargar canchas según el filtro (SELECT, INACTIVAS, SELECT_ALL)
function cargarCanchas(filtro = 'SELECT') {
    $.ajax({
        url: '/api/cancha',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ accion: filtro }),
        success: function (res) {
            const activas = $('#tablaCanchas tbody');
            const inactivas = $('#tablaInactivas tbody');

            activas.empty();
            inactivas.empty();

            res.forEach(cancha => {
                const row = `
                    <tr>
                        <td>${cancha.id_cancha}</td>
                        <td>${cancha.nombre}</td>
                        <td>${cancha.ubicacion}</td>
                        <td>${cancha.capacidad}</td>
                        <td>
                            ${cancha.activo
                                ? `<button class="btn btn-warning btn-sm btn-editar" data-id="${cancha.id_cancha}"><i class="bi bi-pencil-square"></i></button>
                                   <button class="btn btn-danger btn-sm btn-eliminar" data-id="${cancha.id_cancha}"><i class="bi bi-trash"></i></button>`
                                : `<button class="btn btn-success btn-sm btn-restaurar" data-id="${cancha.id_cancha}"><i class="bi bi-arrow-clockwise"></i></button>`
                            }
                        </td>
                    </tr>
                `;

                if (cancha.activo) {
                    activas.append(row);
                } else {
                    inactivas.append(row);
                }
            });
        },
        error: function () {
            Swal.fire('Error', 'No se pudieron cargar las canchas.', 'error');
        }
    });
}
