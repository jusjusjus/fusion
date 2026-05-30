interface InjectionMarkerProps {
  active: boolean;
}

export default function InjectionMarker({ active }: InjectionMarkerProps) {
  if (!active) return null;
  return (
    <div className="crosshair" aria-hidden="true">
      <div className="crosshair-h" />
      <div className="crosshair-v" />
      <div className="crosshair-dot" />
    </div>
  );
}
