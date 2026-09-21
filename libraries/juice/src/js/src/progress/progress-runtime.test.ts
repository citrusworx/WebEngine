// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createProgress,
  initProgress,
  startProgressRuntime,
  stopProgressRuntime,
} from './progress-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const ratioOf = (element: HTMLElement | null) =>
  element?.style.getPropertyValue('--juice-progress-ratio').trim();

afterEach(() => {
  stopProgressRuntime();
  resetDom();
});

describe('createProgress', () => {
  it('syncs a determinate progressbar and does not invent a name or valuetext', () => {
    document.body.innerHTML = `
      <div progress id="upload">
        <span progress-fill id="upload-fill"></span>
        <span progress-label id="upload-label">Uploading</span>
      </div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const host = document.getElementById('upload');
    const fill = document.getElementById('upload-fill');
    const label = document.getElementById('upload-label');

    expect(host?.getAttribute('role')).toBe('progressbar');
    expect(host?.hasAttribute('tabindex')).toBe(false);
    expect(host?.getAttribute('aria-valuemin')).toBe('0');
    expect(host?.getAttribute('aria-valuemax')).toBe('100');
    expect(host?.getAttribute('aria-valuenow')).toBe('0');
    expect(host?.hasAttribute('aria-valuetext')).toBe(false);
    expect(host?.hasAttribute('aria-label')).toBe(false);
    expect(host?.getAttribute('progress')).toBe('');
    expect(ratioOf(host)).toBe('0');
    expect(controller.getValue(host)).toBe(0);
    expect(controller.isIndeterminate(host)).toBe(false);
    expect(fill?.getAttribute('role')).toBeNull();
    expect(label?.textContent).toBe('Uploading');
    expect(label?.hasAttribute('aria-hidden')).toBe(false);

    controller.destroy();
  });

  it('keeps author bounds and valuetext, and setValue updates the ratio', () => {
    document.body.innerHTML = `
      <div progress id="temp" aria-valuemin="10" aria-valuemax="30" aria-valuenow="20" aria-valuetext="20 degrees" aria-label="Temperature">
        <span progress-fill></span>
      </div>
    `;
    stopProgressRuntime();

    const controller = initProgress({ root: document.body });
    const host = document.getElementById('temp');

    expect(host?.getAttribute('role')).toBe('progressbar');
    expect(host?.getAttribute('aria-valuemin')).toBe('10');
    expect(host?.getAttribute('aria-valuemax')).toBe('30');
    expect(host?.getAttribute('aria-valuenow')).toBe('20');
    expect(host?.getAttribute('aria-valuetext')).toBe('20 degrees');
    expect(host?.getAttribute('aria-label')).toBe('Temperature');
    expect(ratioOf(host)).toBe('0.5');
    expect(controller.getValue(host)).toBe(20);

    controller.setValue(12.5, host);
    expect(host?.getAttribute('aria-valuenow')).toBe('12.5');
    expect(host?.getAttribute('aria-valuetext')).toBe('20 degrees');
    expect(ratioOf(host)).toBe('0.125');
    expect(controller.getValue()).toBe(12.5);

    controller.destroy();
  });

  it('clamps to the range and treats a missing value as an empty determinate bar', () => {
    document.body.innerHTML = `
      <div progress id="high" aria-valuenow="150"></div>
      <div progress id="low" aria-valuenow="-4"></div>
      <div progress id="empty"></div>
      <div progress id="text" aria-valuenow="soon"></div>
      <div progress id="collapsed" aria-valuemin="10" aria-valuemax="4" aria-valuenow="8"></div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });

    expect(document.getElementById('high')?.getAttribute('aria-valuenow')).toBe(
      '100'
    );
    expect(ratioOf(document.getElementById('high'))).toBe('1');
    expect(document.getElementById('low')?.getAttribute('aria-valuenow')).toBe(
      '0'
    );
    expect(document.getElementById('empty')?.getAttribute('aria-valuenow')).toBe(
      '0'
    );
    expect(document.getElementById('empty')?.getAttribute('progress')).toBe('');
    expect(controller.isIndeterminate(document.getElementById('empty'))).toBe(
      false
    );
    expect(document.getElementById('text')?.getAttribute('aria-valuenow')).toBe(
      '0'
    );
    expect(document.getElementById('collapsed')?.getAttribute('aria-valuemax')).toBe(
      '10'
    );
    expect(document.getElementById('collapsed')?.getAttribute('aria-valuenow')).toBe(
      '10'
    );
    expect(ratioOf(document.getElementById('collapsed'))).toBe('0');

    controller.setValue(Number.NaN, document.getElementById('high'));
    controller.setValue(Number.POSITIVE_INFINITY, document.getElementById('high'));
    expect(document.getElementById('high')?.getAttribute('aria-valuenow')).toBe(
      '100'
    );

    controller.destroy();
  });

  it('writes a custom-range ratio the 0–100 attribute selectors do not cover', () => {
    document.body.innerHTML = `
      <div progress id="wide" aria-valuemin="0" aria-valuemax="200" aria-valuenow="50"></div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const host = document.getElementById('wide');

    expect(host?.getAttribute('aria-valuemax')).toBe('200');
    expect(ratioOf(host)).toBe('0.25');

    controller.setValue(200, host);
    expect(host?.getAttribute('aria-valuenow')).toBe('200');
    expect(ratioOf(host)).toBe('1');

    controller.destroy();
  });

  it('omits aria-valuenow while indeterminate and restores the value', () => {
    document.body.innerHTML = `
      <div progress id="job" aria-valuenow="40" aria-valuetext="40 percent" aria-label="Job">
        <span progress-fill></span>
        <span progress-label>40 percent</span>
      </div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const host = document.getElementById('job');

    controller.setIndeterminate(true, host);
    expect(host?.getAttribute('progress')).toBe('indeterminate');
    expect(host?.getAttribute('role')).toBe('progressbar');
    expect(host?.hasAttribute('aria-valuenow')).toBe(false);
    expect(host?.getAttribute('aria-valuemin')).toBe('0');
    expect(host?.getAttribute('aria-valuemax')).toBe('100');
    expect(host?.getAttribute('aria-valuetext')).toBe('40 percent');
    expect(host?.getAttribute('aria-label')).toBe('Job');
    expect(controller.isIndeterminate(host)).toBe(true);
    expect(controller.getValue(host)).toBe(40);
    expect(ratioOf(host)).toBe('0.4');

    controller.setValue(55, host);
    expect(host?.hasAttribute('aria-valuenow')).toBe(false);
    expect(host?.getAttribute('progress')).toBe('indeterminate');
    expect(controller.getValue(host)).toBe(55);
    expect(ratioOf(host)).toBe('0.55');
    expect(host?.getAttribute('aria-valuetext')).toBe('40 percent');

    controller.setIndeterminate(false, host);
    expect(host?.getAttribute('progress')).toBe('');
    expect(host?.getAttribute('aria-valuenow')).toBe('55');
    expect(ratioOf(host)).toBe('0.55');
    expect(controller.isIndeterminate()).toBe(false);

    controller.destroy();
  });

  it('drops a stale aria-valuenow on indeterminate markup and keeps other bars', () => {
    document.body.innerHTML = `
      <div progress="indeterminate" id="busy" aria-valuenow="40" aria-valuemin="0" aria-valuemax="80"></div>
      <div progress id="other" aria-valuenow="10"></div>
      <div id="plain" role="progressbar" aria-valuenow="70"></div>
      <progress id="native" value="40" max="80"></progress>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const busy = document.getElementById('busy');
    const other = document.getElementById('other');
    const plain = document.getElementById('plain');
    const native = document.getElementById('native') as HTMLProgressElement;

    expect(busy?.getAttribute('role')).toBe('progressbar');
    expect(busy?.hasAttribute('aria-valuenow')).toBe(false);
    expect(busy?.getAttribute('progress')).toBe('indeterminate');
    expect(busy?.getAttribute('aria-valuemax')).toBe('80');
    expect(controller.getValue(busy)).toBe(40);
    expect(ratioOf(busy)).toBe('0.5');
    expect(controller.isIndeterminate(busy)).toBe(true);

    expect(other?.getAttribute('aria-valuenow')).toBe('10');
    controller.setValue(3, busy);
    expect(other?.getAttribute('aria-valuenow')).toBe('10');
    expect(busy?.hasAttribute('aria-valuenow')).toBe(false);

    expect(plain?.getAttribute('aria-valuenow')).toBe('70');
    expect(plain?.getAttribute('role')).toBe('progressbar');
    expect(native.hasAttribute('role')).toBe(false);
    expect(native.hasAttribute('aria-valuenow')).toBe(false);
    expect(native.value).toBe(40);

    controller.destroy();
  });

  it('does not read native value or max when the attribute is also present', () => {
    document.body.innerHTML = `
      <progress progress id="native" value="40" max="80"></progress>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const native = document.getElementById('native') as HTMLProgressElement;

    expect(native.getAttribute('role')).toBe('progressbar');
    expect(native.getAttribute('aria-valuemin')).toBe('0');
    expect(native.getAttribute('aria-valuemax')).toBe('100');
    expect(native.getAttribute('aria-valuenow')).toBe('0');
    expect(native.value).toBe(40);
    expect(native.max).toBe(80);
    expect(ratioOf(native)).toBe('0');

    controller.destroy();
  });

  it('replaces a non-progressbar role and leaves an unknown progress value determinate', () => {
    document.body.innerHTML = `
      <div progress="busy" id="busy" role="meter" aria-valuenow="25"></div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const host = document.getElementById('busy');

    expect(host?.getAttribute('role')).toBe('progressbar');
    expect(host?.getAttribute('progress')).toBe('busy');
    expect(host?.getAttribute('aria-valuenow')).toBe('25');
    expect(controller.isIndeterminate(host)).toBe(false);
    expect(ratioOf(host)).toBe('0.25');

    controller.destroy();
  });

  it('follows attribute edits for value, bounds, and the indeterminate flag', async () => {
    document.body.innerHTML = `
      <div progress id="live" aria-valuenow="10"></div>
    `;
    stopProgressRuntime();

    const controller = createProgress({ root: document.body });
    const host = document.getElementById('live');

    host?.setAttribute('aria-valuenow', '25');
    await flushRuntime();
    expect(host?.getAttribute('aria-valuenow')).toBe('25');
    expect(ratioOf(host)).toBe('0.25');

    host?.setAttribute('aria-valuemax', '50');
    await flushRuntime();
    expect(host?.getAttribute('aria-valuemax')).toBe('50');
    expect(ratioOf(host)).toBe('0.5');

    host?.setAttribute('progress', 'indeterminate');
    await flushRuntime();
    expect(host?.hasAttribute('aria-valuenow')).toBe(false);
    expect(controller.getValue(host)).toBe(25);
    expect(controller.isIndeterminate(host)).toBe(true);

    host?.setAttribute('aria-valuenow', '10');
    await flushRuntime();
    expect(host?.hasAttribute('aria-valuenow')).toBe(false);
    expect(controller.getValue(host)).toBe(10);

    host?.setAttribute('progress', '');
    await flushRuntime();
    expect(host?.getAttribute('aria-valuenow')).toBe('10');
    expect(ratioOf(host)).toBe('0.2');

    host?.setAttribute('role', 'meter');
    await flushRuntime();
    expect(host?.getAttribute('role')).toBe('progressbar');

    controller.destroy();
  });

  it('syncs a bar rendered after init and ignores markup after destroy', async () => {
    stopProgressRuntime();
    const controller = createProgress({ root: document.body });

    document.body.innerHTML = `
      <div progress id="late" aria-valuenow="60"></div>
    `;
    await flushRuntime();

    const late = document.getElementById('late');
    expect(late?.getAttribute('role')).toBe('progressbar');
    expect(late?.getAttribute('aria-valuenow')).toBe('60');
    expect(ratioOf(late)).toBe('0.6');

    controller.destroy();
    document.body.innerHTML = `
      <div progress id="after" aria-valuenow="60"></div>
    `;
    await flushRuntime();

    const after = document.getElementById('after');
    expect(after?.hasAttribute('role')).toBe(false);
    expect(after?.getAttribute('aria-valuenow')).toBe('60');
    expect(ratioOf(after)).toBe('');
  });

  it('stays inside its root and does not move the value from the keyboard', () => {
    document.body.innerHTML = `
      <div id="scope">
        <div progress id="inside" aria-valuenow="5"></div>
      </div>
      <div progress id="outside" aria-valuenow="5"></div>
    `;
    stopProgressRuntime();

    const scope = document.getElementById('scope');
    const controller = createProgress({ root: scope ?? document.body });
    const inside = document.getElementById('inside');
    const outside = document.getElementById('outside');

    expect(inside?.getAttribute('role')).toBe('progressbar');
    expect(outside?.hasAttribute('role')).toBe(false);
    expect(outside?.getAttribute('aria-valuemin')).toBeNull();

    inside?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(inside?.getAttribute('aria-valuenow')).toBe('5');
    expect(controller.getValue(inside)).toBe(5);

    controller.setValue(9);
    expect(inside?.getAttribute('aria-valuenow')).toBe('9');
    expect(outside?.getAttribute('aria-valuenow')).toBe('5');

    controller.destroy();
  });
});

describe('startProgressRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <div progress id="auto" aria-valuenow="15"></div>
    `;
    stopProgressRuntime();

    const first = startProgressRuntime();
    const second = startProgressRuntime();
    const host = document.getElementById('auto');

    expect(first).toBe(second);
    expect(host?.getAttribute('role')).toBe('progressbar');
    expect(host?.getAttribute('aria-valuenow')).toBe('15');
    expect(ratioOf(host)).toBe('0.15');
  });

  it('does not auto-start on DOMContentLoaded after stopProgressRuntime', async () => {
    stopProgressRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./progress-runtime.js');
    document.body.innerHTML = `
      <div progress id="held" aria-valuenow="15"></div>
    `;
    mod.stopProgressRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('held')?.hasAttribute('role')).toBe(false);
    expect(document.getElementById('held')?.hasAttribute('aria-valuemin')).toBe(
      false
    );

    mod.startProgressRuntime();
    expect(document.getElementById('held')?.getAttribute('role')).toBe(
      'progressbar'
    );
    expect(document.getElementById('held')?.getAttribute('aria-valuenow')).toBe(
      '15'
    );
    mod.stopProgressRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
