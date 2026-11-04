import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export default function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    const isLoggedIn = user !== null;

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};