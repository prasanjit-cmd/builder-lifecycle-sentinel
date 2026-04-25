interface FeedItem {
    id: string;
    title: string;
    description?: string;
    timestamp?: string;
    status?: string;
}
export declare function ActivityFeed({ items, emptyMessage }: {
    items: FeedItem[];
    emptyMessage?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
