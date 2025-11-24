interface FiltersBarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

function FiltersBar({ categories, selectedCategory, onSelect }: FiltersBarProps) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          padding: "8px 12px",
          borderRadius: 999,
          border: selectedCategory ? "1px solid #e2e8f0" : "1px solid #0ea5e9",
          background: selectedCategory ? "#fff" : "#e0f2fe",
          color: selectedCategory ? "#0f172a" : "#0ea5e9",
          fontWeight: 600,
        }}
      >
        All categories
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: selectedCategory === category ? "1px solid #0ea5e9" : "1px solid #e2e8f0",
            background: selectedCategory === category ? "#e0f2fe" : "#fff",
            color: selectedCategory === category ? "#0ea5e9" : "#0f172a",
            fontWeight: 600,
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default FiltersBar;
