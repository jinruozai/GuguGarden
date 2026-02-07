export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface CardItem {
  id: string;
  src: string; // Data URL of the cropped image
  x: number; 
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface GridConfig {
  columns: number;
  horizontalGap: number;
  verticalGap: number;
  itemScale: number; // Will use this for internal padding/zoom feel
}

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export type PatternType = 'none' | 'dots' | 'grid' | 'stars' | 'flowers' | 'hearts';

// Add type definition for window.opencv
declare global {
  interface Window {
    opencvLoaded?: boolean;
    cv?: any;
  }
}
