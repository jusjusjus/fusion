/**
 * 2D screen-space crosshair overlay centered on the scene canvas.
 * Rendered as an HTML element (not a 3D object) so it always stays
 * at the center regardless of camera movement.
 * Visible only when `active` is true.
 */
export default function InjectionMarker({ active }) {
  if (!active) return null;
  return (
    <div className="crosshair" aria-hidden="true">
      <div className="crosshair-h" />
      <div className="crosshair-v" />
      <div className="crosshair-dot" />
    </div>
  );
}
