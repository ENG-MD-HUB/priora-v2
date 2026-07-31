// TextCell.jsx
// خلية نص مشتركة — حد سطرين عبر CSS class فقط (بدون inline style للـ clamp)
// + tooltip عند hover لو كان النص مقطوعاً.

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function TooltipPortal({ text, anchorRef }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ x: rect.left, y: rect.top });
  }, [anchorRef]);

  if (!pos) return null;
  return createPortal(
    <div
      className="priora-tooltip"
      style={{ left: pos.x, top: pos.y - 6, transform: 'translateY(-100%)' }}
    >
      {text}
    </div>,
    document.body
  );
}

// عمود Name
export function TextCell({ text, html, style = {} }) {
  const [showTip, setShowTip] = useState(false);
  const ref = useRef(null);

  function handleMouseEnter() {
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight + 2) setShowTip(true);
  }

  return (
    <>
      <div
        ref={ref}
        // الـ clamp يأتي من CSS class فقط — inline style لا يتدخل في display/overflow
        className="task-name-text"
        style={style}
        dangerouslySetInnerHTML={html ? { __html: html } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTip(false)}
      >
        {!html ? text : undefined}
      </div>
      {showTip && <TooltipPortal text={text || ref.current?.textContent || ''} anchorRef={ref} />}
    </>
  );
}

// عمود Last Action
export function NoteCell({ text, html, style = {} }) {
  const [showTip, setShowTip] = useState(false);
  const ref = useRef(null);

  function handleMouseEnter() {
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight + 2) setShowTip(true);
  }

  return (
    <>
      <div
        ref={ref}
        className="task-note-text"
        style={style}
        dangerouslySetInnerHTML={html ? { __html: html } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTip(false)}
      >
        {!html ? text : undefined}
      </div>
      {showTip && <TooltipPortal text={text || ref.current?.textContent || ''} anchorRef={ref} />}
    </>
  );
}
