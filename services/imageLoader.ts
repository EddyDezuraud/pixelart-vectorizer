
import { RGBA, Pixel } from '../types';

export const rgbaToHex = (r: number, g: number, b: number, a: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  // Only include alpha if it's not fully opaque for cleaner SVG strings
  const alphaHex = a === 255 ? '' : toHex(a);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
};

export async function getImagePixels(file: File): Promise<{ pixels: Pixel[], width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels: Pixel[] = [];
        const data = imageData.data;

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            pixels.push({
              x,
              y,
              color: { r, g, b, a },
              hex: rgbaToHex(r, g, b, a)
            });
          }
        }

        resolve({ pixels, width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
