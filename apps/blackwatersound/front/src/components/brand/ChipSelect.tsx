export function ChipSelect<T extends string>(props: {
  items: readonly { key: T; label: string }[];
  active: T;
  onSelect: (key: T) => void;
}) {
  return (
    <div chip-row row gap="0.6rem">
      {props.items.map((item) => (
        <button
          key={item.key}
          type="button"
          chip
          active={props.active === item.key ? true : undefined}
          onClick={() => props.onSelect(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
