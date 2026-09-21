/** WordPress REST `context=edit`. Required for `raw` title/content/excerpt fields. */
export const EDIT_CONTEXT = "edit";
/**
 * Merge `{ context: "edit" }` onto a WordPress REST query.
 *
 * Raw (`title.raw`, `content.raw`, `excerpt.raw`) only appears when WordPress
 * is asked for edit context on an **authenticated** request. Public
 * `getAll()` stays view-context by default — pass this helper explicitly.
 */
export function withEditContext(query) {
    return { ...(query ?? {}), context: EDIT_CONTEXT };
}
/** Same as {@link withEditContext}. */
export function editContextQuery(query) {
    return withEditContext(query);
}
//# sourceMappingURL=query.js.map