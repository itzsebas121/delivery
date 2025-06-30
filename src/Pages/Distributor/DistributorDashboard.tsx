import NavbarDistributor from "../../components/NavbarDistributor";
import { Outlet } from "react-router-dom";
import { PedidoWebSocketProvider } from "../../context/PedidoWebSocketProvider";
import { useAuth } from "../../context/Authcontext";

export default function DistributorDashboard() {
    const { user, loading } = useAuth();
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user || typeof user.id !== "number") {
        return <div>User not found or invalid user ID.</div>;
    }
    return (
        <PedidoWebSocketProvider
            role="distributor"
            userId={user.id}>

            <div>
                <NavbarDistributor />
                <div>
                    <Outlet />
                </div>
            </div>
        </PedidoWebSocketProvider>
    );
}
