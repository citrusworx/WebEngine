import { HUB_COLORS } from "../../data/hub";

export function HubStatCard(props: {
  label: string;
  value: string;
  delta?: string;
  accent?: string;
}) {
  const trend = props.delta?.startsWith("+") ? "up" : "down";

  return (
    <article hub-stat-card>
      <p hub-stat-label>{props.label}</p>
      <p hub-stat-value style={{ color: props.accent ?? HUB_COLORS.ink }}>{props.value}</p>
      {props.delta ? (
        <p hub-stat-delta data-trend={trend}>
          {props.delta} vs last quarter
        </p>
      ) : null}
    </article>
  );
}
