const auth = {
    token: null,
    usuario: null,

    async login(email, contrasena) {
        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, contrasena })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.usuario = data.usuario;
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    },

    logout() {
        this.token = null;
        this.usuario = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login.html';
    },

    isAuthenticated() {
        return !!this.token;
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }
};

// Cargar token si existe
auth.token = localStorage.getItem('token');
auth.usuario = JSON.parse(localStorage.getItem('usuario'));
