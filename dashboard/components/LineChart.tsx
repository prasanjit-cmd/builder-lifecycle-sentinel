import React from 'react';
import { tokens, cardStyle } from './ui';

export function LineChart({ data, label = '' }: { data: Array<{ label: string; value: number }>; label?: string }) {
  if (!data.length) return <div style={{ ...cardStyle, textAlign: 'center', color: tokens.textTertiary }}>No chart data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={cardStyle}>
      {label && <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary, marginBottom: 12 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', background: tokens.primary + '30', borderRadius: 4, height: Math.max(4, (d.value / max) * 100), transition: 'height 0.3s' }} />
            <div style={{ fontSize: 10, color: tokens.textTertiary, textAlign: 'center' }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
