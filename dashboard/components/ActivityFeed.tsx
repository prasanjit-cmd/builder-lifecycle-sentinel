import React from 'react';
import { tokens, cardStyle } from './ui';

interface FeedItem { id: string; title: string; description?: string; timestamp?: string; status?: string }

export function ActivityFeed({ items, emptyMessage = 'No recent activity yet' }: { items: FeedItem[]; emptyMessage?: string }) {
  if (!items.length) return <div style={{ ...cardStyle, textAlign: 'center', color: tokens.textTertiary }}>{emptyMessage}</div>;
  return (
    <div style={cardStyle}>
      {items.map((item) => (
        <div key={item.id} style={{ padding: '10px 0', borderBottom: `1px solid ${tokens.borderDefault}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontWeight: 500, color: tokens.textPrimary, fontSize: 13 }}>{item.title}</div>{item.description && <div style={{ fontSize: 12, color: tokens.textTertiary }}>{item.description}</div>}</div>
          {item.timestamp && <div style={{ fontSize: 11, color: tokens.textTertiary, whiteSpace: 'nowrap' }}>{item.timestamp}</div>}
        </div>
      ))}
    </div>
  );
}
