import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function AdminDashboard() {

    const { user, loading, logout } = useAuth()

    if (loading) return <p>Loading...</p>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <article>
            <h1>Admin Dashboard</h1>
            <button onClick={logout}>Logout</button>
        </article>
    )
}