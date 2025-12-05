import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { SiteImagesProvider } from "./context/SiteImagesContext";
import { SessionProvider } from "./context/SessionContext";
import "./styles/globals.css";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing in index.html");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <SiteImagesProvider>
      <AuthProvider>
        <SessionProvider>
          <ProductsProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProductsProvider>
        </SessionProvider>
      </AuthProvider>
    </SiteImagesProvider>
  </StrictMode>,
);
