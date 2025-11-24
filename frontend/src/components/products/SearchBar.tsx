interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ margin: "12px 0" }}>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search for cuts, farms, or tags"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid #cbd5e1",
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 10px 30px -24px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
}

export default SearchBar;
