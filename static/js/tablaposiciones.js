document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('posiciones-body');

  async function cargarPosiciones() {
    try {
      const res = await fetch('/api/posiciones/');
      if (!res.ok) throw new Error('Error al cargar posiciones');
      const posiciones = await res.json();

      if (!posiciones.length) {
        tbody.innerHTML = '<tr><td colspan="10">No hay posiciones para mostrar.</td></tr>';
        return;
      }

      tbody.innerHTML = posiciones.map((pos, index) => `
        <tr>
          <td>${index + 1}</td> <!-- posición calculada aquí -->
          <td>${pos.equipo_nombre}</td>
          <td>${pos.partidos_jugados}</td>
          <td>${pos.partidos_ganados}</td>
          <td>${pos.partidos_empatados}</td>
          <td>${pos.partidos_perdidos}</td>
          <td>${pos.goles_favor}</td>
          <td>${pos.goles_contra}</td>
          <td>${pos.diferencia_goles}</td>
          <td>${pos.puntos}</td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-danger">${error.message}</td></tr>`;
    }
  }

  cargarPosiciones();
});
