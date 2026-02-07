import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CardItem, GridConfig, SelectionBox, PatternType } from '../types';
import { PATTERNS } from '../utils/patterns';

interface CanvasProps {
  items: CardItem[];
  selectedIds: Set<string>;
  gridConfig: GridConfig;
  onSelectionChange: (ids: Set<string>) => void;
  onReorder: (newOrder: CardItem[]) => void;
  backgroundColor: string;
  backgroundPattern: PatternType;
  averageAspectRatio: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  items,
  selectedIds,
  gridConfig,
  onSelectionChange,
  onReorder,
  backgroundColor,
  backgroundPattern,
  averageAspectRatio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Resize Observer to get precise container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Grid Calculation ---
  const layout = useMemo(() => {
    if (!containerWidth) return [];
    
    // Safety margin
    const safeWidth = containerWidth - 48; // Slightly more padding
    
    const cols = Math.max(1, gridConfig.columns);
    const totalGapW = (cols - 1) * gridConfig.horizontalGap;
    const availableW = Math.max(0, safeWidth - totalGapW);
    const cardW = availableW / cols;
    const cardH = cardW / averageAspectRatio;

    return items.map((_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = 24 + col * (cardW + gridConfig.horizontalGap); 
      const y = 24 + row * (cardH + gridConfig.verticalGap);
      
      return { x, y, width: cardW, height: cardH };
    });
  }, [containerWidth, items.length, gridConfig, averageAspectRatio]);


  // --- State ---
  const [dragState, setDragState] = useState<{
    activeId: string | null;
    isDragging: boolean;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
    initialMouseX: number;
    initialMouseY: number;
  }>({ 
    activeId: null, 
    isDragging: false, 
    currentX: 0, 
    currentY: 0, 
    offsetX: 0, 
    offsetY: 0, 
    initialMouseX: 0,
    initialMouseY: 0
  });

  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [lastAnchorIndex, setLastAnchorIndex] = useState<number>(-1);
  const [pendingDeselect, setPendingDeselect] = useState<boolean>(false);

  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.shiftKey) {
      onSelectionChange(new Set());
      setLastAnchorIndex(-1);
    }
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = e.clientX - rect.left + containerRef.current!.scrollLeft;
      const startY = e.clientY - rect.top + containerRef.current!.scrollTop;
      setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
    }
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: CardItem, index: number) => {
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setDragState({
      activeId: item.id,
      isDragging: false,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY
    });

    if (e.shiftKey && lastAnchorIndex !== -1) {
      const start = Math.min(lastAnchorIndex, index);
      const end = Math.max(lastAnchorIndex, index);
      const newSelected = new Set(selectedIds);
      
      if (!e.ctrlKey) {
          newSelected.clear();
      }

      for (let i = start; i <= end; i++) {
        if (items[i]) newSelected.add(items[i].id);
      }
      onSelectionChange(newSelected);
    } else if (e.ctrlKey) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      onSelectionChange(newSelected);
      setLastAnchorIndex(index);
      setPendingDeselect(false);
    } else {
      if (selectedIds.has(item.id)) {
        setPendingDeselect(true);
        setLastAnchorIndex(index); 
      } else {
        onSelectionChange(new Set([item.id]));
        setLastAnchorIndex(index);
        setPendingDeselect(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left + containerRef.current!.scrollLeft;
        const currentY = e.clientY - rect.top + containerRef.current!.scrollTop;
        setSelectionBox(prev => prev ? ({ ...prev, currentX, currentY }) : null);
      }
      return;
    }

    if (dragState.activeId && containerRef.current) {
      const moveDist = Math.hypot(e.clientX - dragState.initialMouseX, e.clientY - dragState.initialMouseY);
      
      // Threshold to start dragging
      if (!dragState.isDragging && moveDist < 5) return;

      if (!dragState.isDragging) {
        setDragState(prev => ({ ...prev, isDragging: true }));
        setPendingDeselect(false);
      }
      
      setDragState(prev => ({ ...prev, currentX: e.clientX, currentY: e.clientY }));

      // Multi-drag Logic
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseRelX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
      const mouseRelY = e.clientY - containerRect.top + containerRef.current.scrollTop;

      let closestIndex = -1;
      let minDist = Infinity;

      layout.forEach((slot, idx) => {
        const cx = slot.x + slot.width / 2;
        const cy = slot.y + slot.height / 2;
        const dist = Math.hypot(mouseRelX - cx, mouseRelY - cy);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      });

      const isDraggingSelection = selectedIds.has(dragState.activeId);
      const draggedItemIds = isDraggingSelection ? Array.from(selectedIds) : [dragState.activeId];
      
      const activeItemCurrentIndex = items.findIndex(i => i.id === dragState.activeId);
      
      // Only reorder if we have moved to a different slot
      if (closestIndex !== -1 && closestIndex !== activeItemCurrentIndex) {
         const currentIndices = draggedItemIds
            .map(id => items.findIndex(i => i.id === id))
            .sort((a, b) => a - b);

         const movingItems = currentIndices.map(idx => items[idx]);
         const remainingItems = items.filter(item => !draggedItemIds.includes(item.id));
         
         // Calculate where to insert
         // If dragging multiple, we treat the 'active' (held) item as the cursor
         // We need to find the relative position of the active item in the sorted selection
         const sortedDraggedIds = [...draggedItemIds].sort((a, b) => {
             return items.findIndex(i => i.id === a) - items.findIndex(i => i.id === b);
         });
         const rank = sortedDraggedIds.indexOf(dragState.activeId);
         
         let targetInsertIndex = closestIndex - rank;
         if (targetInsertIndex < 0) targetInsertIndex = 0;
         if (targetInsertIndex > remainingItems.length) targetInsertIndex = remainingItems.length;

         const newOrder = [
           ...remainingItems.slice(0, targetInsertIndex),
           ...movingItems,
           ...remainingItems.slice(targetInsertIndex)
         ];
         
         onReorder(newOrder);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (pendingDeselect && !dragState.isDragging && dragState.activeId) {
      onSelectionChange(new Set([dragState.activeId]));
    }

    setDragState(prev => ({ ...prev, activeId: null, isDragging: false }));

    if (selectionBox) {
      const boxLeft = Math.min(selectionBox.startX, selectionBox.currentX);
      const boxRight = Math.max(selectionBox.startX, selectionBox.currentX);
      const boxTop = Math.min(selectionBox.startY, selectionBox.currentY);
      const boxBottom = Math.max(selectionBox.startY, selectionBox.currentY);

      const newSelected = new Set(e.ctrlKey ? selectedIds : []);
      
      items.forEach((item, index) => {
        const pos = layout[index];
        if (!pos) return;
        const cx = pos.x + pos.width / 2;
        const cy = pos.y + pos.height / 2;
        
        if (cx >= boxLeft && cx <= boxRight && cy >= boxTop && cy <= boxBottom) {
          newSelected.add(item.id);
        }
      });

      onSelectionChange(newSelected);
      setSelectionBox(null);
    }
    setPendingDeselect(false);
  };

  const getItemStyle = (item: CardItem, index: number) => {
    const pos = layout[index];
    if (!pos) return { display: 'none' };

    // Is this exact item being held by the mouse?
    const isHeld = dragState.activeId === item.id;
    
    // Is this item part of the moving group?
    const isSelected = selectedIds.has(item.id);
    const isDraggingGroup = dragState.activeId && selectedIds.has(dragState.activeId) && isSelected;
    
    // Should this item visually follow the mouse (active drag state)?
    // Currently we only make the *held* item follow the mouse absolutely for visual clarity,
    // others slide into their new slots via the reorder logic.
    // If you want all selected items to bundle, logic needs to change, but usually grid drag moves the "leader" 
    // and others flow around.
    
    // Logic: 
    // 1. If 'isHeld' and 'isDragging', it follows mouse.
    // 2. All other items (even selected ones) flow in the grid.
    
    if (dragState.isDragging && isHeld) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
         const targetX = dragState.currentX - containerRect.left + containerRef.current!.scrollLeft - dragState.offsetX;
         const targetY = dragState.currentY - containerRect.top + containerRef.current!.scrollTop - dragState.offsetY;
         
         return {
           position: 'absolute' as const,
           left: 0, 
           top: 0,
           width: pos.width,
           height: pos.height,
           transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(1.08)`,
           zIndex: 100,
           cursor: 'grabbing',
           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
           transition: 'none', // Critical: No lag for the dragged item
         };
      }
    }

    // For everything else (grid items, or selected followers)
    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: pos.width,
      height: pos.height,
      transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      // Critical: Smooth transition for reordering items, but immediate for selected state changes
      transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s ease', 
      zIndex: isSelected ? 50 : 1,
    };
  };

  // Resolve Pattern
  const pattern = PATTERNS[backgroundPattern];
  const bgImage = pattern.svg ? `url("${pattern.svg}")` : 'none';
  const bgSize = pattern.backgroundSize;

  return (
    <div className="flex-1 h-full relative overflow-hidden bg-background">
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
           backgroundColor: backgroundColor, 
           backgroundImage: bgImage,
           backgroundSize: bgSize,
           backgroundRepeat: 'repeat',
           opacity: 1
        }}
      >
        <div style={{ 
          height: layout.length > 0 
            ? Math.max(...layout.map(l => l.y + l.height)) + 100 
            : 0,
          width: '100%' 
        }} />

        {items.map((item, index) => (
          <div
            key={item.id}
            onMouseDown={(e) => handleItemMouseDown(e, item, index)}
            style={getItemStyle(item, index)}
            className="group select-none"
          >
            <div className={`
                w-full h-full relative transition-all duration-200 flex items-center justify-center
                ${selectedIds.has(item.id) 
                  ? 'scale-[0.96]' 
                  : 'hover:scale-[1.02]'}
            `}>
              {/* Image Container */}
              <div 
                 className={`
                   relative overflow-hidden rounded-xl bg-white transition-all duration-200
                   ${selectedIds.has(item.id) 
                     ? 'shadow-[0_0_0_3px_#22c55e] ring-2 ring-white/80' // CHANGED: High contrast green ring
                     : 'shadow-card group-hover:shadow-float'
                   }
                 `}
                 style={{ 
                   width: `${gridConfig.itemScale * 100}%`,
                   height: `${gridConfig.itemScale * 100}%`,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                 }} 
              >
                  <img 
                    src={item.src} 
                    alt="Card" 
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  
                  {/* Selection Overlay Tint - CHANGED: Green Tint */}
                   <div className={`
                    absolute inset-0 pointer-events-none transition-opacity duration-200
                    ${selectedIds.has(item.id) ? 'bg-green-500/10 opacity-100' : 'opacity-0'}
                  `} />
              </div>
            </div>
          </div>
        ))}

        {selectionBox && (
          <div
            className="absolute border border-green-500/60 bg-green-500/10 pointer-events-none z-50 rounded-lg backdrop-blur-[1px]" // CHANGED: Green selection box
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }}
          />
        )}
      </div>

      {items.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-inkLight/40">
             <div className="text-center p-8 border border-dashed border-inkLight/20 rounded-3xl bg-surface/40 backdrop-blur-sm">
               <h3 className="text-lg font-bold mb-2 text-ink/60 tracking-wider">花园空空如也...</h3>
               <p className="font-medium text-xs">请在左侧导入您的图集素材 🌱</p>
             </div>
          </div>
        )}
    </div>
  );
};