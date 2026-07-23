// Permix UI Components
// =====================

// Placeholder exports - components will be added as dashboard is built
export const UI_VERSION = '0.0.1';

// Button placeholder
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props}>{children}</button>;
}

// Card placeholder
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`permix-card ${className}`}>{children}</div>;
}
