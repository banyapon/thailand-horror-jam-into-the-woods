import React, { useState, useRef, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  visible: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, visible }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (baseRef.current) {
        baseRef.current.setPointerCapture(e.pointerId);
        setIsDragging(true);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !baseRef.current || !stickRef.current) return;
    e.preventDefault();

    const baseRect = baseRef.current.getBoundingClientRect();
    const maxRadius = baseRect.width / 2;
    
    let deltaX = e.clientX - baseRect.left - maxRadius;
    let deltaY = e.clientY - baseRect.top - maxRadius;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    stickRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    onMove({
      x: deltaX / maxRadius,
      y: deltaY / maxRadius,
    });
  }, [isDragging, onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !stickRef.current || !baseRef.current) return;
    e.preventDefault();
    
    baseRef.current.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    stickRef.current.style.transform = 'translate(0, 0)';
    onMove({ x: 0, y: 0 });
  }, [isDragging, onMove]);


  if (!visible) return null;

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div ref={stickRef} className="joystick-stick" />
    </div>
  );
};
