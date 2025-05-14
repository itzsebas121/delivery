import NavbarClient from "../../components/NavbarClient";
import { CartProvider } from "../../context/cart-context";
import { Outlet } from "react-router-dom";
export default function ClientDashboard() {
    return (
        <div>
            <CartProvider>
                <NavbarClient />

            </CartProvider>
            <div>
                <Outlet />
            </div>
        </div>
    );
}