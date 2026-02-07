import { BoundingBox } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const cropImageFromBoundingBox = (
  sourceImage: HTMLImageElement,
  box: BoundingBox
): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const imgWidth = sourceImage.naturalWidth;
  const imgHeight = sourceImage.naturalHeight;

  // Convert 0-1000 scale to pixels
  let ymin = (box.ymin / 1000) * imgHeight;
  let xmin = (box.xmin / 1000) * imgWidth;
  let ymax = (box.ymax / 1000) * imgHeight;
  let xmax = (box.xmax / 1000) * imgWidth;

  // --- Add 3px padding logic ---
  const padding = 3;
  
  ymin = Math.max(0, ymin - padding);
  xmin = Math.max(0, xmin - padding);
  ymax = Math.min(imgHeight, ymax + padding);
  xmax = Math.min(imgWidth, xmax + padding);

  const width = xmax - xmin;
  const height = ymax - ymin;

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  ctx.drawImage(
    sourceImage,
    xmin,
    ymin,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL("image/png");
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

// New function for manual cropping (normalized 0-1 coordinates)
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const cropBase64Image = async (base64: string, crop: CropRect): Promise<string> => {
  const img = await loadImage(base64);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return base64;

  const realX = crop.x * img.naturalWidth;
  const realY = crop.y * img.naturalHeight;
  const realW = crop.width * img.naturalWidth;
  const realH = crop.height * img.naturalHeight;

  // Validate bounds
  if (realW <= 0 || realH <= 0) return base64;

  canvas.width = realW;
  canvas.height = realH;

  ctx.drawImage(
    img,
    realX, realY, realW, realH, // Source
    0, 0, realW, realH          // Destination
  );

  return canvas.toDataURL("image/png");
};