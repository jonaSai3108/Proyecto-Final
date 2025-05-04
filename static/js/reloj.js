function updateCountdown() {
    const countDate = new Date("July 15, 2025 20:00:00").getTime(); // Fecha del partido
    const now = new Date().getTime();
    const distance = countDate - now;
  
    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
  
    const days = Math.floor(distance / day);
    const hours = Math.floor((distance % day) / hour);
    const minutes = Math.floor((distance % hour) / minute);
    const seconds = Math.floor((distance % minute) / second);
  
    // Actualiza el HTML
    document.getElementById("days").textContent = days.toString().padStart(2, "0");
    document.getElementById("hours").textContent = hours.toString().padStart(2, "0");
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, "0");
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, "0");
  
    // Si el contador llega a cero
    if (distance < 0) {
      clearInterval(countdownTimer);
      document.getElementById("countdown").innerHTML = '<h2 class="text-white">¡EL PARTIDO HA COMENZADO!</h2>';
    }
  }
  
  // Actualiza cada segundo
  const countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown(); // Ejecuta inmediatamente al cargar