import { useAuth } from '@/contexts/AuthContext';
import VetHomePage from './VetHomePage';
import ReceptionistHomePage from './ReceptionistHomePage';
import ClientHomePage from './ClientHomePage';

function RoleHome() {
    const { user } = useAuth();

    switch (user?.role) {
        case 'veterinarian':
            return <VetHomePage />;
        case 'receptionist':
            return <ReceptionistHomePage />;
        case 'client':
            return <ClientHomePage />;
        default:
            return null;
    }
}

export default RoleHome;