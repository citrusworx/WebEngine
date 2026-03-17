document.addEventListener('DOMContentLoaded', () => {
  const boldButton = document.getElementById('boldButton');
  const italicButton = document.getElementById('italicButton');
  const underlineButton = document.getElementById('underlineButton');

  const justLeftButton = document.getElementById('justLeftButton');
  const justCenterButton = document.getElementById('justCenterButton');

  const fontColorPicker = document.getElementById('font-color');
  const highlightPicker = document.getElementById('highlight-color');

  const textEditor = document.getElementById('text-editor');

  function applyStyleToSelection(tag, className = '', inlineStyles = {}) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tag);

    if (className) wrapper.className = className;
    Object.assign(wrapper.style, inlineStyles);

    // If no selection, insert styled placeholder
    if (range.collapsed) {
      wrapper.textContent = '\u200B';
      range.insertNode(wrapper);
      selection.removeAllRanges();

      const newRange = document.createRange();
      newRange.setStart(wrapper.firstChild, 1);
      selection.addRange(newRange);
      return;
    }

    const extracted = range.extractContents();
    wrapper.appendChild(extracted);
    range.insertNode(wrapper);

    selection.removeAllRanges();
  }

  boldButton?.addEventListener('click', () =>
    applyStyleToSelection('span', 'font-bold')
  );

  italicButton?.addEventListener('click', () =>
    applyStyleToSelection('span', 'italic')
  );

  underlineButton?.addEventListener('click', () =>
    applyStyleToSelection('span', 'underline')
  );

  justLeftButton?.addEventListener('click', () => {
    textEditor.style.textAlign = 'left';
  });

  justCenterButton?.addEventListener('click', () => {
    textEditor.style.textAlign = 'center';
  });

  fontColorPicker?.addEventListener('input', e =>
    applyStyleToSelection('span', '', { color: e.target.value })
  );

  highlightPicker?.addEventListener('input', e =>
    applyStyleToSelection('span', '', {
      backgroundColor: e.target.value
    })
  );
});
