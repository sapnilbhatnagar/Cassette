interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}

export default function Icon({ name, className = "", filled = false, style }: IconProps) {
  const mergedStyle: React.CSSProperties = {
    ...(filled ? { fontVariationSettings: "'FILL' 1" } : undefined),
    ...style,
  };
  return (
    <span
      className={["material-symbols-outlined", className].filter(Boolean).join(" ")}
      style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
    >
      {name}
    </span>
  );
}
