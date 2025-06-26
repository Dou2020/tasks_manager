const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageDiv.textContent = '';
  const username = registerForm.username.value.trim();
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value;
  const confirmPassword = registerForm.confirmPassword.value;

  if (password !== confirmPassword) {
    messageDiv.textContent = 'Las contraseñas no coinciden.';
    messageDiv.className = 'message error';
    return;
  }

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      // Si express-validator devolvió errores:
      if (data.errors) {
        messageDiv.textContent = data.errors.map(err => err.msg).join(', ');
      } else if (data.message) {
        messageDiv.textContent = data.message;
      } else {
        messageDiv.textContent = 'Error al registrar usuario.';
      }
      messageDiv.className = 'message error';
      return;
    }

    // Éxito: guardar tokens y redirigir
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    messageDiv.textContent = 'Registro exitoso. Redirigiendo...';
    messageDiv.className = 'message success';
    setTimeout(() => {
      window.location.href = '/tasks.html';
    }, 1500);

  } catch (err) {
    console.error(err);
    messageDiv.textContent = 'No se pudo conectar al servidor.';
    messageDiv.className = 'message error';
  }
});
