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
        body.style.position = "relative";
        body.style.backgroundImage = "";
        body.style.backgroundAttachment = "";
        // Set the ::before pseudo-element for image background with opacity control
        const styleId = "bg-image-style";
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            z-index: -1;
            background-image: var(--bg-image);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            opacity: var(--bg-opacity);
            pointer-events: none;
          }
        `;
      }
      break;

    case "gradient":
      if (gradient) {
        const appliedGradient = getGradientPreset(gradient) || gradient;
        root.style.setProperty("--bg-gradient", appliedGradient);
        body.style.position = "";
        body.style.backgroundImage = `var(--bg-gradient)`;
        body.style.backgroundAttachment = "fixed";
        body.style.backgroundSize = "";
        body.style.backgroundPosition = "";
        // Remove the image overlay style when switching to gradient
        const styleId = "bg-image-style";
        const styleEl = document.getElementById(styleId);
        if (styleEl) {
          styleEl.textContent = "";
        }
      }
      break;

    case "none":
    default:
      // Remove all background elements
      body.style.backgroundImage = "";
      body.style.backgroundAttachment = "";
      body.style.backgroundSize = "";
      body.style.backgroundPosition = "";
      body.style.position = "";
      const styleId = "bg-image-style";
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.textContent = "";
      }
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