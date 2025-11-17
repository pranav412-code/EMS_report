"use client";

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ReportState } from '@/lib/report-data';
import EditableField from './EditableField';
import ImageSlot from './ImageSlot';
import { Button } from '@/components/ui/button';
import { Text, Trash2, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react';
import DraggableText, { Overlay } from './DraggableText';
import OverlayEditor from './OverlayEditor';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type CustomSectionProps = {
  id: string;
  layout: 'overlay' | 'separate';
  data: ReportState;
  updateField: (id: string, value: any) => void;
};

// Data structures for the 'separate' layout
type Block = {
  id: string;
  type: 'image' | 'text';
  content: string; // for text block
  src: string | null; // for image block
};

type Item = {
  id: string;
  title: string;
  subtitle: string;
  imageBlocks: Block[];
  textBlock: Block;
  layout: 'single' | 'grid';
  gridColumns: number;
  textPosition: 'top' | 'bottom' | 'left' | 'right';
};

const createNewItem = (): Item => ({
  id: `item-${Date.now()}`,
  title: "New Item Title",
  subtitle: "Item subtitle",
  imageBlocks: [{ id: `img-${Date.now()}`, type: 'image', src: null, content: '' }],
  textBlock: { id: `txt-${Date.now()}`, type: 'text', content: 'Enter your analysis or remarks here.', src: null },
  layout: 'single',
  gridColumns: 2,
  textPosition: 'bottom',
});


export default function CustomSection({ id, layout, data, updateField }: CustomSectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sectionDataKey = id;
  const sectionTitleKey = `${id}-title`;

  // For 'overlay' layout
  const imageId = `${id}-image`;
  const overlaysId = `${id}-overlays`;
  const overlays = data[overlaysId] || [];
  
  // For 'separate' layout
  const items: Item[] = data[sectionDataKey] || [];

  const updateItems = (newItems: Item[]) => {
    updateField(sectionDataKey, newItems);
  };
  
  const addItem = () => {
    updateItems([...items, createNewItem()]);
  };

  const deleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      updateItems(items.filter(item => item.id !== itemId));
    }
  };

  const updateItem = (itemId: string, newValues: Partial<Item>) => {
    updateItems(items.map(item => item.id === itemId ? { ...item, ...newValues } : item));
  };
  
  const updateItemBlock = (itemId: string, blockId: string, newValues: Partial<Block>) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newImageBlocks = item.imageBlocks.map(b => b.id === blockId ? { ...b, ...newValues } : b);
    let newTextBlock = item.textBlock;
    if (item.textBlock.id === blockId) {
      newTextBlock = { ...item.textBlock, ...newValues };
    }
    updateItems(items.map(i => i.id === itemId ? { ...i, imageBlocks: newImageBlocks, textBlock: newTextBlock } : i));
  };

  const addImageToItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newImageBlock: Block = { id: `img-${Date.now()}`, type: 'image', src: null, content: '' };
    updateItem(itemId, { imageBlocks: [...item.imageBlocks, newImageBlock] });
  };
  
  const deleteImageFromItem = (itemId: string, blockId: string) => {
     const item = items.find(i => i.id === itemId);
    if (!item || item.imageBlocks.length <= 1) return; // Don't delete the last image
    updateItem(itemId, { imageBlocks: item.imageBlocks.filter(b => b.id !== blockId) });
  };


  // Overlay specific functions
  const addTextOverlay = () => {
    const newOverlay: Overlay = { id: Date.now(), text: 'New Text', color: '#000000', size: 24, x: 50, y: 50, bold: false, italic: false };
    updateField(overlaysId, [...overlays, newOverlay]);
    setSelectedId(newOverlay.id);
  };

  const updateOverlay = useCallback((overlayId: number, changes: Partial<Overlay>) => {
    const newOverlays = overlays.map((o: Overlay) => (o.id === overlayId ? { ...o, ...changes } : o));
    updateField(overlaysId, newOverlays);
  }, [overlays, updateField, overlaysId]);

  const deleteOverlay = (overlayId: number) => {
    updateField(overlaysId, overlays.filter((o: Overlay) => o.id !== overlayId));
    if (selectedId === overlayId) setSelectedId(null);
  };

  const handleDrag = useCallback((overlayId: number, dx: number, dy: number) => {
    const newOverlays = overlays.map((o: Overlay) => (o.id === overlayId ? { ...o, x: o.x + dx, y: o.y + dy } : o));
    updateField(overlaysId, newOverlays);
  }, [overlays, updateField, overlaysId]);

  const selectedOverlay = overlays.find((o: Overlay) => o.id === selectedId);
  
  const renderSeparateLayout = () => (
    <div className='flex flex-col gap-4'>
        {items.map((item) => {
          const isGrid = item.layout === 'grid';
          const textOnSide = item.textPosition === 'left' || item.textPosition === 'right';

          const textContent = (
            <div className="remarks h-full flex flex-col">
              <EditableField
                  id={`${item.id}-text`}
                  value={item.textBlock.content}
                  onChange={(_, value) => updateItemBlock(item.id, item.textBlock.id, { content: value })}
                  type="richtext"
                  className="min-h-[150px] flex-grow"
                />
            </div>
          );

          const imageContent = (
            <div className={cn(
              isGrid ? 'grid gap-3' : 'flex',
            )} style={isGrid ? {gridTemplateColumns: `repeat(${item.gridColumns}, 1fr)`} : {}}>
              {item.imageBlocks.map((block, index) => (
                <div key={block.id} className="relative group/image">
                   <ImageSlot 
                    id={`${item.id}-${block.id}`} 
                    src={block.src} 
                    onUpload={(_, src) => updateItemBlock(item.id, block.id, { src })}
                    hint={`Upload image ${index + 1}`}
                    className="h-full"
                  />
                  {isGrid && item.imageBlocks.length > 1 && (
                     <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100"
                      onClick={() => deleteImageFromItem(item.id, block.id)}
                    >
                       <Trash2 className="w-4 h-4"/>
                     </Button>
                  )}
                </div>
              ))}
            </div>
          );

          return (
            <div key={item.id} className="chart-card p-4 flex flex-col gap-4">
              {/* Item Header & Controls */}
              <div className='flex justify-between items-start gap-2'>
                <div className='flex-grow'>
                  <EditableField id={`${item.id}-title`} value={item.title} onChange={(_,v) => updateItem(item.id, {title: v})} className='text-base font-semibold' tag="h3"/>
                  <EditableField id={`${item.id}-subtitle`} value={item.subtitle} onChange={(_,v) => updateItem(item.id, {subtitle: v})} className='text-sm text-muted-foreground' tag="p" />
                </div>
                 <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex-shrink-0'>
                  <Trash2 size={16}/>
                 </Button>
              </div>

              {/* Layout Controls */}
              <div className='flex flex-wrap gap-2 items-center bg-secondary/30 p-2 rounded-lg'>
                  <Label className='text-xs font-semibold'>Layout:</Label>
                  <div className='flex items-center gap-1 border bg-background rounded-md p-0.5'>
                    <Button size="sm" variant={item.layout === 'single' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {layout: 'single'})} className='h-7'>Single</Button>
                    <Button size="sm" variant={item.layout === 'grid' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {layout: 'grid'})} className='h-7'>Grid</Button>
                  </div>
                  {item.layout === 'grid' && (
                     <>
                      <Label className='text-xs font-semibold ml-2'>Cols:</Label>
                      <Input type="number" min={2} max={4} value={item.gridColumns} onChange={(e) => updateItem(item.id, {gridColumns: parseInt(e.target.value, 10) || 2})} className='w-16 h-8' />
                      <Button size="icon" variant="outline" onClick={() => addImageToItem(item.id)} className="h-8 w-8 ml-2"><PlusCircle size={16}/></Button>
                     </>
                  )}
                  <Label className='text-xs font-semibold ml-auto'>Text Pos:</Label>
                  <div className='flex items-center gap-1 border bg-background rounded-md p-0.5'>
                      <Button size="icon" variant={item.textPosition === 'top' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {textPosition: 'top'})} className='h-7 w-7'><ArrowUp size={16}/></Button>
                      <Button size="icon" variant={item.textPosition === 'bottom' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {textPosition: 'bottom'})} className='h-7 w-7'><ArrowDown size={16}/></Button>
                      <Button size="icon" variant={item.textPosition === 'left' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {textPosition: 'left'})} className='h-7 w-7'><ArrowLeft size={16}/></Button>
                      <Button size="icon" variant={item.textPosition === 'right' ? 'secondary' : 'ghost'} onClick={() => updateItem(item.id, {textPosition: 'right'})} className='h-7 w-7'><ArrowRight size={16}/></Button>
                  </div>
              </div>
              
              {/* Content Area */}
              <div className={cn(
                'grid gap-4',
                 textOnSide ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              )}>
                {item.textPosition === 'top' && textContent}
                {item.textPosition === 'left' && textContent}
                {imageContent}
                {item.textPosition === 'right' && textContent}
                {item.textPosition === 'bottom' && textContent}
              </div>

            </div>
          )
        })}
        <Button onClick={addItem} variant="outline" className='w-full'><PlusCircle className='mr-2'/>Add Item to Section</Button>
    </div>
  );

  const renderOverlayLayout = () => (
     <div className="chart-card">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
          <div className="flex flex-col gap-3 border p-4 rounded-lg">
            <h4 className="font-semibold">Overlay Tools</h4>
              <ImageSlot 
              id={imageId} 
              src={data[imageId]} 
              onUpload={updateField}
              className="!min-h-[150px]"
              hint="Upload background"
            />
            <Button onClick={addTextOverlay} disabled={!data[imageId]} variant="secondary">
              <Text className="mr-2"/> Add Text
            </Button>
            {selectedOverlay && (
              <OverlayEditor
                overlay={selectedOverlay}
                onChange={(changes) => updateOverlay(selectedId!, changes)}
                onDelete={() => deleteOverlay(selectedId!)}
              />
            )}
          </div>

          <div 
            ref={containerRef} 
            className="relative min-h-[400px] bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg flex items-center justify-center overflow-hidden"
            onClick={(e) => { if (e.target === containerRef.current) setSelectedId(null); }}
          >
            {data[imageId] ? (
              <Image src={data[imageId]} alt="Custom section background" fill style={{ objectFit: 'contain' }} />
            ) : (
              <div className="text-muted-foreground">Upload an image to start</div>
            )}
            {overlays.map((overlay: Overlay) => (
              <DraggableText
                key={overlay.id}
                overlay={overlay}
                isSelected={selectedId === overlay.id}
                onSelect={() => setSelectedId(overlay.id)}
                onDrag={(dx, dy) => handleDrag(overlay.id, dx, dy)}
                containerRef={containerRef}
              />
            ))}
          </div>
        </div>
      </div>
  );

  return (
    <div className="report-section" id={id}>
       <EditableField id={sectionTitleKey} value={data[sectionTitleKey] || ''} onChange={updateField} className="mb-3" tag="h2"/>
      
      {layout === 'overlay' ? renderOverlayLayout() : renderSeparateLayout()}
    </div>
  );
}
