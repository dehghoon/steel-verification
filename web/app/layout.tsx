import "./globals.css";
import "./report.css";
import "./tool-tabs.css";
import "./brand-shell.css";

export const metadata = {
  title: "CSA S16 W-Section Steel Verification Calculator | Linkoteq",
  description: "Check Canadian structural steel W-sections using an interactive CSA S16:2019 verification tool with member forces, section properties and engineering results.",
  alternates: { canonical: "https://wsection.linkoteq.com/" },
  robots: { index: true, follow: true },
  openGraph: { title: "CSA S16 W-Section Steel Verification Calculator | Linkoteq", description: "Check Canadian structural steel W-sections using an interactive CSA S16:2019 verification tool with member forces, section properties and engineering results.", url: "https://wsection.linkoteq.com/", type: "website" as const },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
