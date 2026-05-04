import "./globals.css";

import { APP_CONFIG } from "@/lib/config";

export const metadata = {
  title: `${APP_CONFIG.nome} MVP`,
  description: "Sistema de agendamento online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}