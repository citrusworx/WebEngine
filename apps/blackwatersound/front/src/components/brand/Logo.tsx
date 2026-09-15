export function Logo(props: { compact?: boolean }) {
  return (
    <div logo compact={props.compact ? true : undefined} stack>
      <span logo-wordmark>Blackwater Sound</span>
      <span logo-tag>Boutique tone, studio craft, signal-chain stories</span>
    </div>
  );
}
