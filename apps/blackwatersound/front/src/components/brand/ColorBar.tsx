import { BRAND_STRIPE_COLORS } from "./brand";

export function ColorBar() {
  return (
    <div color-bar row>
      {BRAND_STRIPE_COLORS.map((tone) => (
        <span key={tone} color-segment data-tone={tone} />
      ))}
    </div>
  );
}
