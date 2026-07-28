import type { Metadata, Viewport } from "next";
import "./globals.css";
import EmotionRegistry from "@/theme/EmotionRegistry";
import ThemeRegistry from "@/theme/ThemeRegistry";
import AppShell from "@/components/layout/AppShell";
import { InvoiceStoreProvider } from "@/store/InvoiceStore";
import { AuthProvider } from "@/store/AuthContext";

export const metadata: Metadata = {
  title: "Fleet Management | Fleet Billing System",
  description: "Automated Fleet Billing System based on trip distance, integrated with OneGP.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmotionRegistry>
          <ThemeRegistry>
            <AuthProvider>
              <InvoiceStoreProvider>
                <AppShell>{children}</AppShell>
              </InvoiceStoreProvider>
            </AuthProvider>
          </ThemeRegistry>
        </EmotionRegistry>
      </body>
    </html>
  );
}
