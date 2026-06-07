export const GRADIENT_PRESETS = {
  "purple-blue": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "pink-orange": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "blue-teal": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "sunset": "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "ocean": "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  "forest": "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
} as const;

export type GradientPresetKey = keyof typeof GRADIENT_PRESETS;

export function getGradientPreset(key: string): string | undefined {
  return GRADIENT_PRESETS[key as GradientPresetKey];
}

export function applyBackground(
  type: "none" | "image" | "gradient",
  imageUrl: string,
  imageOpacity: number,
  gradient: string
) {
  const root = document.documentElement;
  const body = document.body;

  // Remove existing background styles
  root.style.removeProperty("--bg-image");
  root.style.removeProperty("--bg-opacity");
  root.style.removeProperty("--bg-gradient");
  body.style.backgroundImage = "";
  body.style.backgroundAttachment = "";
  body.style.backgroundSize = "";
  body.style.backgroundPosition = "";
  body.style.backgroundRepeat = "";

  switch (type) {
    case "image":
      if (imageUrl) {
        root.style.setProperty("--bg-image", `url("${imageUrl}")`);
        root.style.setProperty("--bg-opacity", String(Math.max(0, Math.min(1, imageOpacity))));
        body.style.backgroundImage = `var(--bg-image)`;
        body.style.backgroundAttachment = "fixed";
        body.style.backgroundSize = "cover";
        body.style.backgroundPosition = "center";
        body.style.backgroundRepeat = "no-repeat";
      }
      break;

    case "gradient":
      if (gradient) {
        const appliedGradient = getGradientPreset(gradient) || gradient;
        root.style.setProperty("--bg-gradient", appliedGradient);
        body.style.backgroundImage = `var(--bg-gradient)`;
        body.style.backgroundAttachment = "fixed";
      }
      break;

    case "none":
    default:
      // No background - body will use the default bg-background-light/dark from Tailwind
      break;
  }
}

export function normalizeBackgroundType(value: string | undefined | null): "none" | "image" | "gradient" {
  if (value === "image" || value === "gradient") return value;
  return "none";
}

export function normalizeImageOpacity(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return Math.max(0, Math.min(1, value));
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(1, parsed));
    }
  }
  return 0.5;
}