import "./globals.css";
import "./report.css";
import "./tool-tabs.css";
import "./brand-shell.css";

export const metadata = {
  title: "W-Section | LinkoTech",
  description: "CSA S16:2019 W-section verification"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
