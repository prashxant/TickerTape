interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function FilterChip({
  label,
  selected,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={selected ? "btn-primary px-3 py-1.5 text-xs" : "pill"}
    >
      {label}
    </button>
  );
}
