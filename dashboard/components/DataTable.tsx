import React from 'react';
import { tokens, cardStyle } from './ui';

export function DataTable({ columns, rows, emptyMessage = 'No data' }: { columns: string[]; rows: Record<string, unknown>[]; emptyMessage?: string }) {
  if (!rows.length) return <div style={{ ...cardStyle, textAlign: 'center', color: tokens.textTertiary, padding: 32 }}>{emptyMessage}</div>;
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>{columns.map((c) => <th key={c} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${tokens.borderDefault}`, fontWeight: 600, color: tokens.textSecondary, background: '#fafafa' }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 ? '#fafafa' : 'white' }}>
              {columns.map((c) => <td key={c} style={{ padding: '10px 14px', borderBottom: `1px solid ${tokens.borderDefault}`, color: tokens.textPrimary }}>{String(row[c] ?? row[c.toLowerCase()] ?? '-')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function TableStatus({ status }: { status: string }) {
  const color = status === 'active' ? tokens.success : status === 'error' ? tokens.error : tokens.warning;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: color + '18', color }}>{status}</span>;
}
