import { useRef, useState } from 'react';

const PEEK_PX = 124; // keep in sync with --peek in styles.css
const FULL_GAP = 8; // strip of map left visible above the full sheet
const ORDER = ['peek', 'half', 'full'];

/**
 * Draggable bottom sheet with three snap points: peek / half / full.
 *
 * - `header`  : always visible, and the drag target (handle + title)
 * - `toolbar` : always visible under the header, NOT draggable (so its buttons keep working)
 * - children  : scrollable content, hidden while peeking
 *
 * Only the header is draggable, so scrolling the content and panning the map
 * never fight with the sheet.
 */
export default function BottomSheet({ snap, onSnapChange, header, toolbar, children }) {
  const sheetRef = useRef(null);
  const drag = useRef(null);
  const [dragHeight, setDragHeight] = useState(null);

  const snapHeights = () => {
    const parent = sheetRef.current.parentElement.clientHeight;
    return { peek: PEEK_PX, half: Math.round(parent * 0.5), full: parent - FULL_GAP };
  };

  function cycle() {
    // tap: peek -> half -> peek, full -> half
    onSnapChange(snap === 'half' ? 'peek' : 'half');
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const heights = snapHeights();
    drag.current = {
      startY: e.clientY,
      startH: sheetRef.current.offsetHeight,
      heights,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0, // px/ms, positive = moving up
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (d.lastY - e.clientY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    const h = Math.min(d.heights.full, Math.max(d.heights.peek, d.startH + dy));
    setDragHeight(h);
  }

  function onPointerUp(e) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!d.moved) {
      setDragHeight(null);
      cycle();
      return;
    }
    // project where a flick would land, then pick the nearest snap point
    const projected = (dragHeight ?? d.startH) + d.velocity * 180;
    let best = 'peek';
    for (const key of ORDER) {
      if (Math.abs(d.heights[key] - projected) < Math.abs(d.heights[best] - projected)) best = key;
    }
    setDragHeight(null);
    onSnapChange(best);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycle();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onSnapChange(snap === 'peek' ? 'half' : 'full');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSnapChange(snap === 'full' ? 'half' : 'peek');
    }
  }

  return (
    <section
      ref={sheetRef}
      className={`fpe-sheet${dragHeight != null ? ' is-dragging' : ''}`}
      data-snap={snap}
      style={dragHeight != null ? { height: dragHeight } : undefined}
    >
      <div
        className="fpe-sheet__grab"
        role="button"
        tabIndex={0}
        aria-label={snap === 'peek' ? 'Expand panel' : 'Collapse panel'}
        aria-expanded={snap !== 'peek'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="fpe-sheet__handle" aria-hidden="true" />
        {header}
      </div>
      <div className="fpe-sheet__toolbar">{toolbar}</div>
      <div className="fpe-body">{children}</div>
    </section>
  );
}
