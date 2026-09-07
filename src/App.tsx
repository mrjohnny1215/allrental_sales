import React, { useState } from 'react';
import MarketingLeads from './components/MarketingLeads';

export default function App() {
  const [activeTab, setActiveTab] = useState<'leads'>('leads');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>All-Rental Sales Console</h1>
        <div>
          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            2026 영업 타겟 (553)
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'leads' && <MarketingLeads />}
      </main>
    </div>
  );
}
