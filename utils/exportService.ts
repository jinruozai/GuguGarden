import { CardItem, GridConfig, PatternType } from "../types";
import { PATTERNS } from "./patterns";

export const exportCanvasAsImage = async (
    items: CardItem[],
    gridConfig: GridConfig,
    backgroundColor: string,
    patternType: PatternType,
    averageAspectRatio: number
): Promise<void> => {
    if (items.length === 0) {
        alert("画布为空，无法导出");
        return;
    }

    // 1. Setup Export Dimensions
    // We use a fixed width for high-quality export, independent of screen size
    const EXPORT_WIDTH = 2000;
    const PADDING = 60;
    
    // Recalculate layout metrics for the export width
    const cols = Math.max(1, gridConfig.columns);
    const safeWidth = EXPORT_WIDTH - (PADDING * 2);
    // Note: Gaps in the gridConfig are in pixels. We might want to scale them if we want true WYSIWYG, 
    // but usually keeping the raw pixel value relative to 2000px width is fine or we scale everything.
    // Let's perform a scale factor calculation to map the screen feel to the export canvas.
    // Actually, simpler is: calculate width per card based on available space.
    
    // To maintain "dense" look from small gaps, we might need to scale gaps up relative to the huge 2000px width? 
    // Let's assume the gaps provided in config (e.g. 6px) are "screen pixels". 
    // On a 2000px canvas, 6px is tiny. Let's scale gaps by 2x for better print look.
    const gapScale = 2.0; 
    const hGap = gridConfig.horizontalGap * gapScale;
    const vGap = gridConfig.verticalGap * gapScale;
    
    const totalGapW = (cols - 1) * hGap;
    const cardW = (safeWidth - totalGapW) / cols;
    const cardH = cardW / averageAspectRatio;
    
    const rows = Math.ceil(items.length / cols);
    const totalContentHeight = rows * cardH + (rows - 1) * vGap;
    const EXPORT_HEIGHT = totalContentHeight + (PADDING * 2);

    // 2. Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3. Draw Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Draw Pattern
    const patternDef = PATTERNS[patternType];
    if (patternDef.svg) {
        const img = new Image();
        img.src = patternDef.svg;
        await new Promise((resolve) => { img.onload = resolve; });
        
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // 5. Draw Items
    const loadImagesPromises = items.map(item => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = item.src;
        });
    });

    const loadedImages = await Promise.all(loadImagesPromises);

    loadedImages.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = PADDING + col * (cardW + hGap);
        const y = PADDING + row * (cardH + vGap);

        // Apply item scale (padding effect inside the cell)
        const scale = gridConfig.itemScale;
        const drawW = cardW * scale;
        const drawH = cardH * scale;
        
        // Center in cell
        const drawX = x + (cardW - drawW) / 2;
        const drawY = y + (cardH - drawH) / 2;

        // Draw shadow (simulate the 'shadow-card' effect)
        ctx.save();
        ctx.shadowColor = "rgba(79, 70, 63, 0.15)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        // Don't draw image immediately for shadow, draw a rect or just let image cast shadow
        // Standard drawImage with shadow works
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
    });

    // 6. Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `garden-export-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
