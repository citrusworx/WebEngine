// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  createAvatar,
  initAvatar,
  startAvatarRuntime,
  stopAvatarRuntime,
} from './avatar-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

type ImageProbe = {
  complete: boolean;
  naturalWidth: number;
};

const defineImage = (img: HTMLImageElement, probe: ImageProbe) => {
  Object.defineProperty(img, 'complete', {
    configurable: true,
    get: () => probe.complete,
  });
  Object.defineProperty(img, 'naturalWidth', {
    configurable: true,
    get: () => probe.naturalWidth,
  });
};

const faceMarkup = `
  <span avatar="square" scale="sm" status="online" aria-label="Ada Lovelace" id="face">
    <span id="letters">AL</span>
    <img id="photo" alt="Ada Lovelace" src="ada.png">
  </span>
`;

afterEach(() => {
  stopAvatarRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createAvatar', () => {
  it('is the same function as initAvatar', () => {
    expect(initAvatar).toBe(createAvatar);
  });

  it('sets fallback and hides the image on error without renaming', () => {
    document.body.innerHTML = faceMarkup;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    const probe: ImageProbe = { complete: false, naturalWidth: 0 };
    defineImage(photo, probe);

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face');

    expect(face?.hasAttribute('fallback')).toBe(false);
    expect(photo.hasAttribute('hidden')).toBe(false);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: true,
    });

    photo.dispatchEvent(new Event('error'));

    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.hasAttribute('fallback')).toBe(false);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
    expect(face?.getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(face?.getAttribute('avatar')).toBe('square');
    expect(face?.getAttribute('scale')).toBe('sm');
    expect(face?.getAttribute('status')).toBe('online');
    expect(document.getElementById('letters')?.textContent).toBe('AL');
    expect(face?.hasAttribute('aria-hidden')).toBe(false);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });

    controller.destroy();
  });

  it('clears fallback when the image loads, including one that was already complete', () => {
    document.body.innerHTML = `
      <span avatar id="pending">AL<img id="pending-photo" alt="Ada" src="ada.png"></span>
      <span avatar id="ready">JL<img id="ready-photo" alt="Joan" src="joan.png"></span>
    `;
    stopAvatarRuntime();
    const pendingPhoto = document.getElementById('pending-photo') as HTMLImageElement;
    const readyPhoto = document.getElementById('ready-photo') as HTMLImageElement;
    defineImage(pendingPhoto, { complete: false, naturalWidth: 0 });
    defineImage(readyPhoto, { complete: true, naturalWidth: 32 });

    const controller = createAvatar({ root: document.body });
    const pending = document.getElementById('pending');
    const ready = document.getElementById('ready');

    expect(pending?.hasAttribute('fallback')).toBe(false);
    expect(ready?.hasAttribute('fallback')).toBe(false);
    expect(readyPhoto.hasAttribute('hidden')).toBe(false);
    expect(controller.getState(ready)).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });

    pendingPhoto.dispatchEvent(new Event('error'));
    expect(pending?.hasAttribute('fallback')).toBe(true);
    expect(pendingPhoto.hasAttribute('hidden')).toBe(true);

    pendingPhoto.dispatchEvent(new Event('load'));
    expect(pending?.hasAttribute('fallback')).toBe(false);
    expect(pendingPhoto.hasAttribute('hidden')).toBe(false);
    expect(pendingPhoto.getAttribute('alt')).toBe('Ada');
    expect(controller.getState(pending)).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });

    controller.destroy();
  });

  it('falls back on an empty src and waits when only srcset is pending', () => {
    document.body.innerHTML = `
      <span avatar id="missing">AL<img id="missing-photo" alt="Ada"></span>
      <span avatar id="blank">BL<img id="blank-photo" alt="Bea" src=""></span>
      <span avatar id="spaces">CL<img id="spaces-photo" alt="Cy" src="   " srcset="  "></span>
      <span avatar id="srcset">DL<img id="srcset-photo" alt="Di" srcset="di.png 1x"></span>
    `;
    stopAvatarRuntime();
    defineImage(document.getElementById('srcset-photo') as HTMLImageElement, {
      complete: false,
      naturalWidth: 0,
    });

    const controller = createAvatar({ root: document.body });

    for (const id of ['missing', 'blank', 'spaces']) {
      const host = document.getElementById(id);
      const img = host?.querySelector('img');
      expect(host?.hasAttribute('fallback')).toBe(true);
      expect(img?.hasAttribute('hidden')).toBe(true);
      expect(img?.getAttribute('alt')).not.toBe('');
      expect(controller.getState(host)).toEqual({
        loaded: false,
        fallback: true,
        hasImage: true,
      });
    }

    const srcset = document.getElementById('srcset');
    const srcsetPhoto = document.getElementById('srcset-photo');
    expect(srcset?.hasAttribute('fallback')).toBe(false);
    expect(srcsetPhoto?.hasAttribute('hidden')).toBe(false);
    expect(controller.getState(srcset)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: true,
    });

    controller.destroy();
  });

  it('treats an already broken image as fallback and does not dispatch', () => {
    document.body.innerHTML = faceMarkup;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    defineImage(photo, { complete: true, naturalWidth: 0 });

    const events: Event[] = [];
    const onChange = (event: Event) => events.push(event);
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face');

    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });
    expect(events).toHaveLength(0);

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    controller.destroy();
  });

  it('recovers when src changes and does not re-dispatch the same fallback', async () => {
    document.body.innerHTML = faceMarkup;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    const probe: ImageProbe = { complete: false, naturalWidth: 0 };
    defineImage(photo, probe);

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face')!;
    const events: Array<CustomEvent<{ runtime: string; state: unknown }>> = [];
    const onChange = (event: Event) => {
      events.push(event as CustomEvent<{ runtime: string; state: unknown }>);
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    photo.dispatchEvent(new Event('error'));
    expect(events).toHaveLength(1);
    expect(face.hasAttribute('fallback')).toBe(true);

    probe.complete = true;
    probe.naturalWidth = 0;
    photo.setAttribute('src', 'also-bad.png');
    await flushRuntime();
    expect(events).toHaveLength(1);
    expect(face.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);

    probe.complete = false;
    probe.naturalWidth = 0;
    photo.setAttribute('src', 'ada-ok.png');
    await flushRuntime();
    expect(events).toHaveLength(2);
    expect(face.hasAttribute('fallback')).toBe(false);
    expect(photo.hasAttribute('hidden')).toBe(false);
    expect(events[1]?.detail).toEqual({
      runtime: 'avatar',
      state: { loaded: false, fallback: false, hasImage: true },
    });

    photo.dispatchEvent(new Event('load'));
    expect(events).toHaveLength(3);
    expect(face.hasAttribute('fallback')).toBe(false);
    expect(photo.hasAttribute('hidden')).toBe(false);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
    expect(controller.getState(face)).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    controller.destroy();
  });

  it('evaluates an image added later and clears fallback when it is removed', async () => {
    document.body.innerHTML = `<span avatar id="face">AL</span>`;
    stopAvatarRuntime();

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face')!;
    const events: Event[] = [];
    document.body.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      events.push(event);
    });

    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: false,
    });
    expect(events).toHaveLength(0);

    const photo = document.createElement('img');
    photo.alt = 'Ada Lovelace';
    photo.src = 'ada.png';
    defineImage(photo, { complete: true, naturalWidth: 0 });
    face.append(photo);
    await flushRuntime();

    expect(face.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
    expect(face.textContent).toContain('AL');
    expect(events).toHaveLength(1);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });

    photo.remove();
    await flushRuntime();

    expect(face.hasAttribute('fallback')).toBe(false);
    expect(face.textContent).toContain('AL');
    expect(events).toHaveLength(2);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: false,
    });

    controller.destroy();
  });

  it('dispatches juice:change once per real change and reports getState', () => {
    document.body.innerHTML = `
      ${faceMarkup}
      <span avatar id="initials">JL</span>
      <div id="other">Nope</div>
    `;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    defineImage(photo, { complete: false, naturalWidth: 0 });

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face')!;
    const initials = document.getElementById('initials')!;
    const events: Array<CustomEvent<{ runtime: string; state: unknown }>> = [];
    const onChange = (event: Event) => {
      events.push(event as CustomEvent<{ runtime: string; state: unknown }>);
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    expect(events).toHaveLength(0);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: true,
    });
    expect(controller.getState(initials)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: false,
    });
    expect(controller.getState()).toEqual({
      loaded: false,
      fallback: false,
      hasImage: true,
    });
    expect(controller.getState(document.getElementById('other'))).toBeNull();

    photo.dispatchEvent(new Event('error'));
    photo.dispatchEvent(new Event('error'));
    expect(events).toHaveLength(1);
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.target).toBe(face);
    expect(events[0]?.detail).toEqual({
      runtime: 'avatar',
      state: { loaded: false, fallback: true, hasImage: true },
    });

    controller.sync();
    expect(events).toHaveLength(1);

    photo.dispatchEvent(new Event('load'));
    expect(events).toHaveLength(2);
    expect(events[1]?.detail).toEqual({
      runtime: 'avatar',
      state: { loaded: true, fallback: false, hasImage: true },
    });
    expect(controller.getState(photo)).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });

    photo.removeAttribute('src');
    controller.sync();
    expect(events).toHaveLength(3);
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    controller.destroy();
  });

  it('leaves initials and avatar-more alone', () => {
    document.body.innerHTML = `
      <span avatar id="initials" fallback>JL</span>
      <span avatar-more id="more"><img id="more-photo" alt="+2" src=""></span>
      <img id="stray" alt="Stray" src="">
      <span avatar-group id="group">
        <span avatar id="member">AL</span>
      </span>
    `;
    stopAvatarRuntime();

    const controller = createAvatar({ root: document.body });
    const initials = document.getElementById('initials');
    const more = document.getElementById('more');
    const morePhoto = document.getElementById('more-photo');
    const stray = document.getElementById('stray');
    const member = document.getElementById('member');

    expect(initials?.hasAttribute('fallback')).toBe(false);
    expect(initials?.textContent).toBe('JL');
    expect(controller.getState(initials)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: false,
    });
    expect(more?.hasAttribute('fallback')).toBe(false);
    expect(morePhoto?.hasAttribute('hidden')).toBe(false);
    expect(morePhoto?.getAttribute('alt')).toBe('+2');
    expect(controller.getState(more)).toBeNull();
    expect(stray?.hasAttribute('hidden')).toBe(false);
    expect(controller.getState(stray)).toBeNull();
    expect(controller.getState(member)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: false,
    });

    morePhoto?.dispatchEvent(new Event('error'));
    stray?.dispatchEvent(new Event('error'));
    expect(more?.hasAttribute('fallback')).toBe(false);
    expect(morePhoto?.hasAttribute('hidden')).toBe(false);
    expect(stray?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('keeps a nested avatar on its own image', () => {
    document.body.innerHTML = `
      <div avatar id="outer">
        OL
        <img id="outer-photo" alt="Outer" src="outer.png">
        <div avatar id="inner">
          IN
          <img id="inner-photo" alt="Inner" src="inner.png">
        </div>
      </div>
    `;
    stopAvatarRuntime();
    const outerPhoto = document.getElementById('outer-photo') as HTMLImageElement;
    const innerPhoto = document.getElementById('inner-photo') as HTMLImageElement;
    defineImage(outerPhoto, { complete: true, naturalWidth: 20 });
    defineImage(innerPhoto, { complete: true, naturalWidth: 0 });

    const controller = createAvatar({ root: document.body });

    expect(document.getElementById('outer')?.hasAttribute('fallback')).toBe(false);
    expect(outerPhoto.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('inner')?.hasAttribute('fallback')).toBe(true);
    expect(innerPhoto.hasAttribute('hidden')).toBe(true);
    expect(controller.getState(document.getElementById('outer'))?.loaded).toBe(true);
    expect(controller.getState(document.getElementById('inner'))).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });

    controller.destroy();
  });

  it('keeps the last fallback after destroy and ignores later images', async () => {
    document.body.innerHTML = faceMarkup;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    defineImage(photo, { complete: true, naturalWidth: 0 });

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face');

    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);

    controller.destroy();
    photo.dispatchEvent(new Event('load'));
    controller.sync();

    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
    expect(controller.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });

    document.body.insertAdjacentHTML(
      'beforeend',
      `<span avatar id="late">ZZ<img id="late-photo" alt="Zed" src="zed.png"></span>`
    );
    const latePhoto = document.getElementById('late-photo') as HTMLImageElement;
    defineImage(latePhoto, { complete: true, naturalWidth: 0 });
    await flushRuntime();

    expect(document.getElementById('late')?.hasAttribute('fallback')).toBe(false);
    expect(latePhoto.hasAttribute('hidden')).toBe(false);
    expect(latePhoto.getAttribute('alt')).toBe('Zed');
  });

  it('applies fallback once when a manual controller coexists with the auto runtime', async () => {
    document.body.innerHTML = faceMarkup;
    const photo = document.getElementById('photo') as HTMLImageElement;
    defineImage(photo, { complete: false, naturalWidth: 0 });
    startAvatarRuntime();

    const controller = createAvatar({ root: document.body });
    const face = document.getElementById('face');

    photo.dispatchEvent(new Event('error'));
    await flushRuntime();

    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(photo.hasAttribute('fallback')).toBe(false);
    expect(photo.getAttribute('alt')).toBe('Ada Lovelace');

    controller.destroy();
  });
});

describe('startAvatarRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = faceMarkup;
    stopAvatarRuntime();
    const photo = document.getElementById('photo') as HTMLImageElement;
    defineImage(photo, { complete: true, naturalWidth: 0 });

    const first = startAvatarRuntime();
    const second = startAvatarRuntime();
    const face = document.getElementById('face');

    expect(first).toBe(second);
    expect(face?.hasAttribute('fallback')).toBe(true);
    expect(photo.hasAttribute('hidden')).toBe(true);
    expect(second?.getState(face)).toEqual({
      loaded: false,
      fallback: true,
      hasImage: true,
    });
  });

  it('does not auto-start on DOMContentLoaded after stopAvatarRuntime', async () => {
    stopAvatarRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./avatar-runtime.js');
      document.body.innerHTML = faceMarkup;
      const photo = document.getElementById('photo') as HTMLImageElement;
      defineImage(photo, { complete: true, naturalWidth: 0 });
      mod.stopAvatarRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const face = document.getElementById('face');
      expect(face?.hasAttribute('fallback')).toBe(false);
      expect(photo.hasAttribute('hidden')).toBe(false);

      mod.startAvatarRuntime();
      expect(face?.hasAttribute('fallback')).toBe(true);
      expect(photo.hasAttribute('hidden')).toBe(true);
      expect(photo.getAttribute('alt')).toBe('Ada Lovelace');
      mod.stopAvatarRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
