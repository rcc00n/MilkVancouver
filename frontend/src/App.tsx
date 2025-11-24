import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import CartSidebar from "./components/layout/CartSidebar";
import Layout from "./components/layout/Layout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import SuccessPage from "./pages/SuccessPage";

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <Layout onCartClick={() => setCartOpen(true)}>
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:productId" element={<ProductPage onAddToCart={() => setCartOpen(true)} />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
