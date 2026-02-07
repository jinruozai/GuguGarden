import { BoundingBox } from "../types";

// Helper to wait for OpenCV to load
const waitForOpenCV = async (): Promise<void> => {
  if ((window as any).cv && (window as any).cv.Mat) return;

  return new Promise((resolve) => {
    const check = setInterval(() => {
      if ((window as any).cv && (window as any).cv.Mat) {
        clearInterval(check);
        resolve();
      }
    }, 100);
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(check);
      // We resolve anyway and hope for the best, or could reject
      resolve();
    }, 10000);
  });
};

export const detectObjectsInImage = async (base64Image: string): Promise<BoundingBox[]> => {
  await waitForOpenCV();
  const cv = (window as any).cv;

  if (!cv) {
    throw new Error("OpenCV not loaded");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // 1. Read image to Mat
        const src = cv.imread(img);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const edges = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        const kernel = cv.Mat.ones(3, 3, cv.CV_8U); // Kernel for morphology

        // 2. Pre-processing
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        
        // Gaussian Blur
        // Using a standard 5x5 blur to reduce noise
        const ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

        // 3. Edge Detection (Canny) - OPTIMIZED
        // Lower thresholds (10, 100) to catch faint edges of cards against similar backgrounds
        cv.Canny(blurred, edges, 10, 100, 3, false);

        // 4. Morphological Operations - OPTIMIZED
        // Dilate more aggressively to close gaps in the edge detection
        // This prevents the algorithm from "leaking" into the card and finding an inner contour
        const anchor = new cv.Point(-1, -1);
        
        // Iteration 2 makes the lines thicker, connecting broken segments
        cv.dilate(edges, edges, kernel, anchor, 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        
        // Close operation (Dilate -> Erode) fills small holes and connects nearby edges
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);

        // 5. Find Contours
        // RETR_EXTERNAL ensures we only get the outermost parents, ignoring internal details
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let foundBoxes: BoundingBox[] = [];
        const imgArea = src.cols * src.rows;
        // Adjust minArea slightly to avoid noise, but keep it small enough for small items
        const minArea = imgArea * 0.001; 
        const maxArea = imgArea * 0.98; 

        for (let i = 0; i < contours.size(); ++i) {
          const cnt = contours.get(i);
          const area = cv.contourArea(cnt);

          if (area > minArea && area < maxArea) {
            const rect = cv.boundingRect(cnt);
            
            // Normalize coordinates (0-1000 scale)
            const ymin = (rect.y / src.rows) * 1000;
            const xmin = (rect.x / src.cols) * 1000;
            const ymax = ((rect.y + rect.height) / src.rows) * 1000;
            const xmax = ((rect.x + rect.width) / src.cols) * 1000;

            foundBoxes.push({ ymin, xmin, ymax, xmax });
          }
        }

        // --- SORTING LOGIC ---
        // Goal: strictly follow visual reading order (Top-Left to Bottom-Right)
        
        if (foundBoxes.length > 0) {
            // Add center Y helper
            const boxesWithCenter = foundBoxes.map(b => ({
                ...b,
                cy: (b.ymin + b.ymax) / 2,
                cx: (b.xmin + b.xmax) / 2
            }));

            // Calculate average height
            const avgHeight = boxesWithCenter.reduce((sum, b) => sum + (b.ymax - b.ymin), 0) / boxesWithCenter.length;
            
            // 1. Initial sort by Center Y
            boxesWithCenter.sort((a, b) => a.cy - b.cy);

            const sortedBoxes: typeof boxesWithCenter = [];
            let currentRow: typeof boxesWithCenter = [];
            
            // We need a stable reference for the current row's Y. 
            // We initialize with the first box.
            let currentRowY = boxesWithCenter[0].cy;

            // Threshold: If the next box's center is within half a card height of the current row's center,
            // we treat it as the same row.
            const rowThreshold = avgHeight * 0.5;

            boxesWithCenter.forEach((box) => {
                if (Math.abs(box.cy - currentRowY) < rowThreshold) {
                    currentRow.push(box);
                } else {
                    // Row is finished. Sort by X (left to right)
                    currentRow.sort((a, b) => a.xmin - b.xmin);
                    sortedBoxes.push(...currentRow);
                    
                    // Start new row
                    currentRow = [box];
                    currentRowY = box.cy; 
                }
            });

            // Push last row
            if (currentRow.length > 0) {
                currentRow.sort((a, b) => a.xmin - b.xmin);
                sortedBoxes.push(...currentRow);
            }
            
            // Map back to BoundingBox
            foundBoxes = sortedBoxes.map(({ cy, cx, ...rest }) => rest);
        }

        // Cleanup OpenCV memory
        src.delete();
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        kernel.delete();
        // M was removed, using kernel instead

        resolve(foundBoxes);
      } catch (e) {
        console.error("OpenCV processing error", e);
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  });
};