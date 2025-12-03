import PageShell from "../components/PageShell";

function Shop() {
  return (
    <PageShell
      title="Shop"
      note="Route ready"
      description="Placeholder view for the catalog. We’ll connect the product grid and filters to the backend next."
    >
      <div className="page-placeholder">
        <p>Shop page placeholder — confirm the `/shop` route works. Product listing and cart hooks slot in here.</p>
        <ul>
          <li>Keep spacing on the 4/8/16/24/32px rhythm</li>
          <li>Use the 1180px container width for grids</li>
          <li>Primary buttons for add-to-cart, subtle secondary for filters</li>
        </ul>
      </div>
    </PageShell>
  );
}

export default Shop;
