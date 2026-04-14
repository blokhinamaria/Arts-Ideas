import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AuthContextType = {
    user: unknown;
    login: (_token?: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function checkSession() {
        try {
            const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: "include"
        });

        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
        }
        } catch {}
        setLoading(false);
    }

    useEffect(() => {
        checkSession();
    }, []);

    async function login(_token?: string) {
        await checkSession();
    }

    async function logout() {
        const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''
        await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include"
        });

        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};