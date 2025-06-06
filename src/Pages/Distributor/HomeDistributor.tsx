import { useAuth } from "../../context/Authcontext";
export default function HomeDistributor() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h1>Home {user?.nombre}</h1>
    </div>
  );
}