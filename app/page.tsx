import { RaceApp } from './components/race-app';

export default function Home() {
  return (
    <div className="page-shell" style={{
      height: '100dvh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0ece4',
      boxSizing: 'border-box',
    }}>
      <div className="phone-frame" style={{ width: '100%', maxWidth: 430, position: 'relative', overflow: 'hidden' }}>
        <RaceApp />
      </div>
    </div>
  );
}
