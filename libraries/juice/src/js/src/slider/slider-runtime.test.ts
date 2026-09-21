// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSlider,
  initSlider,
  startSliderRuntime,
  stopSliderRuntime,
} from './slider-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const sliderMarkup = `
  <div slider id="volume">
    <div slider-fill></div>
    <div slider-thumb id="volume-thumb" aria-label="Volume"></div>
  </div>
`;

const box = (
  left: number,
  width: number,
  top = 0,
  height = 28
): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON() {
      return {};
    },
  }) as DOMRect;

const mockHorizontalBox = (
  element: HTMLElement,
  left: number,
  width: number
) => {
  element.getBoundingClientRect = () => box(left, width);
};

afterEach(() => {
  stopSliderRuntime();
  resetDom();
});

describe('createSlider', () => {
  it('syncs APG slider ARIA on the thumb and does not invent a name', () => {
    document.body.innerHTML = `
      <div slider id="volume">
        <div slider-fill id="volume-fill"></div>
        <div slider-thumb id="volume-thumb">Volume</div>
      </div>
      <div slider id="named">
        <span slider-thumb id="named-thumb" aria-label="Brightness"></span>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const host = document.getElementById('volume');
    const thumb = document.getElementById('volume-thumb');
    const fill = document.getElementById('volume-fill');
    const named = document.getElementById('named-thumb');

    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('tabindex')).toBe('0');
    expect(thumb?.getAttribute('aria-valuemin')).toBe('0');
    expect(thumb?.getAttribute('aria-valuemax')).toBe('100');
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(thumb?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(thumb?.hasAttribute('aria-label')).toBe(false);
    expect(thumb?.hasAttribute('aria-valuetext')).toBe(false);
    expect(thumb?.textContent?.trim()).toBe('Volume');
    expect(host?.getAttribute('role')).toBeNull();
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0'
    );
    expect(fill?.getAttribute('role')).toBeNull();

    expect(named?.getAttribute('role')).toBe('slider');
    expect(named?.getAttribute('aria-label')).toBe('Brightness');
    expect(named?.hasAttribute('aria-valuetext')).toBe(false);

    controller.destroy();
  });

  it('keeps author bounds, valuetext, and a horizontal host', () => {
    document.body.innerHTML = `
      <div slider="horizontal" id="temp" aria-valuemin="10" aria-valuemax="30" aria-valuenow="20">
        <button slider-thumb id="temp-thumb" aria-valuetext="20 degrees" aria-label="Temperature"></button>
      </div>
    `;
    stopSliderRuntime();

    const controller = initSlider({ root: document.body });
    const host = document.getElementById('temp');
    const thumb = document.getElementById('temp-thumb');

    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('type')).toBe('button');
    expect(thumb?.hasAttribute('tabindex')).toBe(false);
    expect(thumb?.getAttribute('aria-valuemin')).toBe('10');
    expect(thumb?.getAttribute('aria-valuemax')).toBe('30');
    expect(thumb?.getAttribute('aria-valuenow')).toBe('20');
    expect(thumb?.getAttribute('aria-valuetext')).toBe('20 degrees');
    expect(thumb?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.5'
    );
    expect(controller.getValue(host)).toBe(20);

    controller.setValue(12.5, thumb);
    expect(thumb?.getAttribute('aria-valuenow')).toBe('12.5');
    expect(thumb?.getAttribute('aria-valuetext')).toBe('20 degrees');
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.125'
    );

    controller.destroy();
  });

  it('lets thumb values win over the host and clamps to the range', () => {
    document.body.innerHTML = `
      <div slider id="mixed" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80">
        <span slider-thumb id="mixed-thumb" aria-valuenow="20" aria-label="Mix"></span>
      </div>
      <div slider id="high">
        <span slider-thumb id="high-thumb" aria-valuenow="150" aria-label="High"></span>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const mixedHost = document.getElementById('mixed');
    const mixedThumb = document.getElementById('mixed-thumb');
    const highThumb = document.getElementById('high-thumb');

    expect(mixedHost?.getAttribute('role')).toBeNull();
    expect(mixedThumb?.getAttribute('aria-valuenow')).toBe('20');
    expect(
      mixedHost?.style.getPropertyValue('--juice-slider-ratio').trim()
    ).toBe('0.2');
    expect(highThumb?.getAttribute('aria-valuenow')).toBe('100');
    expect(controller.getValue(highThumb)).toBe(100);

    controller.destroy();
  });

  it('steps with arrows, pages, home, and end without passing the ends', () => {
    document.body.innerHTML = sliderMarkup;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const thumb = document.getElementById('volume-thumb');
    const host = document.getElementById('volume');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('1');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('2');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('1');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'PageUp' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('10');
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.1'
    );

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'PageDown' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('100');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'PageUp' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('100');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Home' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(controller.getValue(thumb)).toBe(0);

    controller.destroy();
  });

  it('does not change the value on Escape, Enter, or Space', () => {
    document.body.innerHTML = `
      <div slider id="volume">
        <div slider-thumb id="volume-thumb" aria-valuenow="40" aria-label="Volume"></div>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const thumb = document.getElementById('volume-thumb');

    for (const key of ['Escape', 'Enter', ' ']) {
      thumb?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key })
      );
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key })
      );
    }

    expect(thumb?.getAttribute('aria-valuenow')).toBe('40');

    controller.destroy();
  });

  it('jumps on track pointerdown and follows a drag', () => {
    document.body.innerHTML = sliderMarkup;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const host = document.getElementById('volume');
    const thumb = document.getElementById('volume-thumb');
    if (!host || !thumb) throw new Error('missing slider fixture');

    mockHorizontalBox(host, 0, 100);
    mockHorizontalBox(thumb, 0, 0);

    host.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: 25,
      })
    );
    expect(thumb.getAttribute('aria-valuenow')).toBe('25');
    expect(host.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.25'
    );
    expect(document.activeElement).toBe(thumb);

    host.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 1,
        clientX: 80,
      })
    );
    expect(thumb.getAttribute('aria-valuenow')).toBe('80');

    host.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        clientX: 80,
      })
    );
    host.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 1,
        clientX: 10,
      })
    );
    expect(thumb.getAttribute('aria-valuenow')).toBe('80');

    controller.destroy();
  });

  it('maps pointer position across the thumb travel inset', () => {
    document.body.innerHTML = sliderMarkup;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const host = document.getElementById('volume');
    const thumb = document.getElementById('volume-thumb');
    if (!host || !thumb) throw new Error('missing slider fixture');

    mockHorizontalBox(host, 10, 120);
    mockHorizontalBox(thumb, 10, 20);

    thumb.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerId: 4,
        clientX: 70,
      })
    );

    expect(thumb.getAttribute('aria-valuenow')).toBe('50');

    controller.destroy();
  });

  it('exposes setValue, getValue, increment, and decrement', () => {
    document.body.innerHTML = `
      ${sliderMarkup}
      <div slider id="other">
        <span slider-thumb id="other-thumb" aria-label="Other"></span>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const thumb = document.getElementById('volume-thumb');
    const other = document.getElementById('other-thumb');

    controller.setValue(42, thumb);
    expect(controller.getValue(thumb)).toBe(42);
    expect(thumb?.getAttribute('aria-valuenow')).toBe('42');

    controller.increment(thumb);
    expect(controller.getValue(thumb)).toBe(43);
    controller.decrement(thumb);
    expect(controller.getValue(thumb)).toBe(42);

    controller.setValue(1000, thumb);
    expect(controller.getValue(thumb)).toBe(100);
    controller.setValue(-4, thumb);
    expect(controller.getValue(thumb)).toBe(0);
    controller.setValue(Number.NaN, thumb);
    expect(controller.getValue(thumb)).toBe(0);

    expect(other?.getAttribute('aria-valuenow')).toBe('0');

    controller.destroy();
  });

  it('ignores disabled and aria-disabled hosts and thumbs', () => {
    document.body.innerHTML = `
      <div slider disabled id="native-host">
        <span slider-thumb id="native-thumb" aria-label="Native"></span>
      </div>
      <div slider id="aria-host">
        <button type="button" slider-thumb id="aria-thumb" aria-disabled="true" aria-label="ARIA"></button>
      </div>
      <div slider id="button-host">
        <button type="button" slider-thumb id="button-thumb" disabled aria-label="Button"></button>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const nativeThumb = document.getElementById('native-thumb');
    const nativeHost = document.getElementById('native-host');
    const ariaThumb = document.getElementById('aria-thumb');
    const buttonThumb = document.getElementById('button-thumb');
    const buttonHost = document.getElementById('button-host');
    if (!nativeHost || !buttonHost) throw new Error('missing slider fixture');

    mockHorizontalBox(nativeHost, 0, 100);
    mockHorizontalBox(buttonHost, 0, 100);

    nativeThumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    nativeHost.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerId: 2,
        clientX: 50,
      })
    );
    ariaThumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    controller.setValue(70, buttonThumb);
    controller.increment(nativeThumb);

    expect(nativeThumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(ariaThumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(buttonThumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(ariaThumb?.getAttribute('role')).toBe('slider');

    controller.destroy();
  });

  it('ignores orphan thumbs, vertical sliders, and hosts without a thumb', () => {
    document.body.innerHTML = `
      <span slider-thumb id="orphan" aria-label="Orphan"></span>
      <div slider="vertical" id="vertical">
        <span slider-thumb id="vertical-thumb" aria-label="Vertical"></span>
      </div>
      <div slider id="bare"></div>
      <input type="range" id="native-range" />
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });

    expect(document.getElementById('orphan')?.getAttribute('role')).toBeNull();
    expect(
      document.getElementById('vertical-thumb')?.getAttribute('role')
    ).toBeNull();
    expect(document.getElementById('bare')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('bare')?.style.getPropertyValue(
      '--juice-slider-ratio'
    )).toBe('');
    expect(document.getElementById('native-range')?.getAttribute('role')).toBe(
      null
    );

    document.getElementById('orphan')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(document.getElementById('orphan')?.getAttribute('aria-valuenow')).toBe(
      null
    );

    controller.destroy();
  });

  it('enhances only the first thumb owned by each slider', () => {
    document.body.innerHTML = `
      <div slider id="outer">
        <span slider-thumb id="outer-thumb" aria-label="Outer"></span>
        <span slider-thumb id="extra-thumb"></span>
        <div slider id="inner">
          <span slider-thumb id="inner-thumb" aria-label="Inner"></span>
        </div>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });

    expect(document.getElementById('outer-thumb')?.getAttribute('role')).toBe(
      'slider'
    );
    expect(document.getElementById('extra-thumb')?.getAttribute('role')).toBe(
      null
    );
    expect(document.getElementById('inner-thumb')?.getAttribute('role')).toBe(
      'slider'
    );

    document.getElementById('extra-thumb')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    expect(
      document.getElementById('outer-thumb')?.getAttribute('aria-valuenow')
    ).toBe('0');

    controller.destroy();
  });

  it('steps once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = sliderMarkup;
    startSliderRuntime();

    const controller = createSlider({ root: document.body });
    const thumb = document.getElementById('volume-thumb');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('1');

    controller.destroy();
  });

  it('stops handling after destroy', () => {
    document.body.innerHTML = sliderMarkup;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const thumb = document.getElementById('volume-thumb');

    controller.destroy();
    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');
  });

  it('syncs late-rendered slider markup', async () => {
    stopSliderRuntime();
    const controller = createSlider({ root: document.body });

    document.body.innerHTML = `
      <div slider id="late">
        <span slider-thumb id="late-thumb" aria-label="Late" aria-valuenow="15"></span>
      </div>
    `;

    await flushRuntime();

    const thumb = document.getElementById('late-thumb');
    const host = document.getElementById('late');
    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('aria-valuenow')).toBe('15');
    expect(thumb?.getAttribute('tabindex')).toBe('0');
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.15'
    );

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('16');

    controller.destroy();
  });

  it('writes a custom-range ratio the 0–100 attribute selectors do not cover', () => {
    document.body.innerHTML = `
      <div slider id="wide">
        <span slider-thumb id="wide-thumb" aria-valuemin="0" aria-valuemax="200" aria-valuenow="50" aria-label="Wide"></span>
      </div>
    `;
    stopSliderRuntime();

    const controller = createSlider({ root: document.body });
    const host = document.getElementById('wide');
    const thumb = document.getElementById('wide-thumb');

    expect(thumb?.getAttribute('aria-valuemax')).toBe('200');
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '0.25'
    );

    controller.setValue(200, host);
    expect(host?.style.getPropertyValue('--juice-slider-ratio').trim()).toBe(
      '1'
    );

    controller.destroy();
  });
});

describe('startSliderRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = sliderMarkup;
    stopSliderRuntime();

    const first = startSliderRuntime();
    const second = startSliderRuntime();
    const thumb = document.getElementById('volume-thumb');

    expect(first).toBe(second);
    expect(thumb?.getAttribute('role')).toBe('slider');
    expect(thumb?.getAttribute('aria-valuenow')).toBe('0');
    expect(thumb?.getAttribute('aria-orientation')).toBe('horizontal');

    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('1');
  });

  it('does not auto-start on DOMContentLoaded after stopSliderRuntime', async () => {
    stopSliderRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./slider-runtime.js');
    document.body.innerHTML = sliderMarkup;
    mod.stopSliderRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const thumb = document.getElementById('volume-thumb');
    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBeNull();

    mod.startSliderRuntime();
    thumb?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(thumb?.getAttribute('aria-valuenow')).toBe('1');
    mod.stopSliderRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
