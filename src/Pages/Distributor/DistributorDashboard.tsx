import NavbarDistributor from "../../components/NavbarDistributor";
import { Outlet } from "react-router-dom";
export default function DistributorDashboard() {
    return (
        <div>
            <NavbarDistributor />
            <div>
                <Outlet/>
            </div>
        </div>
    );
}
