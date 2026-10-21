/**
 * DOM-first runtime for Juice avatar chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [avatar]              host. Any value, including "square" and
 *                         "round", is still an avatar. Sync does not
 *                         rewrite the attribute. [scale] and [status]
 *                         stay CSS. There is no <avatar> element.
 *   [avatar-more]         overflow chip. Slice A does not stack an
 *                         <img> inside it (only [avatar] img is
 *                         positioned), so this runtime does not manage
 *                         [avatar-more]. A "+N" chip stays text.
 *   [avatar-group]        overlapping row. Not a host. Each [avatar]
 *                         inside it is evaluated on its own image.
 *   child <img>           optional photo, stacked above initials by
 *                         CSS. Authors own the accessible name. This
 *                         runtime does not read or write alt,
 *                         aria-label, aria-labelledby, title, or the
 *                         initials text, and it does not invent initials.
 *
 * Sync (markup-driven):
 *   1. No <img> in the avatar: initials. State is loaded false,
 *      fallback false, hasImage false. A stale [fallback] is removed
 *      so the attribute matches that state.
 *   2. An <img> with no src and no srcset, or with a blank one, cannot
 *      load. Set [fallback] on the avatar and hide that img.
 *   3. An <img> that has already finished (img.complete) with
 *      naturalWidth === 0 is broken, including one that errored before
 *      this runtime started. Same fallback. naturalWidth > 0 is loaded:
 *      clear [fallback] and unhide an img this runtime hid.
 *   4. Otherwise the image is still loading. Leave it visible, leave
 *      [fallback] off, and wait for load or error. hasImage is true so
 *      a pending photo is not the same state as initials.
 *   5. load clears fallback for that image. error sets it. src and
 *      srcset changes drop the previous verdict and are classified
 *      again. Images added or removed later are picked up by a
 *      MutationObserver. Several images: a broken one stays hidden,
 *      and the avatar is in fallback only when none is loaded and
 *      none is still loading.
 *
 * The img is hidden with the hidden attribute (not a CSS rule). Avatar
 * CSS does not set display on the photo, and the UA stylesheet hides
 * [hidden] with !important. hidden is removed only when this runtime
 * set it, so an author-hidden photo is left alone.
 *
 * State is { loaded, fallback, hasImage }. The first observation is
 * recorded and does not dispatch. Later changes dispatch a bubbling
 * juice:change CustomEvent with detail { runtime: "avatar", state }.
 *
 * destroy drops listeners and the observer. It does not remove
 * [fallback] or unhide the img. Clearing those would paint a broken
 * photo over the initials again. The last visual decision stays; this
 * runtime simply stops updating it.
 *
 * No Sig Avatar factory.
 */
export type AvatarOptions = {
    root?: ParentNode;
    avatarSelector?: string;
};
export type AvatarState = {
    loaded: boolean;
    fallback: boolean;
    hasImage: boolean;
};
export type AvatarController = {
    destroy: () => void;
    sync: () => void;
    getState: (target?: HTMLElement | null) => AvatarState | null;
};
export declare const createAvatar: (options?: AvatarOptions) => AvatarController;
export declare const initAvatar: (options?: AvatarOptions) => AvatarController;
export declare const startAvatarRuntime: () => AvatarController | null;
export declare const stopAvatarRuntime: () => void;
