import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ImageCropper } from './components/ImageCropper';
import { CardItem, GridConfig, PatternType } from './types';
import { detectObjectsInImage } from './services/cvService'; 
import { fileToBase64, cropImageFromBoundingBox, loadImage, cropBase64Image, CropRect } from './utils/imageProcessing';
import { exportCanvasAsImage } from './utils/exportService';

export default function App() {
  const [items, setItems] = useState<CardItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Background State
  const [backgroundColor, setBackgroundColor] = useState<string>('#f3efdc');
  const [backgroundPattern, setBackgroundPattern] = useState<PatternType>('dots');
  
  // Cropper State
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [gridConfig, setGridConfig] = useState<GridConfig>({
    columns: 9, 
    horizontalGap: 6, 
    verticalGap: 6, 
    itemScale: 1.0, 
  });

  // Calculate average aspect ratio of all items to normalize grid cells
  const averageAspectRatio = useMemo(() => {
    if (items.length === 0) return 0.75; // Default to 3:4 portrait
    const totalRatio = items.reduce((acc, item) => {
      return acc + (item.originalWidth / item.originalHeight);
    }, 0);
    return totalRatio / items.length;
  }, [items]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    try {
      const base64 = await fileToBase64(file);
      setTempImageSrc(base64);
      setIsCropping(true);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const handleCropConfirm = async (crop: CropRect) => {
    if (!tempImageSrc) return;

    setIsCropping(false);
    setIsProcessing(true);

    try {
      const croppedBase64 = await cropBase64Image(tempImageSrc, crop);
      const boundingBoxes = await detectObjectsInImage(croppedBase64);
      
      if (boundingBoxes.length === 0) {
        alert("未发现明显对象，请尝试对比度更高的图片或边缘更清晰的图集。");
      }

      const sourceImage = await loadImage(croppedBase64);
      
      const newItems: CardItem[] = boundingBoxes.map((box, index) => {
        const croppedSrc = cropImageFromBoundingBox(sourceImage, box);
        const width = ((box.xmax - box.xmin) / 1000) * sourceImage.naturalWidth;
        const height = ((box.ymax - box.ymin) / 1000) * sourceImage.naturalHeight;

        return {
          id: `${Date.now()}-${index}`,
          src: croppedSrc,
          x: 0, 
          y: 0,
          width: width,
          height: height,
          originalWidth: width,
          originalHeight: height
        };
      });

      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error("Failed to process image:", error);
      alert("图片解析失败，请确保OpenCV已加载。");
    } finally {
      setIsProcessing(false);
      setTempImageSrc(null);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImageSrc(null);
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(e.target.value);
  };

  const handleReorder = (newOrder: CardItem[]) => {
    setItems(newOrder);
  };

  const handleDeleteSelected = () => {
    setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有卡片吗？')) {
        setItems([]);
        setSelectedIds(new Set());
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
        await exportCanvasAsImage(items, gridConfig, backgroundColor, backgroundPattern, averageAspectRatio);
    } catch (e) {
        console.error("Export failed", e);
        alert("导出失败，请重试");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-ink font-sans overflow-hidden">
      <Sidebar
        gridConfig={gridConfig}
        setGridConfig={setGridConfig}
        onUpload={handleUpload}
        onBackgroundColorChange={handleBackgroundColorChange}
        backgroundColor={backgroundColor}
        backgroundPattern={backgroundPattern}
        setBackgroundPattern={setBackgroundPattern}
        isProcessing={isProcessing}
        onDeleteSelected={handleDeleteSelected}
        onClearAll={handleClearAll}
        onExport={handleExport}
        hasSelection={selectedIds.size > 0}
        itemCount={items.length}
      />
      
      <main className="flex-1 relative h-full flex flex-col">
        <Canvas
          items={items}
          gridConfig={gridConfig}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onReorder={handleReorder}
          backgroundColor={backgroundColor}
          backgroundPattern={backgroundPattern}
          averageAspectRatio={averageAspectRatio}
        />
      </main>

      {/* Cropper Modal */}
      {isCropping && tempImageSrc && (
        <ImageCropper 
          imageSrc={tempImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}