function loadUserData(userId) {
    fetch(`http://localhost:3000/api/usuario/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos del usuario');
            }
            return response.json();
        })
        .then(data => {
            const perfilDatos = document.getElementById('perfilDatos');
            perfilDatos.innerHTML = `
                <h2>${data.nombre}</h2>
                <p>Email: ${data.email}</p>
                <p>Teléfono: ${data.telefono}</p>
                <p>Dirección: ${data.direccion}</p>
            `;
        })
        .catch(error => {
            const perfilDatos = document.getElementById('perfilDatos');
            perfilDatos.innerHTML = `<p>Error: ${error.message}</p>`;
        });
}
