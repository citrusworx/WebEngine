import { HUB_COLORS } from "../../data/hub";

export function HubMiniBar(props: { value: number }) {
  const color =
    props.value >= 85 ? HUB_COLORS.emerald : props.value >= 70 ? HUB_COLORS.violet : HUB_COLORS.amber;

  return (
    <div hub-mini-bar>
      <div hub-mini-bar-track>
        <div hub-mini-bar-fill style={{ width: `${props.value}%`, backgroundColor: color }} />
      </div>
      <span hub-mini-bar-value>{props.value}</span>
    </div>
  );
}
