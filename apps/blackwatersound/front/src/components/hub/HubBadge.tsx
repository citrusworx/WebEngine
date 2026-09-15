import { HUB_COLORS } from "../../data/hub";

export function HubBadge(props: { label: string; color?: string; bg?: string }) {
  const color = props.color ?? HUB_COLORS.violet;
  const bg = props.bg ?? `${color}18`;

  return (
    <span hub-badge style={{ color, backgroundColor: bg }}>
      {props.label}
    </span>
  );
}
