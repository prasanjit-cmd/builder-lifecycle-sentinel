import type { CSSProperties, ReactNode } from 'react';

export const tokens = {
  primary: '#ae00d0',
  primaryHover: '#9400b4',
  secondary: '#7b5aff',
  background: '#f9f7f9',
  cardColor: '#ffffff',
  sidebarBg: '#fdfbff',
  textPrimary: '#121212',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',
  borderDefault: '#e5e7eb',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  gradient: 'linear-gradient(135deg, #ae00d0, #7b5aff)',
};

export const pageStyle: CSSProperties = { padding: 24, maxWidth: 1200 };
export const cardStyle: CSSProperties = { background: tokens.cardColor, border: `1px solid ${tokens.borderDefault}`, borderRadius: 12, padding: 20, marginBottom: 16 };
export const headingStyle: CSSProperties = { fontSize: 20, fontWeight: 700, color: tokens.textPrimary, marginBottom: 4 };
export const subheadingStyle: CSSProperties = { fontSize: 13, color: tokens.textSecondary, marginBottom: 20 };
export const gridStyle = (cols: number): CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div style={{ padding: 40, textAlign: 'center', color: tokens.textTertiary }}>{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div style={{ ...cardStyle, borderColor: tokens.error, color: tokens.error }}>{message}</div>;
}

export function EmptyState({ title = 'No data', description = '' }: { title?: string; description?: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontWeight: 600, color: tokens.textSecondary }}>{title}</div>
      {description ? <div style={{ fontSize: 13, color: tokens.textTertiary, marginTop: 4 }}>{description}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={headingStyle}>{title}</h1>
      {description ? <p style={subheadingStyle}>{description}</p> : null}
      {children}
    </div>
  );
}
