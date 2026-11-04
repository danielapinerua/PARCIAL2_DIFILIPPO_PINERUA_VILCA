import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { login as loginRequest } from '../api';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await loginRequest(email, password);
            login(user);
            navigate(user.role === 'admin' ? '/dashboard' : '/home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                    <Button type="submit" loading={loading}>
                        Iniciar sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default Login;