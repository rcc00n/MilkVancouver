import { BrowserRouter, Route, Routes } from "react-router-dom";

import StorefrontLayout from "./layout/Layout";
import DriverLayout from "./layout/DriverLayout";
import AboutPage from "./pages/AboutPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import GalleryPage from "./pages/GalleryPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogListPage from "./pages/BlogListPage";
import GoodToKnowPage from "./pages/GoodToKnowPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import PricingPage from "./pages/PricingPage";
import ProductPage from "./pages/ProductPage";
import SuccessPage from "./pages/SuccessPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Shop from "./pages/Shop";
import AccountPage from "./pages/AccountPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DriverHomePage from "./pages/driver/DriverHomePage";
import DriverProfilePage from "./pages/driver/DriverProfilePage";
import DriverRoutePage from "./pages/driver/DriverRoutePage";
import DriverUpcomingPage from "./pages/driver/DriverUpcomingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<Shop />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="about-us" element={<About />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/list" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="contact" element={<Contact />} />
          <Route path="contact/form" element={<ContactPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="good-to-know" element={<GoodToKnowPage />} />
          <Route path="milk-education" element={<GoodToKnowPage />} />
          <Route path="dairy-education" element={<GoodToKnowPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="success" element={<SuccessPage />} />
          <Route path="pricing/legacy" element={<PricingPage />} />
          <Route path="about/legacy" element={<AboutPage />} />
          <Route path="home/legacy" element={<HomePage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverHomePage />} />
          <Route path="upcoming" element={<DriverUpcomingPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
          <Route path="route/:routeId" element={<DriverRoutePage />} />
          <Route path="*" element={<DriverHomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
