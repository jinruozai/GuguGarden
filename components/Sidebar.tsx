import React from 'react';
import { GridConfig, PatternType } from '../types';
import { PATTERNS } from '../utils/patterns';
import { Upload, Palette, Trash2, Flower2, Sliders, LayoutGrid, Download, Image as ImageIcon } from 'lucide-react';

interface SidebarProps {
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  backgroundColor: string;
  backgroundPattern: PatternType;
  setBackgroundPattern: (p: PatternType) => void;
  isProcessing: boolean;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onExport: () => void;
  hasSelection: boolean;
  itemCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  gridConfig,
  setGridConfig,
  onUpload,
  onBackgroundColorChange,
  backgroundColor,
  backgroundPattern,
  setBackgroundPattern,
  isProcessing,
  onDeleteSelected,
  onClearAll,
  onExport,
  hasSelection,
  itemCount
}) => {
  return (
    <div className="w-72 bg-[#2b2623] border-r border-white/5 h-full flex flex-col shadow-2xl z-20 shrink-0 text-[#f3efdc]">
      
      {/* Brand Header */}
      <div className="pt-8 pb-4 px-6 flex flex-col items-center relative">
        <div className="bg-white/5 p-3.5 rounded-2xl shadow-lg mb-3 ring-1 ring-white/5">
          <Flower2 className="w-8 h-8 text-primary" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-bold tracking-wide text-[#f3efdc] mb-1">
          咕咕大王
        </h1>
        <div className="flex items-center gap-2 mb-4">
           <span className="text-[10px] font-medium tracking-wider px-2.5 py-0.5 bg-[#a6b093]/20 text-[#a6b093] rounded-full border border-[#a6b093]/10">
             花园图鉴
           </span>
           <span className="text-[10px] text-white/30">
             已收录 {itemCount}
           </span>
        </div>

        {/* Export Button - Prominent in Header */}
        <button 
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all group"
        >
          <div className="p-1 rounded-md bg-primary/20 text-primary group-hover:scale-110 transition-transform">
             <Download className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white/80 group-hover:text-white">导出完整图片</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5 custom-scrollbar">
        
        {/* Upload Card */}
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-xs font-bold text-white/40 tracking-widest">导入素材</h2>
            <button 
              onClick={onClearAll}
              className="text-[11px] text-white/40 hover:text-red-400 transition-colors flex items-center gap-1 px-1"
            >
              清空
            </button>
          </div>
          
          <label className={`
            group flex flex-col items-center justify-center w-full h-24
            border border-dashed rounded-2xl cursor-pointer 
            transition-all duration-300 relative overflow-hidden bg-[#38322e]
            ${isProcessing 
              ? 'border-primary/30 bg-primary/5 cursor-wait' 
              : 'border-white/10 hover:border-primary/40 hover:bg-[#403a36] hover:shadow-lg'}
          `}>
             {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-[2.5px] border-primary/20 border-t-primary"></div>
                  <span className="text-[11px] font-medium text-primary">正在识别中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 group-hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-8 h-8 rounded-full bg-white/5 shadow-inner flex items-center justify-center text-white/40 group-hover:text-primary transition-colors ring-1 ring-white/5">
                     <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-white/40 group-hover:text-primary transition-colors">点击上传图集</span>
                </div>
              )}
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={isProcessing} />
          </label>
        </div>

        {/* Layout Card */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/40 tracking-widest px-1">布局调整</h2>
          
          <div className="bg-[#38322e] rounded-2xl p-4 shadow-lg border border-white/5 space-y-4">
            {[
              { label: '每排数量', value: gridConfig.columns, min: 1, max: 20, unit: '', key: 'columns' },
              { label: '横向间距', value: gridConfig.horizontalGap, min: 0, max: 50, unit: 'px', key: 'horizontalGap' },
              { label: '纵向间距', value: gridConfig.verticalGap, min: 0, max: 50, unit: 'px', key: 'verticalGap' },
              { label: '卡片大小', value: gridConfig.itemScale, min: 0.1, max: 1.0, step: 0.01, unit: '%', key: 'itemScale', displayValue: (v:number) => Math.round(v * 100) }
            ].map((item) => (
               <div key={item.key}>
                <div className="flex justify-between mb-1.5 items-center">
                   <label className="text-[11px] font-medium text-white/60">{item.label}</label>
                   <span className="text-[10px] text-white/80 font-bold bg-white/10 px-1.5 py-0.5 rounded-md min-w-[28px] text-center font-mono">
                     {item.displayValue ? item.displayValue(item.value) : item.value}{item.unit}
                   </span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step || 1}
                  value={item.value}
                  onChange={(e) => setGridConfig(p => ({ ...p, [item.key]: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Background Card */}
        <div className="space-y-2">
           <h2 className="text-xs font-bold text-white/40 tracking-widest px-1">画布背景</h2>
           <div className="bg-[#38322e] rounded-2xl p-4 shadow-lg border border-white/5 space-y-4">
               {/* Color Picker */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/5 rounded-lg text-white/40">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-white/70">背景颜色</span>
                  </div>
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-inner">
                      <input 
                        type="color" 
                        value={backgroundColor} 
                        onChange={onBackgroundColorChange}
                        className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-none"
                      />
                  </div>
               </div>

               {/* Pattern Selector */}
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-white/5 rounded-lg text-white/40">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-white/70">背景纹理</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PATTERNS) as PatternType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setBackgroundPattern(type)}
                          className={`
                            relative h-10 rounded-lg border flex items-center justify-center transition-all overflow-hidden
                            ${backgroundPattern === type 
                                ? 'border-primary bg-primary/20 shadow-[0_0_10px_-2px_rgba(214,140,124,0.3)]' 
                                : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}
                          `}
                          title={PATTERNS[type].name}
                        >
                            {/* Preview Pattern */}
                            {type !== 'none' && (
                                <div 
                                    className="absolute inset-0 opacity-50" 
                                    style={{
                                        backgroundImage: `url("${PATTERNS[type].svg}")`,
                                        backgroundSize: '12px 12px' 
                                    }} 
                                />
                            )}
                            <span className={`text-[10px] font-bold z-10 ${backgroundPattern === type ? 'text-primary' : 'text-white/40'}`}>
                                {PATTERNS[type].name}
                            </span>
                        </button>
                    ))}
                  </div>
               </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-white/5 bg-[#2b2623]">
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all duration-300
            ${hasSelection 
              ? 'bg-primary text-white shadow-[0_4px_12px_-2px_rgba(214,140,124,0.4)] hover:shadow-[0_6px_16px_-2px_rgba(214,140,124,0.5)] hover:-translate-y-0.5' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          <Trash2 className="w-3.5 h-3.5" />
          删除选中
        </button>
      </div>
    </div>
  );
};