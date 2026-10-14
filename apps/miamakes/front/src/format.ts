export function formatMinutes(total: number): string {
  if (!Number.isFinite(total) || total <= 0) {
    return "—";
  }
  if (total < 60) {
    return `${total} min`;
  }
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function formatPair(prep: number, cook: number): string {
  return `Prep ${formatMinutes(prep)} · Cook ${formatMinutes(cook)}`;
}
