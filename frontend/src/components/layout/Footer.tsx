import { Link } from "react-router-dom";

import { brand } from "../../config/brand";

function Footer() {
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-column footer-column--brand">
          <div className="footer-wordmark">
            <span className="nav-brand__word">{brand.name}</span>
          </div>
          <p className="footer-tagline">{brand.tagline}</p>
        </div>

        <div className="footer-column">
          <h4 className="footer__heading">Browse</h4>
          <div className="footer-links">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="footer-link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-column">
          <h4 className="footer__heading">Contact</h4>
          <div className="footer__text">
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
            <span>{brand.location}</span>
            <span>{brand.supportHours}</span>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-row">
          <span>© {new Date().getFullYear()} {brand.name}</span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
