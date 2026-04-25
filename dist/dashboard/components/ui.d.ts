import type { CSSProperties } from 'react';
export declare const tokens: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    cardColor: string;
    sidebarBg: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderDefault: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    gradient: string;
};
export declare const pageStyle: CSSProperties;
export declare const cardStyle: CSSProperties;
export declare const headingStyle: CSSProperties;
export declare const subheadingStyle: CSSProperties;
export declare const gridStyle: (cols: number) => CSSProperties;
export declare function LoadingState({ label }: {
    label?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function ErrorState({ message }: {
    message: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function EmptyState({ title, description }: {
    title?: string;
    description?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function PageHeader({ title, description }: {
    title: string;
    description?: string;
}): import("react/jsx-runtime").JSX.Element;
