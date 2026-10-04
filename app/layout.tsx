import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AI Resume Doctor", description: "Diagnose and improve your resume for the job you want." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
