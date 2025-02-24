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

// Función para obtener la información del usuario
function obtenerUsuario(userId) {
    fetch(`/api/usuario/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la información del usuario');
            }
            return response.json();
        })
        .then(data => {
            // Aquí puedes mostrar la información del usuario en el perfil
            document.getElementById('nombre').innerText = data.nombre;
            document.getElementById('email').innerText = data.email;
            document.getElementById('direccion').innerText = data.direccion;
            document.getElementById('telefono').innerText = data.telefono;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Llama a la función con el ID del usuario (puedes obtenerlo de la sesión o de otra manera)
const userId = 1; // Reemplaza con el ID del usuario actual
obtenerUsuario(userId);
