import { Outlet } from "react-router-dom";
import NavbarDelivery from "../../components/NavbarDelivery";
export function DeliveryDashboard() {
    return (
        <div>
            <NavbarDelivery/>
            <div>
                <Outlet></Outlet>
            </div>
        </div>
    );
}