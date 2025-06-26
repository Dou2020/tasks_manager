document.addEventListener('DOMContentLoaded', async () => {
  const userInfoDiv = document.getElementById('userInfo');
  const logoutBtn   = document.getElementById('logoutBtn');

  const token = localStorage.getItem('accessToken');
  if (!token) {
    // No hay token: redirigir a login
    return window.location.href = '/login.html';
  }

  try {
    // Obtener perfil
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No autorizado');

    const { username, email, first_name, last_name } = data.data.user;
    userInfoDiv.innerHTML = `
      <p><strong>Usuario:</strong> ${username}</p>
      <p><strong>Nombre:</strong> ${first_name || '-'} ${last_name || ''}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;
  } catch (err) {
    console.error(err);
    // Token inválido o expirado → logout
    return doLogout();
  }

  logoutBtn.addEventListener('click', doLogout);

  async function doLogout() {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken  = localStorage.getItem('accessToken');
    // Llamar al endpoint de logout para limpiar en servidor
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken }
    }).catch(() => { /* ignore errors */ });

    // Limpiar almacenamiento y redirigir
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login.html';
  }
});
