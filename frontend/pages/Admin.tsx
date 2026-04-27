import React, { useState } from 'react';
import { useWeb3 } from '../src/context/Web3Context';
import { ActorRole, OutletType, Department } from '../../backend/contractBridge';

export default function Admin() {
  const { bridge, isConnected } = useWeb3();

  // Shared state for transaction feedback
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);

  const handleTx = async (txPromise: Promise<any>) => {
    if (!bridge || !isConnected) {
      setTxStatus({ type: 'error', msg: 'Please connect your wallet first.' });
      setTimeout(() => setTxStatus(null), 10000);
      return;
    }
    setTxStatus({ type: 'loading', msg: 'Awaiting wallet confirmation...' });
    try {
      const hash = await txPromise;
      setTxStatus({ type: 'success', msg: `Transaction successful! Hash: ${hash}` });
      setTimeout(() => setTxStatus(null), 10000);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.shortMessage || err.details || err.message || 'Transaction failed.';
      setTxStatus({ type: 'error', msg: errMsg });
      setTimeout(() => setTxStatus(null), 10000);
    }
  };

  // 1. Register Actor State
  const [raWallet, setRaWallet] = useState('');
  const [raRole, setRaRole] = useState<number>(ActorRole.Farmer);
  const [raName, setRaName] = useState('');
  const [raLocation, setRaLocation] = useState('');

  // 2. Register Retail Outlet State
  const [roWallet, setRoWallet] = useState('');
  const [roName, setRoName] = useState('');
  const [roLocation, setRoLocation] = useState('');
  const [roType, setRoType] = useState<number>(OutletType.PhysicalStore);
  const [roUrl, setRoUrl] = useState('');

  // 3. Set Dept Head State
  const [dhDept, setDhDept] = useState<number>(Department.Sourcing);
  const [dhWallet, setDhWallet] = useState('');

  // 4. Deactivate Actor State
  const [daWallet, setDaWallet] = useState('');

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Admin Dashboard</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', textAlign: 'center' }}>
        Manage actors, retail outlets, and department heads.
      </p>

      {txStatus && (
        <div style={statusBannerStyle(txStatus.type)}>
          {txStatus.msg}
          <button style={closeBtnStyle} onClick={() => setTxStatus(null)}>×</button>
        </div>
      )}

      <div style={gridStyle}>
        {/* Register Actor */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Register Actor</h2>
          <div style={inputGroup}>
            <label style={labelStyle}>Wallet Address</label>
            <input style={inputStyle} value={raWallet} onChange={(e) => setRaWallet(e.target.value)} placeholder="0x..." />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={raRole} onChange={(e) => setRaRole(Number(e.target.value))}>
              {Object.keys(ActorRole).filter(k => isNaN(Number(k)) && k !== 'None').map((key) => (
                <option key={key} value={ActorRole[key as keyof typeof ActorRole]}>{key}</option>
              ))}
            </select>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Name / Entity</label>
            <input style={inputStyle} value={raName} onChange={(e) => setRaName(e.target.value)} placeholder="Acme Farm" />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Location</label>
            <textarea style={textareaStyle} value={raLocation} onChange={(e) => setRaLocation(e.target.value)} placeholder="Region" />
          </div>
          <button style={btnStyle} onClick={() => handleTx(bridge!.registerActor(raWallet as any, raRole, raName, raLocation))}>
            Register
          </button>
        </div>

        {/* Register Retail Outlet */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Register Retail Outlet</h2>
          <div style={inputGroup}>
            <label style={labelStyle}>Wallet Address</label>
            <input style={inputStyle} value={roWallet} onChange={(e) => setRoWallet(e.target.value)} placeholder="0x..." />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Store Name</label>
            <input style={inputStyle} value={roName} onChange={(e) => setRoName(e.target.value)} placeholder="Store Name" />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Location</label>
            <textarea style={textareaStyle} value={roLocation} onChange={(e) => setRoLocation(e.target.value)} placeholder="City, Country" />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Outlet Type</label>
            <select style={inputStyle} value={roType} onChange={(e) => setRoType(Number(e.target.value))}>
              {Object.keys(OutletType).filter(k => isNaN(Number(k))).map((key) => (
                <option key={key} value={OutletType[key as keyof typeof OutletType]}>{key}</option>
              ))}
            </select>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Platform URL</label>
            <input style={inputStyle} value={roUrl} onChange={(e) => setRoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <button style={btnStyle} onClick={() => handleTx(bridge!.registerRetailOutlet(roWallet as any, ActorRole.RetailOutlet, roName, roLocation, roType, roUrl))}>
            Register Outlet
          </button>
        </div>

        {/* Set Department Head */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Set Department Head</h2>
          <div style={inputGroup}>
            <label style={labelStyle}>Department</label>
            <select style={inputStyle} value={dhDept} onChange={(e) => setDhDept(Number(e.target.value))}>
              {Object.keys(Department).filter(k => isNaN(Number(k))).map((key) => (
                <option key={key} value={Department[key as keyof typeof Department]}>{key}</option>
              ))}
            </select>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Head Wallet</label>
            <input style={inputStyle} value={dhWallet} onChange={(e) => setDhWallet(e.target.value)} placeholder="0x..." />
          </div>
          <button style={btnStyle} onClick={() => handleTx(bridge!.setDepartmentHead(dhDept, dhWallet as any))}>
            Set Head
          </button>
        </div>

        {/* Deactivate Actor */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Deactivate Actor</h2>
          <div style={inputGroup}>
            <label style={labelStyle}>Wallet Address</label>
            <input style={inputStyle} value={daWallet} onChange={(e) => setDaWallet(e.target.value)} placeholder="0x..." />
          </div>
          <button style={{ ...btnStyle, background: 'rgba(139, 81, 198, 0.79)', border: '1px solid rgba(20, 21, 43, 0.4)' }} 
                  onClick={() => handleTx(bridge!.deactivateActor(daWallet as any))}>
            Deactivate
          </button>
        </div>

      </div>
    </div>
  );
}

// --- Shared Styles ---
export const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '2rem 5%',
  color: 'white',
  fontFamily: 'Inter, system-ui, sans-serif',
  position: 'relative',
  zIndex: 1,
};

export const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: '300',
  textAlign: 'center',
  marginBottom: '0.5rem',
  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
};

export const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

export const cardStyle: React.CSSProperties = {
  background: 'rgba(25, 15, 35, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  marginBottom: '1.5rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  paddingBottom: '0.5rem',
};

export const inputGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '1rem',
};

export const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  marginBottom: '0.4rem',
  color: 'rgba(255, 255, 255, 0.8)',
};

export const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  marginTop: '1rem',
  background: 'rgba(82, 39, 255, 0.5)',
  border: '1px solid rgba(82, 39, 255, 0.8)',
  borderRadius: '8px',
  color: 'white',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const statusBannerStyle = (type: string): React.CSSProperties => ({
  position: 'fixed',
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '1rem 2rem',
  background: type === 'error' ? 'rgba(255, 50, 50, 0.9)' : type === 'success' ? 'rgba(50, 200, 100, 0.9)' : 'rgba(50, 50, 200, 0.9)',
  color: 'white',
  borderRadius: '30px',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  maxWidth: '80vw',
  wordBreak: 'break-word',
  maxHeight: '80vh',
  overflowY: 'auto'
});

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'white',
  fontSize: '1.5rem',
  cursor: 'pointer',
};
