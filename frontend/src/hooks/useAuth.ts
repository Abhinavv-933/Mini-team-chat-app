'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const [isHydrated, setIsHydrated] = useState(false);
    const { user, token, setAuth, logout } = useAuthStore();

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return {
        user: isHydrated ? user : null,
        token: isHydrated ? token : null,
        setAuth,
        logout,
        isHydrated,
    };
}
