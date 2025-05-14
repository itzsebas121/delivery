import NavbarClient from "../../components/NavbarClient";
import { Outlet } from "react-router-dom";
export default function ClientDashboard() {
    return (
        <div>
            <NavbarClient />
            <div>
                <Outlet />
            </div>
        </div>
    );
}