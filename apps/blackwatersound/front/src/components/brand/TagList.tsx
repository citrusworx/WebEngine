export function TagList(props: {
  tags: readonly string[];
  limit?: number;
  inverse?: boolean;
}) {
  const tags = props.limit ? props.tags.slice(0, props.limit) : props.tags;

  return (
    <div tag-row row gap="0.45rem" data-tone={props.inverse ? "inverse" : undefined}>
      {tags.map((tag) => (
        <span key={tag} tag>{tag}</span>
      ))}
    </div>
  );
}
