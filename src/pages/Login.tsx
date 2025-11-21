import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
    const wallet = useTonWallet();
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            // If already logged in, redirect based on role? 
            // Actually, we might not know where to go if we just check isAuthenticated.
            // But usually we redirect to home.
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleRoleSelect = (role: 'customer' | 'merchant') => {
        if (!wallet) {
            alert('Please connect your wallet first!');
            return;
        }
        login(role);
        if (role === 'merchant') {
            navigate('/merchant/home');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="login-card" style={{
                background: 'rgba(30, 30, 30, 0.8)',
                padding: '3rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
                backdropFilter: 'blur(10px)'
            }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(45deg, #0088cc, #a64dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    LocalPay
                </h1>
                <p style={{ color: '#a0a0a0', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                    Connect your wallet to start shopping or selling.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                    <TonConnectButton />
                </div>

                {wallet && (
                    <div className="role-selection" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
                        <p style={{ marginBottom: '1rem' }}>Continue as:</p>

                        <button
                            onClick={() => handleRoleSelect('customer')}
                            className="secondary-button"
                            style={{ padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            🛍️ Customer
                        </button>

                        <button
                            onClick={() => handleRoleSelect('merchant')}
                            className="primary-button"
                            style={{ padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            🏪 Merchant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
