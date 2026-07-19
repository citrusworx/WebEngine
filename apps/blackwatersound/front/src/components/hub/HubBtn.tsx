export function HubBtn(props: {
  label: string;
  variant?: "primary" | "outline" | "ghost";
  onClick?: () => void;
}) {
  const variant = props.variant ?? "outline";

  return (
    <button type="button" hub-btn data-variant={variant} onClick={props.onClick}>
      {props.label}
    </button>
  );
}
