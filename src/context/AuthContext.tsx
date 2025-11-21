import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';

type UserRole = 'customer' | 'merchant' | null;

interface AuthContextType {
    userRole: UserRole;
    login: (role: UserRole) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'localpay_user_role';

export function AuthProvider({ children }: { children: ReactNode }) {
    const wallet = useTonWallet();
    const [userRole, setUserRole] = useState<UserRole>(() => {
        return (localStorage.getItem(STORAGE_KEY) as UserRole) || null;
    });

    useEffect(() => {
        if (userRole) {
            localStorage.setItem(STORAGE_KEY, userRole);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [userRole]);

    // If wallet disconnects, we might want to logout, or keep role but require reconnect.
    // For simplicity, let's keep role but isAuthenticated depends on wallet.
    // Actually, user asked for "one time login".
    // Let's say isAuthenticated = !!userRole. Wallet is just for payment/identity.
    // But usually login implies wallet connection first.
    // Let's make isAuthenticated = !!userRole.

    const login = (role: UserRole) => {
        setUserRole(role);
    };

    const logout = () => {
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ userRole, login, logout, isAuthenticated: !!userRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
