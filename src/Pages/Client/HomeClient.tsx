import { useAuth } from "../../context/Authcontext";
export default function HomeClient() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <div>
            <h1>Home {user?.rol}</h1>
        </div>
    );
}