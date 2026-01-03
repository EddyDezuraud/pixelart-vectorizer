
import { Pixel, Rect, OptimizationMode, VectorizationSettings, RGBA } from '../types';
import { rgbaToHex } from './imageLoader';

/**
 * Calcule la distance euclidienne entre deux couleurs RGB.
 */
function getColorDistance(c1: RGBA, c2: RGBA): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Réduit le nombre de couleurs d'un set de pixels à 'maxColors' via un algorithme de clustering simplifié.
 */
function quantizePixels(pixels: Pixel[], maxColors: number): Pixel[] {
  if (maxColors <= 0) return pixels;

  // 1. Trouver les couleurs uniques et leur fréquence
  const colorCounts = new Map<string, { color: RGBA, count: number }>();
  pixels.forEach(p => {
    const key = `${p.color.r},${p.color.g},${p.color.b}`;
    const entry = colorCounts.get(key) || { color: p.color, count: 0 };
    entry.count++;
    colorCounts.set(key, entry);
  });

  const uniqueColors = Array.from(colorCounts.values());
  if (uniqueColors.length <= maxColors) return pixels;

  // 2. Initialisation des centroïdes (on prend les couleurs les plus fréquentes pour commencer)
  let centroids = uniqueColors
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map(c => c.color);

  // 3. K-Means simplifié (2 itérations suffisent souvent pour du pixel art)
  for (let iter = 0; iter < 2; iter++) {
    const clusters: RGBA[][] = Array.from({ length: maxColors }, () => []);
    
    // Assigner chaque couleur unique au centroïde le plus proche
    uniqueColors.forEach(uc => {
      let minDist = Infinity;
      let closestIdx = 0;
      centroids.forEach((cent, idx) => {
        const d = getColorDistance(uc.color, cent);
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });
      clusters[closestIdx].push(uc.color);
    });

    // Recalculer les centroïdes
    centroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      const sum = cluster.reduce((acc, c) => ({
        r: acc.r + c.r,
        g: acc.g + c.g,
        b: acc.b + c.b,
        a: 255
      }), { r: 0, g: 0, b: 0, a: 255 });
      return {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length),
        a: 255
      };
    });
  }

  // 4. Mapper chaque pixel à sa nouvelle couleur (centroïde le plus proche)
  const centroidHexMap = centroids.map(c => rgbaToHex(c.r, c.g, c.b, 255));

  return pixels.map(p => {
    let minDist = Infinity;
    let closestIdx = 0;
    centroids.forEach((cent, idx) => {
      const d = getColorDistance(p.color, cent);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });
    return {
      ...p,
      color: centroids[closestIdx],
      hex: centroidHexMap[closestIdx]
    };
  });
}

function areColorsSimilar(p1: Pixel, p2: Pixel, settings: VectorizationSettings): boolean {
  if (!settings.enableColorSimplification) {
    return p1.hex === p2.hex;
  }
  return getColorDistance(p1.color, p2.color) <= settings.colorTolerance;
}

export function vectorize(
  pixels: Pixel[],
  width: number,
  height: number,
  settings: VectorizationSettings
): Rect[] {
  let processedPixels = pixels.filter(p => p.color.a >= settings.alphaThreshold);

  // Appliquer la quantification si activée
  if (settings.enableColorQuantization) {
    processedPixels = quantizePixels(processedPixels, settings.maxColors);
  }

  switch (settings.optimization) {
    case OptimizationMode.HORIZONTAL:
      return horizontalOptimization(processedPixels, width, height, settings);
    case OptimizationMode.GREEDY_2D:
      return greedy2DOptimization(processedPixels, width, height, settings);
    case OptimizationMode.NONE:
    default:
      return processedPixels.map(p => ({
        x: p.x,
        y: p.y,
        width: 1,
        height: 1,
        color: p.hex
      }));
  }
}

function horizontalOptimization(pixels: Pixel[], width: number, height: number, settings: VectorizationSettings): Rect[] {
  const rects: Rect[] = [];
  const rows: Pixel[][] = Array.from({ length: height }, () => []);
  pixels.forEach(p => rows[p.y].push(p));

  for (let y = 0; y < height; y++) {
    const row = rows[y].sort((a, b) => a.x - b.x);
    if (row.length === 0) continue;

    let currentRect: { rect: Rect, sourcePixel: Pixel } | null = null;

    for (const pixel of row) {
      if (!currentRect) {
        currentRect = { 
          rect: { x: pixel.x, y: pixel.y, width: 1, height: 1, color: pixel.hex },
          sourcePixel: pixel
        };
      } else if (
        currentRect.rect.x + currentRect.rect.width === pixel.x && 
        areColorsSimilar(currentRect.sourcePixel, pixel, settings)
      ) {
        currentRect.rect.width++;
      } else {
        rects.push(currentRect.rect);
        currentRect = { 
          rect: { x: pixel.x, y: pixel.y, width: 1, height: 1, color: pixel.hex },
          sourcePixel: pixel
        };
      }
    }
    if (currentRect) rects.push(currentRect.rect);
  }

  return rects;
}

function greedy2DOptimization(pixels: Pixel[], width: number, height: number, settings: VectorizationSettings): Rect[] {
  const rects: Rect[] = [];
  const visited = new Set<number>();
  const pixelMap = new Map<number, Pixel>();
  pixels.forEach(p => pixelMap.set(p.y * width + p.x, p));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const seedPixel = pixelMap.get(idx);
      
      if (!seedPixel || visited.has(idx)) continue;

      let maxWidth = 0;
      while (
        (x + maxWidth) < width && 
        pixelMap.has(y * width + (x + maxWidth)) && 
        !visited.has(y * width + (x + maxWidth)) &&
        areColorsSimilar(seedPixel, pixelMap.get(y * width + (x + maxWidth))!, settings)
      ) {
        maxWidth++;
      }

      let maxHeight = 1;
      let canExpandDown = true;
      while (canExpandDown && (y + maxHeight) < height) {
        for (let dx = 0; dx < maxWidth; dx++) {
          const targetIdx = (y + maxHeight) * width + (x + dx);
          const targetPixel = pixelMap.get(targetIdx);
          if (
            !targetPixel || 
            visited.has(targetIdx) || 
            !areColorsSimilar(seedPixel, targetPixel, settings)
          ) {
            canExpandDown = false;
            break;
          }
        }
        if (canExpandDown) maxHeight++;
      }

      rects.push({
        x,
        y,
        width: maxWidth,
        height: maxHeight,
        color: seedPixel.hex
      });

      for (let dy = 0; dy < maxHeight; dy++) {
        for (let dx = 0; dx < maxWidth; dx++) {
          visited.add((y + dy) * width + (x + dx));
        }
      }
    }
  }

  return rects;
}
