document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/api/usuarios') // Asegúrate de que esta URL sea correcta
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la red: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const usuariosDiv = document.getElementById('usuarios');
            usuariosDiv.innerHTML = '<h2>Usuarios</h2><ul class="list-group">';
            data.forEach(usuario => {
                usuariosDiv.innerHTML += `<li class="list-group-item">${usuario.nombre} - ${usuario.email}</li>`;
            });
            usuariosDiv.innerHTML += '</ul>';
        })
        .catch(error => console.error('Error al obtener los usuarios:', error));
});
