import "./globals.css";
import "./report.css";
import "./workspace-tabs.css";

export const metadata = {
  title: "Steel Verification",
  description: "CSA S16:2019 W-section verification"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
