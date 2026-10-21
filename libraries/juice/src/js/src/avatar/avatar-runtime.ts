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

import { createJuiceChanges } from '../shared/change.js';
import { createEventClaim } from '../shared/events.js';

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

const DEFAULT_ROOT: ParentNode =
  typeof document !== 'undefined' ? document : ({} as ParentNode);

const DEFAULTS: Required<AvatarOptions> = {
  root: DEFAULT_ROOT,
  avatarSelector: '[avatar]',
};

const asArray = <T extends Element>(nodes: ArrayLike<T>): T[] =>
  Array.from(nodes);

const claimEvent = createEventClaim();

// Shared across the auto runtime and a custom-root controller so they
// do not undo each other's fallback. Same idea as createEventClaim.
const runtimeHidden = new WeakSet<HTMLImageElement>();
const verdict = new WeakMap<HTMLImageElement, 'loaded' | 'broken'>();
const seenSource = new WeakMap<HTMLImageElement, string>();

const sourceKey = (img: HTMLImageElement) =>
  `${img.getAttribute('src') ?? ''}\u0000${img.getAttribute('srcset') ?? ''}`;

const hasText = (value: string | null) =>
  value !== null && value.trim() !== '';

const hasUsableSource = (img: HTMLImageElement) =>
  hasText(img.getAttribute('src')) || hasText(img.getAttribute('srcset'));

const syncSource = (img: HTMLImageElement) => {
  const key = sourceKey(img);
  const previous = seenSource.get(img);
  if (previous === key) return;
  seenSource.set(img, key);
  if (previous !== undefined) verdict.delete(img);
};

type ImageOutcome = 'empty' | 'broken' | 'loaded' | 'pending';

const classify = (img: HTMLImageElement): ImageOutcome => {
  syncSource(img);
  if (!hasUsableSource(img)) return 'empty';

  const forced = verdict.get(img);
  if (forced === 'loaded') return 'loaded';
  if (forced === 'broken') return 'broken';

  if (img.complete) {
    if (img.naturalWidth > 0) return 'loaded';
    return 'broken';
  }

  return 'pending';
};

const hideImage = (img: HTMLImageElement) => {
  if (!img.hasAttribute('hidden')) {
    img.setAttribute('hidden', '');
    runtimeHidden.add(img);
  }
};

const showImage = (img: HTMLImageElement) => {
  if (!runtimeHidden.has(img)) return;
  img.removeAttribute('hidden');
  runtimeHidden.delete(img);
};

const noopController = (): AvatarController => ({
  destroy: () => {},
  sync: () => {},
  getState: () => null,
});

export const createAvatar = (
  options: AvatarOptions = {}
): AvatarController => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noopController();
  }

  const settings = { ...DEFAULTS, ...options };
  const root = settings.root ?? document;
  const rootEvents = root as ParentNode & EventTarget;
  const changes = createJuiceChanges<AvatarState>('avatar');
  let destroyed = false;

  const isManaged = (element: HTMLElement | null | undefined) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.matches(settings.avatarSelector)) return false;
    if (root instanceof Document) return true;
    if (root instanceof Node) return root === element || root.contains(element);
    return false;
  };

  const getAvatars = () => {
    const found = asArray(
      root.querySelectorAll<HTMLElement>(settings.avatarSelector)
    ).filter(isManaged);

    if (root instanceof HTMLElement && isManaged(root)) {
      return [root, ...found.filter((host) => host !== root)];
    }

    return found;
  };

  const imagesOf = (host: HTMLElement) =>
    asArray(host.querySelectorAll<HTMLImageElement>('img')).filter((img) => {
      const owner = img.closest(settings.avatarSelector);
      return owner === host;
    });

  const resolveAvatar = (target?: HTMLElement | null) => {
    if (target) {
      if (isManaged(target)) return target;
      const containing = target.closest(settings.avatarSelector);
      if (containing instanceof HTMLElement && isManaged(containing)) {
        return containing;
      }
      return null;
    }

    return getAvatars()[0] ?? null;
  };

  const readState = (host: HTMLElement): AvatarState => {
    const images = imagesOf(host);
    if (images.length === 0) {
      return { loaded: false, fallback: false, hasImage: false };
    }

    let loaded = false;
    let pending = false;
    images.forEach((img) => {
      const outcome = classify(img);
      if (outcome === 'loaded') loaded = true;
      else if (outcome === 'pending') pending = true;
    });

    return {
      loaded,
      fallback: !loaded && !pending,
      hasImage: true,
    };
  };

  const writeFallback = (host: HTMLElement, fallback: boolean) => {
    if (fallback) {
      if (!host.hasAttribute('fallback')) host.setAttribute('fallback', '');
      return;
    }
    if (host.hasAttribute('fallback')) host.removeAttribute('fallback');
  };

  const publish = (host: HTMLElement) => {
    const images = imagesOf(host);
    images.forEach((img) => {
      const outcome = classify(img);
      if (outcome === 'broken' || outcome === 'empty') hideImage(img);
      else showImage(img);
    });

    const state = readState(host);
    writeFallback(host, state.fallback);
    changes.note(host, state);
  };

  const sync = () => {
    if (destroyed) return;
    getAvatars().forEach((host) => {
      if (!isManaged(host)) return;
      publish(host);
    });
  };

  const mark = (img: HTMLImageElement, next: 'loaded' | 'broken') => {
    syncSource(img);
    verdict.set(img, next);
  };

  const hostFromImage = (target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement)) return null;
    const host = target.closest(settings.avatarSelector);
    if (!(host instanceof HTMLElement) || !isManaged(host)) return null;
    return host;
  };

  const handleLoad = (event: Event) => {
    if (destroyed) return;
    const img = event.target;
    const host = hostFromImage(img);
    if (!host || !(img instanceof HTMLImageElement)) return;
    if (!claimEvent(event)) return;
    mark(img, 'loaded');
    publish(host);
  };

  const handleError = (event: Event) => {
    if (destroyed) return;
    const img = event.target;
    const host = hostFromImage(img);
    if (!host || !(img instanceof HTMLImageElement)) return;
    if (!claimEvent(event)) return;
    mark(img, 'broken');
    publish(host);
  };

  let syncScheduled = false;
  let syncFrame = 0;
  const scheduleSync = () => {
    if (syncScheduled || destroyed) return;
    syncScheduled = true;
    syncFrame = requestAnimationFrame(() => {
      syncScheduled = false;
      sync();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;

  rootEvents.addEventListener('load', handleLoad, true);
  rootEvents.addEventListener('error', handleError, true);

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['avatar', 'src', 'srcset', 'fallback', 'hidden'],
    });
  }

  sync();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (syncScheduled) {
        cancelAnimationFrame(syncFrame);
        syncScheduled = false;
      }
      rootEvents.removeEventListener('load', handleLoad, true);
      rootEvents.removeEventListener('error', handleError, true);
      observer?.disconnect();
    },
    sync,
    getState: (target) => {
      const host = resolveAvatar(target);
      if (!host) return null;
      return readState(host);
    },
  };
};

export const initAvatar = createAvatar;

let autoAvatarController: AvatarController | null = null;
let autoStartSuspended = false;
let bootOnReady: (() => void) | null = null;

const cancelDeferredAutoStart = () => {
  if (!bootOnReady || typeof document === 'undefined') return;
  document.removeEventListener('DOMContentLoaded', bootOnReady);
  bootOnReady = null;
};

export const startAvatarRuntime = (): AvatarController | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  autoStartSuspended = false;
  cancelDeferredAutoStart();

  if (autoAvatarController) {
    autoAvatarController.sync();
    return autoAvatarController;
  }

  autoAvatarController = createAvatar();
  return autoAvatarController;
};

export const stopAvatarRuntime = () => {
  autoStartSuspended = true;
  cancelDeferredAutoStart();
  autoAvatarController?.destroy();
  autoAvatarController = null;
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startAvatarRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startAvatarRuntime();
  }
}
