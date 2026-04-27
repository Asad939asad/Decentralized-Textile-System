import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useWeb3 } from './context/Web3Context';
import Grainient from './component/Grainient.js';
import FrontPage from '../pages/index.js';
import Admin from '../pages/Admin.js';
import Operations from '../pages/Operations.js';
import Analytics from '../pages/Analytics.js';

const App: React.FC = () => {
  const { connectWallet, disconnectWallet, account, isConnected, isAdmin, userRole, userName, userReputation } = useWeb3();
  const location = useLocation();
  const [customAddress, setCustomAddress] = React.useState('');

  // The landing page handles its own full-screen Grainient and overlay,
  // so we conditionally render the global nav and background only for other pages.
  const isHome = location.pathname === '/';

  return (
    <>
      {!isHome && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
          <Grainient
            timeSpeed={0.2}
            colorBalance={0.1}
            warpStrength={1.5}
            color1="#FF9FFC"
            color2="#5227FF"
            color3="#B497CF"
            grainAmount={0.15}
          />
        </div>
      )}

      {!isHome && (
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'rgba(13, 8, 21, 0.7)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link
              to="/"
              style={{
                fontFamily: '"Nickainley", cursive',
                fontSize: '1.5rem',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Textile Nexus Pro
            </Link>
            <Link to="/admin" style={navLinkStyle(location.pathname === '/admin')}>
              Admin
            </Link>
            <Link to="/operations" style={navLinkStyle(location.pathname === '/operations')}>
              Operations
            </Link>
            <Link to="/analytics" style={navLinkStyle(location.pathname === '/analytics')}>
              Analytics
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isConnected ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={customAddress} 
                  onChange={e => setCustomAddress(e.target.value)} 
                  placeholder="0x... (Local Dev Testing Only)"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: '0.85rem',
                    width: '200px'
                  }}
                />
                <button onClick={() => connectWallet(customAddress)} style={btnStyle}>
                  Connect
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isAdmin ? '#FF9FFC' : '#5227FF', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '12px' }}>
                    {isAdmin ? 'Admin' : `${userRole} ${userReputation ? `(★ ${userReputation})` : ''}`}
                  </span>
                  <span style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                    {userName ? `${userName} | ` : ''}{account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
                <button onClick={disconnectWallet} style={{...btnStyle, padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255, 50, 50, 0.2)', border: '1px solid rgba(255, 50, 50, 0.4)'}}>
                  Change
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </>
  );
};

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
  textDecoration: 'none',
  fontWeight: isActive ? '600' : '400',
  transition: 'color 0.2s',
});

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#fff',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export default App;
