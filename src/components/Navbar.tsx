import React from 'react';
import { NavLink } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="logo">LocalPay</div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Checkout
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
        </nav>
      </div>
      <div className="nav-right">
        <TonConnectButton />
      </div>
    </header>
  );
};

export default Navbar;
