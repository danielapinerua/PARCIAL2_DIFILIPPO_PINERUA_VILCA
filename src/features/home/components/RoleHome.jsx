import { useAuth } from '@/features/auth';
import VetHomePage from './VetHomePage';
import ReceptionistHomePage from './ReceptionistHomePage';
import ClientHomePage from './ClientHomePage';
import AdminHomePage from './AdminHomePage';

function RoleHome() {
    const { user } = useAuth();

    switch (user?.role) {
        case 'veterinarian':
            return <VetHomePage />;
        case 'receptionist':
            return <ReceptionistHomePage />;
        case 'client':
            return <ClientHomePage />;
        case 'admin':
            return <AdminHomePage />;
        default:
            return null;
    }
}

export default RoleHome;