import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;                     // ⬅ NEW
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    restoreUser: () => Promise<void>;     // ⬅ NEW
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: true,                 // Initially loading…

            setAuth: (user, token) => {
                set({ user, token, loading: false });
            },

            logout: () => {
                set({ user: null, token: null, loading: false });
            },

            // 🔥 Automatically fetch logged-in user on refresh
            restoreUser: async () => {
                const token = get().token;

                if (!token) {
                    set({ loading: false });
                    return;
                }

                try {
                    const res = await fetch("/api/auth/me", {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        // Token invalid → clear session
                        set({ user: null, token: null, loading: false });
                        return;
                    }

                    const data = await res.json();
                    set({ user: data.user, loading: false });
                } catch (err) {
                    console.error("restoreUser error:", err);
                    set({ user: null, token: null, loading: false });
                }
            }
        }),

        {
            name: "auth-storage",
            storage: createJSONStorage(() =>
                typeof window !== "undefined"
                    ? localStorage
                    : {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { }
                    }
            )
        }
    )
);
