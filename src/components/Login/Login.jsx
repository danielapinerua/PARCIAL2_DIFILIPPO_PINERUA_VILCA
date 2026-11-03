import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import users from '@/data/users';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import './Login.css';
function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleLogin = (e) => {
        e.preventDefault();
        const user = users.find(
            (user) => user.email === email && user.password === password
        );
        if (!user) {
            setError('El correo electrónico o la contraseña son incorrectos.');
            return;
        }
        login(user);
        switch (user.role) {
            case 'client':
                navigate('/dashboard');
                break;
            case 'veterinarian':
                navigate('/dashboard');
                break;
            case 'receptionist':
                navigate('/dashboard');
                break;
            case 'admin':
                navigate('/admin');
                break;
            default:
                navigate('/');
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
                    <Button type="submit" block>
                        Iniciar sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}
export default Login;