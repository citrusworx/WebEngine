import { HUB_COLORS } from "../../data/hub";

export function ScoreRing(props: { score: number; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (props.score / 100) * circumference;

  return (
    <div hub-score-ring>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke={HUB_COLORS.muted} strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={props.color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span hub-score-value>{String(props.score)}</span>
    </div>
  );
}
