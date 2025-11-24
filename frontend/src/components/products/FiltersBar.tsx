interface FiltersBarProps {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

function FiltersBar({ tags, selectedTag, onSelect }: FiltersBarProps) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          padding: "8px 12px",
          borderRadius: 999,
          border: selectedTag ? "1px solid #e2e8f0" : "1px solid #0ea5e9",
          background: selectedTag ? "#fff" : "#e0f2fe",
          color: selectedTag ? "#0f172a" : "#0ea5e9",
          fontWeight: 600,
        }}
      >
        All cuts
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(tag)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: selectedTag === tag ? "1px solid #0ea5e9" : "1px solid #e2e8f0",
            background: selectedTag === tag ? "#e0f2fe" : "#fff",
            color: selectedTag === tag ? "#0ea5e9" : "#0f172a",
            fontWeight: 600,
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export default FiltersBar;
