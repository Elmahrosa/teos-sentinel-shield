import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          fontFamily: 'monospace',
          color: '#f0ede8',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: 64 }}>𓂀</span>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#e63333' }}>TEOS</span>
          <span style={{ fontSize: 48, fontWeight: 400, opacity: 0.5 }}>Sentinel</span>
        </div>
        <div style={{ fontSize: 24, opacity: 0.5, textAlign: 'center', maxWidth: 600 }}>
          Runtime Security Infrastructure for AI Execution
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 24,
            fontSize: 14,
            opacity: 0.3,
          }}
        >
          <span>Deterministic</span>
          <span>·</span>
          <span>Pre-Execution</span>
          <span>·</span>
          <span>25 Rules</span>
        </div>
      </div>
    ),
    size,
  );
}
