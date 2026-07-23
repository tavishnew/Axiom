import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Axiom — Authorization, axiomatic.',
    description:
        'Axiom is the authorization runtime for modern SaaS. RBAC, ABAC, entitlements, and usage limits — as one composable policy layer.',
    openGraph: {
        title: 'Axiom — Authorization, axiomatic.',
        description:
            'The authorization runtime for modern SaaS. One policy layer for RBAC, ABAC, entitlements, and quotas.',
        type: 'website',
    },
    twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-[--bg] text-[--ink] antialiased">{children}</body>
        </html>
    );
}
