document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const msg  = document.getElementById('message');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'message';

    const {
      username,
      first_name,
      last_name,
      email,
      password,
      confirmPassword
    } = form.elements;

    // Verificación de contraseña
    if (password.value !== confirmPassword.value) {
      msg.textContent = 'Las contraseñas no coinciden.';
      msg.classList.add('error');
      return;
    }

    const payload = {
      username:   username.value.trim(),
      first_name: first_name.value.trim(),
      last_name:  last_name.value.trim(),
      email:      email.value.trim(),
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
        // Mostrar errores de validación o mensajes del servidor
        if (data.errors) {
          msg.textContent = data.errors.map(e => e.message).join(' • ');
        } else if (data.message) {
          msg.textContent = data.message;
        } else {
          msg.textContent = 'Error al registrar.';
        }
        msg.classList.add('error');
        return;
      }

      // Éxito: guardar tokens y redirigir
      msg.textContent = '¡Registro exitoso! Redirigiendo…';
      msg.classList.add('success');
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      setTimeout(() => window.location.href = '/tasks.html', 1500);

    } catch (err) {
      console.error(err);
      msg.textContent = 'No se pudo conectar al servidor.';
      msg.classList.add('error');
    }
  });
});
