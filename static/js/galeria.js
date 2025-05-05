document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.gallery-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const itemWidth = document.querySelector('.gallery-item').offsetWidth;
    const gap = 20;
    let position = 0;

    nextBtn.addEventListener('click', function() {
      position -= (itemWidth + gap);
      const maxPosition = -((track.children.length - 3) * (itemWidth + gap));
      position = Math.max(position, maxPosition);
      track.style.transform = `translateX(${position}px)`;
    });

    prevBtn.addEventListener('click', function() {
      position += (itemWidth + gap);
      position = Math.min(position, 0);
      track.style.transform = `translateX(${position}px)`;
    });

    // Desplazamiento con rueda del mouse
    const galleryRow = document.querySelector('.gallery-row');
    galleryRow.addEventListener('wheel', function(e) {
      e.preventDefault();
      position -= e.deltaY * 0.5;
      const maxPosition = -((track.children.length - 3) * (itemWidth + gap));
      position = Math.max(position, maxPosition);
      position = Math.min(position, 0);
      track.style.transform = `translateX(${position}px)`;
    });
  });