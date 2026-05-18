import { AxIcon } from "@/components/brand/ax-icon";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  size?: number;
  className?: string;
  fullscreen?: boolean;
}

export function BrandLoader({
  label,
  size = 72,
  className,
  fullscreen = true,
}: Props) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullscreen && "min-h-[60vh]",
        className,
      )}
    >
      <div
        className="brand-loader"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="brand-loader-halo" />
        <span className="brand-loader-icon">
          <AxIcon size={size} scheme="accent" aria-label="" />
        </span>
      </div>
      <p className="text-sm font-medium text-muted-foreground" aria-hidden="true">
        {label}
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
