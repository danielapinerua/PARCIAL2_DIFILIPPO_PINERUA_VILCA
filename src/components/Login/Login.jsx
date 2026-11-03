import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import initialUsers from '@/data/users';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import './Login.css';

const getUsers = () => {
    try {
        const stored = localStorage.getItem('patasana_users');
        return stored ? JSON.parse(stored) : initialUsers;
    } catch {
        return initialUsers;
    }
};

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();
        const user = getUsers().find(
            (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
        );

        if (!user) {
            setError('El correo electrónico o la contraseña son incorrectos.');
            return;
        }

        if (!user.active) {
            setError('Tu cuenta está desactivada. Contactá a la veterinaria.');
            return;
        }

        const { password: _, ...userWithoutPassword } = user;
        login(userWithoutPassword);

        navigate(user.role === 'admin' ? '/dashboard' : '/home');
    };

    return (
        <div className="login-page">
            <Card title="Iniciar sesión">
                <form onSubmit={handleLogin}>
                    <Input
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        placeholder="Ingrese su correo electrónico"
                        required
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Ingrese su contraseña"
                        required
                    />
                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}
                    <Button type="submit">
                        Iniciar sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default Login;