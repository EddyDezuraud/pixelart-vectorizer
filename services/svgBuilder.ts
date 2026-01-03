
import { Rect, VectorizationSettings } from '../types';

export function buildSvg(
  rects: Rect[],
  width: number,
  height: number,
  settings: VectorizationSettings
): string {
  const { pixelSize, minify } = settings;
  const scaledWidth = width * pixelSize;
  const scaledHeight = height * pixelSize;

  // Group by color to minimize <g> wrappers or repeating fill attributes
  const colorGroups: Map<string, Rect[]> = new Map();
  rects.forEach(r => {
    if (!colorGroups.has(r.color)) colorGroups.set(r.color, []);
    colorGroups.get(r.color)!.push(r);
  });

  const newline = minify ? '' : '\n';
  const indent = minify ? '' : '  ';

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${scaledWidth} ${scaledHeight}" shape-rendering="crispEdges">${newline}`;

  for (const [color, colorRects] of colorGroups.entries()) {
    svgContent += `${indent}<g fill="${color}">${newline}`;
    for (const r of colorRects) {
      const rx = r.x * pixelSize;
      const ry = r.y * pixelSize;
      const rw = r.width * pixelSize;
      const rh = r.height * pixelSize;
      svgContent += `${indent}${indent}<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" />${newline}`;
    }
    svgContent += `${indent}</g>${newline}`;
  }

  svgContent += `</svg>`;
  return svgContent;
}
