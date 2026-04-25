import React from 'react';
import { tokens, cardStyle } from './ui';

export function MetricCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${tokens.primary}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: tokens.textPrimary }}>{value}</div>
      <div style={{ fontSize: 13, color: tokens.textSecondary }}>{label}</div>
      {trend && <div style={{ fontSize: 12, color: tokens.textTertiary }}>{trend}</div>}
    </div>
  );
}
