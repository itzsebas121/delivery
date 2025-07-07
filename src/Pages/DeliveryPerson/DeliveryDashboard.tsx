import { Outlet, useNavigate } from "react-router-dom";
import NavbarDelivery from "../../components/NavbarDelivery";
import { useAuth } from "../../context/Authcontext";

export function DeliveryDashboard() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user?.id) {
        navigate("/login");
        return <div>User not found.</div>;
    }

    return (
        <div>
            <NavbarDelivery />
            <div>
                <Outlet />
            </div>
        </div>
    );
}
