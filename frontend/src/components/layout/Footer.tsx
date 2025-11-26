import { Link } from "react-router-dom";

import { brand } from "../../config/brand";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div>
            <div className="brand__name">{brand.name}</div>
            <p className="muted">Coastal dairy bottled at dawn and delivered cold.</p>
          </div>
        </div>
        <div>
          <h4 className="footer__heading">Contact</h4>
          <div className="footer__text">
            <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>{brand.phone}</a>
            <br />
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
            <br />
            <Link to="/contact">Contact page</Link>
          </div>
        </div>
        <div>
          <h4 className="footer__heading">Hours</h4>
          <div className="footer__text">Open 24/7 online</div>
          <div className="footer__text">Shop anytime</div>
        </div>
        <div>
          <h4 className="footer__heading">Follow</h4>
          <div className="footer__text">Stay connected with us</div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-row">
          <span>Grass-fed milk · Pasteurized & cold-held · Vancouver made</span>
          <span>© {new Date().getFullYear()} {brand.name}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
