import type { ReactNode } from "react";

import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  onCartClick: () => void;
}

function Layout({ children, onCartClick }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header onCartClick={onCartClick} />
      <main style={{ flex: 1, width: "min(1100px, 95vw)", margin: "0 auto", padding: "32px 0" }}>{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
