
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: RGBA;
  hex: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export enum OptimizationMode {
  NONE = 'none',
  HORIZONTAL = 'horizontal',
  GREEDY_2D = 'greedy_2d'
}

export interface VectorizationSettings {
  pixelSize: number;
  optimization: OptimizationMode;
  alphaThreshold: number;
  minify: boolean;
  enableColorSimplification: boolean;
  colorTolerance: number;
  enableColorQuantization: boolean;
  maxColors: number;
}

export interface ImageStats {
  width: number;
  height: number;
  rectCount: number;
  approxSizeKB: number;
}
