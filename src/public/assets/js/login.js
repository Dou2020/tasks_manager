document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg  = document.getElementById('message');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'message';

    const { identifier, password } = form.elements;
    const payload = {
      identifier: identifier.value.trim(),
      password:   password.value
    };

    try {
      const res = await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        msg.textContent = data.message || data.errors?.map(e => e.message).join(' • ') || 'Error al iniciar sesión.';
        msg.classList.add('error');
        return;
      }

      // Guardar tokens y redirigir a home
      localStorage.setItem('accessToken',  data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      localStorage.setItem('userData',   JSON.stringify(data.data.user));
      window.location.href = '/home.html';

    } catch (err) {
      console.error(err);
      msg.textContent = 'No se pudo conectar al servidor.';
      msg.classList.add('error');
    }
  });
});
