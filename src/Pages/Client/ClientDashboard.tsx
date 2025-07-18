import NavbarClient from "../../components/NavbarClient";
import { CartProvider } from "../../context/cart-context";
import { Outlet } from "react-router-dom";
import { PedidoWebSocketProvider } from "../../context/PedidoWebSocketProvider";
import { useAuth } from "../../context/Authcontext";
import { useNavigate } from "react-router-dom";
export default function ClientDashboard() {
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
        <PedidoWebSocketProvider
            role="client"
            userId={Number(user.id)}
        >
        <div>
            <CartProvider>
                <NavbarClient />

            </CartProvider>
            <div>
                <CartProvider>
                    <Outlet />
                </CartProvider>
            </div>
        </div>
        </PedidoWebSocketProvider>
    );
}