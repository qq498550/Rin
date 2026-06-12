import { client } from "../app/runtime";
import { encodeBlurhash } from "./blurhash";

export const DEFAULT_IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;

// Image compression configuration
export const IMAGE_VARIANTS = {
  thumbnail: { maxWidth: 320, maxHeight: 320, quality: 0.75, suffix: "thumb" },
  content: { maxWidth: 1200, maxHeight: 1200, quality: 0.8, suffix: "content" },
  hero: { maxWidth: 1920, maxHeight: 1920, quality: 0.85, suffix: "hero" },
  original: { maxWidth: 3840, maxHeight: 3840, quality: 0.9, suffix: "original" },
} as const;

export type ImageVariantKey = keyof typeof IMAGE_VARIANTS;

export type UploadedImageResult = {
  url: string;
  variants?: Record<ImageVariantKey, string>;
  blurhash?: string;
  width?: number;
  height?: number;
};

type ImageMetadata = {
  blurhash?: string;
  width?: number;
  height?: number;
};

type MarkdownImageMetadataResult = {
  content: string;
  updated: number;
  failed: number;
};

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

// Client-side image compression using Canvas
export async function compressImage(
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number; format?: "webp" | "jpeg" | "png" }
): Promise<Blob> {
  const { maxWidth, maxHeight, quality, format = "webp" } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        // Enable high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          `image/${format}`,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

// Generate compressed version of an image (single variant)
export async function compressImageToVariant(
  file: File,
  variantKey: ImageVariantKey = "content"
): Promise<Blob> {
  const variant = IMAGE_VARIANTS[variantKey];
  return compressImage(file, { ...variant, format: "webp" });
}

// Generate blurhash and dimensions from original file
export async function generateImageMetadata(file: File): Promise<ImageMetadata> {
  if (!isImageFile(file)) {
    return {};
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const longestSide = Math.max(img.naturalWidth, img.naturalHeight);
        if (!longestSide) {
          resolve({});
          return;
        }

        const scale = Math.min(1, 48 / longestSide);
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve({});
          return;
        }

        context.drawImage(img, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        
        resolve({
          blurhash: encodeBlurhash(imageData.data, width, height, 4, 3),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => resolve({});
      img.src = e.target!.result as string;
    };
    reader.onerror = () => resolve({});
    reader.readAsDataURL(file);
  });
}

function toPositiveInteger(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function attachImageMetadataToUrl(url: string, metadata: ImageMetadata = {}) {
  const { blurhash, width, height } = metadata;
  if (!blurhash && !width && !height) {
    return url;
  }

  const [baseUrl, fragment = ""] = url.split("#", 2);
  const params = new URLSearchParams(fragment);
  if (blurhash) {
    params.set("blurhash", blurhash);
  }
  if (width) {
    params.set("width", String(width));
  }
  if (height) {
    params.set("height", String(height));
  }
  return `${baseUrl}#${params.toString()}`;
}

export function parseImageUrlMetadata(url?: string | null) {
  if (!url) {
    return {
      src: "",
      blurhash: undefined as string | undefined,
    };
  }

  const [src, fragment = ""] = url.split("#", 2);
  const params = new URLSearchParams(fragment);

  return {
    src,
    blurhash: params.get("blurhash") || undefined,
    width: toPositiveInteger(params.get("width")),
    height: toPositiveInteger(params.get("height")),
  };
}

export function stripImageUrlMetadata(url?: string | null) {
  return parseImageUrlMetadata(url).src;
}

export function buildMarkdownImage(fileName: string, url: string, metadata: ImageMetadata = {}) {
  const safeAlt = fileName.replace(/[[\]]/g, "");
  const safeUrl = url.replace(/\s/g, "%20");
  return `![${safeAlt}](${attachImageMetadataToUrl(safeUrl, metadata)})\n`;
}

// Upload image with client-side compression (new recommended method)
export async function uploadImageWithCompression(
  file: File,
  options: { variant?: ImageVariantKey } = {}
): Promise<UploadedImageResult> {
  const variantKey = options.variant ?? "content";
  
  // 1. Generate metadata (blurhash, dimensions) from original
  const metadata = await generateImageMetadata(file);
  
  // 2. Compress image to the desired variant
  const compressedBlob = await compressImageToVariant(file, variantKey);
  
  // 3. Create a File object from the compressed blob
  const extension = "webp";
  const compressedFile = new File([compressedBlob], `${crypto.randomUUID()}.${extension}`, {
    type: `image/${extension}`,
  });
  
  // 4. Upload using existing server endpoint
  const uploadResult = await client.storage.upload(compressedFile, compressedFile.name);
  
  if (uploadResult.error) {
    throw new Error(uploadResult.error.value as string);
  }
  
  const url = typeof uploadResult.data === "string" ? uploadResult.data : uploadResult.data?.url;
  
  if (!url) {
    throw new Error("Invalid upload response");
  }
  
  return {
    url,
    ...metadata,
  };
}

// Legacy upload (for backward compatibility - uploads original without compression)
export async function uploadImageFile(file: File): Promise<UploadedImageResult> {
  const [uploadResult, metadataResult] = await Promise.allSettled([
    client.storage.upload(file, file.name),
    generateImageMetadata(file),
  ]);

  if (uploadResult.status === "rejected") {
    throw uploadResult.reason instanceof Error
      ? uploadResult.reason
      : new Error("Upload failed");
  }

  const { data, error } = uploadResult.value;
  if (error) {
    throw new Error(error.value);
  }

  const url =
    typeof data === "string"
      ? data
      : data?.url;

  if (!url) {
    throw new Error("Invalid upload response");
  }

  return {
    url,
    ...(metadataResult.status === "fulfilled" ? metadataResult.value : {}),
  };
}

export async function enrichMarkdownImageMetadata(content: string): Promise<MarkdownImageMetadataResult> {
  const markdownPattern = /!\[(.*?)\]\((\S+?)(?:\s+\"[^\"]*\")?\)/g;
  const htmlPattern = /<img\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*?)>/gi;
  const markdownMatches = [...content.matchAll(markdownPattern)].map((match) => ({
    type: "markdown" as const,
    fullMatch: match[0],
    alt: match[1] || "",
    rawUrl: match[2],
  }));
  const htmlMatches = [...content.matchAll(htmlPattern)].map((match) => ({
    type: "html" as const,
    fullMatch: match[0],
    beforeSrc: match[1] || "",
    rawUrl: match[2],
    afterSrc: match[3] || "",
  }));
  const matches = [...markdownMatches, ...htmlMatches];

  if (matches.length === 0) {
    return { content, updated: 0, failed: 0 };
  }

  let nextContent = content;
  let updated = 0;
  let failed = 0;

  for (const match of matches) {
    const { fullMatch, rawUrl } = match;
    if (!fullMatch || !rawUrl) {
      continue;
    }

    const existing = parseImageUrlMetadata(rawUrl);
    if (existing.blurhash && existing.width && existing.height) {
      continue;
    }

    try {
      const metadata = await generateImageMetadataFromUrl(rawUrl);
      if (!metadata.blurhash || !metadata.width || !metadata.height) {
        failed += 1;
        continue;
      }

      const nextUrl = attachImageMetadataToUrl(existing.src, metadata);
      const replacement = match.type === "markdown"
        ? `![${match.alt}](${nextUrl})`
        : `<img${match.beforeSrc}src="${nextUrl}"${match.afterSrc}>`;
      if (replacement !== fullMatch) {
        nextContent = nextContent.replace(fullMatch, replacement);
        updated += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    content: nextContent,
    updated,
    failed,
  };
}

async function loadImageFromUrl(url: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.crossOrigin = "anonymous";
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    element.src = url;
  });
  return image;
}

export async function generateImageMetadataFromUrl(url: string): Promise<ImageMetadata> {
  const { src, blurhash, width, height } = parseImageUrlMetadata(url);
  if (blurhash && width && height) {
    return { blurhash, width, height };
  }

  const image = await loadImageFromUrl(src);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longestSide) {
    return {
      blurhash,
      width: width || undefined,
      height: height || undefined,
    };
  }

  const scale = Math.min(1, 48 / longestSide);
  const canvas = document.createElement("canvas");
  const canvasWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const canvasHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return {
      blurhash,
      width: width || image.naturalWidth || undefined,
      height: height || image.naturalHeight || undefined,
    };
  }

  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);

  return {
    blurhash: blurhash || encodeBlurhash(imageData.data, canvasWidth, canvasHeight, 4, 3),
    width: width || image.naturalWidth || undefined,
    height: height || image.naturalHeight || undefined,
  };
}