import React from 'react';
import { useNavigate } from 'react-router-dom';
import Grainient from '../src/component/Grainient.js';
import CurvedLoop from '../src/component/CurvedLoop.js';
import CurvedLoop2 from '../src/component/CurvedLoop.js';

const FrontPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background Gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Grainient
          timeSpeed={0.2}
          colorBalance={0.1}
          warpStrength={1.5}
          color1="#FF9FFC" // Deep purple
          color2="#5227FF" // Magenta-ish
          color3="#B497CF" // Dark space
          grainAmount={0.15}
        />
      </div>

      {/* Main Content Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h1
          style={{
            fontFamily: '"Nickainley", cursive',
            fontSize: '4rem',
            fontWeight: 'normal',
            letterSpacing: 'normal',
            marginBottom: '1rem',
            textShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}
        >
          Textile Nexus Pro
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            opacity: 0.8,
            maxWidth: '600px',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '4rem',
          }}
        >
          Next-generation supply chain transparency. Track, verify, and govern every step of your textile production on-chain.
        </p>

        <button
          style={{
            padding: '12px 32px',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#ffffffff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(14, 5, 53, 0.2)',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => navigate('/operations')}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Enter Platform
        </button>
      </div>

      {/* Curved Marquee centered over the background */}
      <div style={{ position: 'absolute', top: 800, bottom: 0, left: 0, right: 0, zIndex: 2 }}>
        <CurvedLoop
          marqueeText="ETHERIUM • GOVERNANCE • QUALITY • TRACEABILITY • "
          speed={2.5}
          curveAmount={100}
          direction="right"
        />
      </div>

    </div>
  );
};

export default FrontPage;
