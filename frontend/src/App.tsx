import { Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ProductPage from "./pages/ProductPage";
import SuccessPage from "./pages/SuccessPage";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/shop" element={<MenuPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;
