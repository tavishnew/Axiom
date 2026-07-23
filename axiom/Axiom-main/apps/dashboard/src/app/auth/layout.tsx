import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "Sign In - AccessForge",
    description: "Sign in to your AccessForge dashboard",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth pages don't use the sidebar layout
    return <>{children}</>;
}
