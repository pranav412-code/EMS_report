"use client";

import React, { useState, useRef, useCallback } from 'react';
import { ReportState } from '@/lib/report-data';
import EditableField from './EditableField';
import ImageSlot from './ImageSlot';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, GripVertical, Columns, Image as ImageIcon, Pilcrow, Table, Heading3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';

// --- DATA STRUCTURES ---
export type Block = {
  id: string;
  type: 'text' | 'image_grid' | 'table' | 'layout' | 'subheader';
  // Text Block / Subheader Block
  content?: string;
  // ImageGrid Block
  images?: { id: string; src: string | null; caption: string }[];
  gridColumns?: number;
  // Table Block
  tableData?: string[][];
  // Layout Block
  layout?: '1-col' | '2-col' | '3-col';
  children?: Block[][]; // Array of columns, each column is an array of blocks
};

// --- HELPER FUNCTIONS ---
const createNewBlock = (type: Block['type']): Block => {
  const id = `block-${Date.now()}-${Math.random()}`;
  switch (type) {
    case 'text':
      return { id, type: 'text', content: 'Enter your text here...' };
    case 'subheader':
      return { id, type: 'subheader', content: 'Enter subheader text...' };
    case 'image_grid':
      return { id, type: 'image_grid', images: [{ id: `img-${id}`, src: null, caption: '' }], gridColumns: 1 };
    case 'table':
      return { id, type: 'table', tableData: [['Header 1', 'Header 2'], ['Data 1', 'Data 2']] };
    case 'layout':
        return { id, type: 'layout', layout: '2-col', children: [[], []] };
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

// --- PROPS ---
type CustomSectionProps = {
  id: string;
  data: ReportState;
  updateField: (id: string, value: any) => void;
  isLocked: boolean;
};

// --- MAIN COMPONENT ---
export default function CustomSection({ id: sectionId, data, updateField, isLocked }: CustomSectionProps) {
  const sectionTitleKey = `${sectionId}-title`;
  const blocks: Block[] = data[sectionId] || [];

  const draggedBlockId = useRef<string | null>(null);
  const dropTarget = useRef<{ path: number[] } | null>(null);

  const updateBlocks = (newBlocks: Block[]) => {
    updateField(sectionId, newBlocks);
  };

  const findBlockPath = (targetId: string, searchBlocks: Block[]): number[] | null => {
    for (let i = 0; i < searchBlocks.length; i++) {
        const block = searchBlocks[i];
        if (block.id === targetId) return [i];
        if (block.type === 'layout' && block.children) {
            for (let j = 0; j < block.children.length; j++) {
                const childPath = findBlockPath(targetId, block.children[j]);
                if (childPath) return [i, j, ...childPath];
            }
        }
    }
    return null;
  };
  
  const getBlockFromPath = (path: number[], searchBlocks: Block[]): Block | undefined => {
    let current: Block | undefined = searchBlocks[path[0]];
    for (let i = 1; i < path.length; i++) {
        if (!current) return undefined;
        if (current.type === 'layout' && current.children) {
            const [colIndex, blockIndex] = path.slice(i);
             if (current.children[colIndex] && current.children[colIndex][blockIndex]) {
                 current = current.children[colIndex][blockIndex];
                 i += 1; // we've consumed two path segments
             } else {
                 return undefined;
             }
        } else {
             return undefined;
        }
    }
    return current;
  };

  const removeBlockByPath = (path: number[], currentBlocks: Block[]): Block[] => {
      if (path.length === 1) {
          return currentBlocks.filter((_, index) => index !== path[0]);
      }
      const newBlocks = [...currentBlocks];
      let parent: any = newBlocks; // Could be Block[] or Block
      for (let i = 0; i < path.length - 1; i++) {
          if (Array.isArray(parent)) {
              parent = parent[path[i]];
          } else if (parent.type === 'layout' && parent.children) {
              const colIndex = path[i];
              const blockIndex = path[i+1];
              if (i === path.length - 2) { // The direct parent
                  parent.children[colIndex].splice(blockIndex, 1);
                  return newBlocks;
              }
              parent = parent.children[colIndex][blockIndex];
              i++;
          }
      }
      return newBlocks;
  };


 const updateBlock = (blockId: string, newValues: Partial<Block>) => {
    if (isLocked) return;
    const blockPath = findBlockPath(blockId, blocks);
    if (!blockPath) return;

    let newBlocks = JSON.parse(JSON.stringify(blocks));
    let blockToUpdate: Block | undefined = newBlocks;

    let parent: any = { children: [newBlocks] };
    let finalKey: number | string = 0;

    for (let i = 0; i < blockPath.length; i++) {
        const key = blockPath[i];
        if (i === blockPath.length - 1) {
            finalKey = key;
            break;
        }
        if (blockToUpdate && blockToUpdate.type === 'layout' && blockToUpdate.children) {
            const [colIndex, blockIndex] = blockPath.slice(i+1);
            parent = blockToUpdate.children[colIndex];
            finalKey = blockIndex;
            i++;
        } else if (Array.isArray(blockToUpdate)) {
            parent = blockToUpdate;
            blockToUpdate = blockToUpdate[key];
        } else {
           console.error("Path traversal failed");
           return;
        }
    }
    
    if (parent && typeof finalKey === 'number' && parent[finalKey]) {
        parent[finalKey] = { ...parent[finalKey], ...newValues };
    } else {
        newBlocks[blockPath[0]] = { ...newBlocks[blockPath[0]], ...newValues };
    }
    
    updateBlocks(newBlocks);
  };
  
  const addBlock = (type: Block['type'], parentPath?: number[]) => {
      if (isLocked) return;
      const newBlock = createNewBlock(type);
      let newBlocks = [...blocks];
      if (parentPath) {
          let parent: any = newBlocks;
          for (let i=0; i < parentPath.length; i++) {
              if (Array.isArray(parent)) {
                parent = parent[parentPath[i]];
              } else if (parent.type === 'layout' && parent.children) {
                const colIndex = parentPath[i];
                parent = parent.children[colIndex];
              }
          }
          if (Array.isArray(parent)) {
            parent.push(newBlock);
          } else {
            console.error("Cannot add block to non-array parent");
          }
      } else {
        newBlocks.push(newBlock);
      }
      updateBlocks(newBlocks);
  };
  
 const deleteBlock = (blockId: string) => {
    if (isLocked || !window.confirm('Are you sure you want to delete this block?')) return;
    const path = findBlockPath(blockId, blocks);
    if (!path) return;
    updateBlocks(removeBlockByPath(path, blocks));
  };


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, blockId: string) => {
      if (isLocked) return;
      e.stopPropagation();
      draggedBlockId.current = blockId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, path: number[]) => {
      if (isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      dropTarget.current = { path };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      if (isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      if (!draggedBlockId.current || !dropTarget.current) return;
      
      const sourcePath = findBlockPath(draggedBlockId.current, blocks);
      const targetPath = dropTarget.current.path;

      if (!sourcePath || JSON.stringify(sourcePath) === JSON.stringify(targetPath)) return;

      let newBlocks = JSON.parse(JSON.stringify(blocks));

      // Get source block and remove it
      let sourceParent: any = { children: [newBlocks]};
      let temp: any = newBlocks;
      for (let i = 0; i < sourcePath.length -1; i++) {
        temp = temp[sourcePath[i]];
        if(temp.type === 'layout') {
          const [col, item] = sourcePath.slice(i+1)
          sourceParent = temp.children[col]
          i++
        } else {
          sourceParent = temp
        }
      }
      if(!Array.isArray(sourceParent)) sourceParent = newBlocks;
      const [draggedBlock] = sourceParent.splice(sourcePath[sourcePath.length - 1], 1);
      

      // Add to target
       let targetParent: any = { children: [newBlocks]};
       temp = newBlocks
       for (let i = 0; i < targetPath.length -1; i++) {
         temp = temp[targetPath[i]];
         if(temp.type === 'layout') {
          const [col, item] = targetPath.slice(i+1)
          targetParent = temp.children[col]
          i++
        } else {
          targetParent = temp
        }
      }
      if(!Array.isArray(targetParent)) targetParent = newBlocks;
      targetParent.splice(targetPath[targetPath.length - 1], 0, draggedBlock);

      updateBlocks(newBlocks);
      draggedBlockId.current = null;
      dropTarget.current = null;
  };

  const AddBlockButton = ({ parentPath }: { parentPath?: number[] }) => {
    if (isLocked) return null;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full my-2 add-block-btn">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => addBlock('text', parentPath)}><Pilcrow className='mr-2 h-4 w-4'/>Text</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addBlock('subheader', parentPath)}><Heading3 className='mr-2 h-4 w-4'/>Subheader</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addBlock('image_grid', parentPath)}><ImageIcon className='mr-2 h-4 w-4'/>Image Grid</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addBlock('table', parentPath)}><Table className='mr-2 h-4 w-4'/>Table</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addBlock('layout', parentPath)}><Columns className='mr-2 h-4 w-4'/>Columns (Layout)</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  };

  const renderBlock = (block: Block, path: number[]): React.ReactNode => {
    
    const BlockContainer = ({ children, className }: { children: React.ReactNode, className?: string}) => (
       <div 
         className={cn("block-container relative group/block my-2", className)}
         onDragOver={(e) => handleDragOver(e, path)}
       >
        {!isLocked && (
            <div className="block-toolbar" onMouseDown={e => e.stopPropagation()}>
                <div 
                    className="drag-handle-block"
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.id)}
                >
                    <GripVertical size={16} />
                </div>
                 <Button 
                    size="icon" variant="ghost" 
                    className="delete-handle-block"
                    onClick={() => deleteBlock(block.id)}
                 >
                    <Trash2 className="w-4 h-4"/>
                </Button>
            </div>
        )}
        {children}
      </div>
    );
    
    switch (block.type) {
      case 'text':
        return (
          <BlockContainer key={block.id}>
            <div className='p-3 border rounded-lg bg-secondary/30'>
              <EditableField
                  id={`${block.id}-content`}
                  value={block.content || ''}
                  onChange={(_, value) => updateBlock(block.id, { content: value })}
                  type="richtext"
                  className="min-h-[100px]"
                  disabled={isLocked}
                />
            </div>
          </BlockContainer>
        );
      case 'subheader':
        return (
          <BlockContainer key={block.id} className="my-3">
              <EditableField
                  id={`${block.id}-content`}
                  value={block.content || ''}
                  onChange={(_, value) => updateBlock(block.id, { content: value })}
                  type="text"
                  tag="h3"
                  className="!text-base !font-semibold text-primary/90"
                  disabled={isLocked}
                />
          </BlockContainer>
        );
      case 'image_grid':
        return (
          <BlockContainer key={block.id}>
            <div className='p-3 border rounded-lg'>
               <div className='grid gap-3' style={{gridTemplateColumns: `repeat(${block.gridColumns || 1}, 1fr)`}}>
                  {(block.images || []).map((img, index) => (
                    <div key={img.id} className="relative group/image">
                      <ImageSlot
                        id={img.id}
                        src={img.src}
                        onUpload={(_, src) => {
                          const newImages = [...(block.images || [])];
                          newImages[index].src = src;
                          updateBlock(block.id, { images: newImages });
                        }}
                        className='min-h-[160px]'
                        disabled={isLocked}
                      />
                       {!isLocked && block.images && block.images.length > 1 && (
                         <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100" onClick={() => {
                             const newImages = (block.images || []).filter(i => i.id !== img.id);
                             updateBlock(block.id, { images: newImages });
                         }}><Trash2 className="w-4 h-4"/></Button>
                      )}
                      {!isLocked && (
                          <div className='p-1 pt-2'>
                              <EditableField
                                id={`${img.id}-caption`}
                                value={img.caption || ''}
                                onChange={(_, value) => {
                                    const newImages = [...(block.images || [])];
                                    newImages[index].caption = value;
                                    updateBlock(block.id, { images: newImages });
                                }}
                                type="text"
                                className="w-full text-xs text-center text-muted-foreground italic"
                                placeholder="Add a caption..."
                                disabled={isLocked}
                              />
                          </div>
                      )}
                    </div>
                  ))}
               </div>
               {!isLocked && (
                 <div className='flex items-center gap-2 mt-3'>
                   <Button size="sm" variant="outline" onClick={() => {
                       const newImages = [...(block.images || []), {id: `img-${Date.now()}`, src: null, caption: ''}];
                       updateBlock(block.id, {images: newImages});
                   }}><PlusCircle size={14} className='mr-2'/>Add Image</Button>
                   {block.images && block.images.length > 1 && (
                     <>
                       <label className='text-sm ml-auto'>Cols:</label>
                       <select value={block.gridColumns} onChange={e => updateBlock(block.id, {gridColumns: parseInt(e.target.value)})} className='border rounded-md px-2 py-1 text-sm bg-background'>
                         <option value={1}>1</option>
                         <option value={2}>2</option>
                         <option value={3}>3</option>
                         <option value={4}>4</option>
                       </select>
                     </>
                   )}
                 </div>
               )}
            </div>
          </BlockContainer>
        );
      case 'table':
          const updateCell = (rowIndex: number, colIndex: number, value: string) => {
              const newTableData = JSON.parse(JSON.stringify(block.tableData || []));
              newTableData[rowIndex][colIndex] = value;
              updateBlock(block.id, { tableData: newTableData });
          };
          const addRow = () => {
              const newTableData = JSON.parse(JSON.stringify(block.tableData || []));
              const numCols = newTableData[0]?.length || 1;
              newTableData.push(Array(numCols).fill(''));
              updateBlock(block.id, { tableData: newTableData });
          }
          const addCol = () => {
              const newTableData = JSON.parse(JSON.stringify(block.tableData || []));
              newTableData.forEach((row: any) => row.push(''));
              updateBlock(block.id, { tableData: newTableData });
          }
          const removeRow = (rowIndex: number) => {
              if ((block.tableData || []).length <= 1) return;
              const newTableData = (block.tableData || []).filter((_, i) => i !== rowIndex);
              updateBlock(block.id, { tableData: newTableData });
          }
          const removeCol = (colIndex: number) => {
              if ((block.tableData || [])[0]?.length <= 1) return;
              const newTableData = (block.tableData || []).map(row => row.filter((_, i) => i !== colIndex));
              updateBlock(block.id, { tableData: newTableData });
          }
        return (
          <BlockContainer key={block.id}>
             <div className="p-3 border rounded-lg overflow-x-auto">
                <table className='w-full border-collapse editable-table'>
                    <tbody>
                        {(block.tableData || []).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} contentEditable={!isLocked} suppressContentEditableWarning onBlur={e => updateCell(rowIndex, colIndex, e.currentTarget.innerText)} className='border p-2 min-w-[100px]'>
                                        {cell}
                                    </td>
                                ))}
                                {!isLocked && (
                                    <td className='p-1 border-l-0 border-transparent'>
                                        <Button size='icon' variant='ghost' className='h-6 w-6 text-muted-foreground' onClick={() => removeRow(rowIndex)}><Trash2 size={14}/></Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {!isLocked && (
                    <div className='flex items-center gap-2 mt-2 text-sm'>
                        <Button onClick={addRow} variant="ghost" size="sm"><PlusCircle size={14} className='mr-1'/>Row</Button>
                        <Button onClick={addCol} variant="ghost" size="sm"><PlusCircle size={14} className='mr-1'/>Col</Button>
                        {(block.tableData || [])[0]?.map((_, colIndex) => (
                            <Button key={colIndex} onClick={() => removeCol(colIndex)} variant="ghost" size="icon" className='h-6 w-6 ml-auto first:ml-auto text-muted-foreground'><Trash2 size={14}/></Button>
                        ))}
                    </div>
                 )}
            </div>
          </BlockContainer>
        );
      case 'layout':
        const columnClass = { '1-col': 'grid-cols-1', '2-col': 'grid-cols-2', '3-col': 'grid-cols-3'}[block.layout || '1-col'];
        return (
          <BlockContainer key={block.id}>
             <div className='p-3 border rounded-lg bg-primary/5'>
                {!isLocked && (
                    <div className='flex items-center gap-2 mb-2'>
                      <label className='text-sm font-medium'>Columns:</label>
                      <select value={block.layout} onChange={e => {
                          const newLayout = e.target.value as '1-col' | '2-col' | '3-col';
                          const numCols = {'1-col':1, '2-col':2, '3-col':3}[newLayout];
                          const newChildren = Array.from({length: numCols}, (_, i) => block.children?.[i] || []);
                          updateBlock(block.id, {layout: newLayout, children: newChildren });
                      }} className='border rounded-md px-2 py-1 text-sm bg-background'>
                        <option value="1-col">1</option>
                        <option value="2-col">2</option>
                        <option value="3-col">3</option>
                      </select>
                    </div>
                )}
                <div className={cn('grid gap-4', columnClass)}>
                    {(block.children || []).map((colBlocks, colIndex) => (
                        <div key={colIndex} className='flex flex-col min-h-[100px]' onDragOver={e => handleDragOver(e, [...path, colIndex, colBlocks.length])}>
                            {colBlocks.map((childBlock, blockIndex) => renderBlock(childBlock, [...path, colIndex, blockIndex]))}
                            <AddBlockButton parentPath={[...path, colIndex]} />
                        </div>
                    ))}
                </div>
            </div>
          </BlockContainer>
        );
      default:
        return <div key={block.id}>Unknown block type</div>;
    }
  };

  return (
    <div className="report-section" id={sectionId}>
      <EditableField id={sectionTitleKey} value={data[sectionTitleKey] || ''} onChange={updateField} className="mb-3" tag="h2" disabled={isLocked}/>
      
      <div onDrop={handleDrop}>
        {blocks.map((block, index) => renderBlock(block, [index]))}
      </div>

      <AddBlockButton />
    </div>
  );
}

// Add some extra CSS for the new block editor handles
if (typeof window !== 'undefined') {
    const styleId = 'custom-section-styles';
    if (!document.getElementById(styleId)) {
        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.innerText = `
          .block-toolbar {
            position: absolute;
            top: -12px;
            right: 8px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.2s, transform 0.2s;
            transform: translateY(4px);
            display: flex;
            align-items: center;
            gap: 2px;
            background-color: hsl(var(--background));
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            padding: 2px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          }
          .block-container:hover .block-toolbar {
            opacity: 1;
            transform: translateY(0);
          }
          .block-toolbar .drag-handle-block {
            cursor: move;
            color: hsl(var(--muted-foreground));
            padding: 4px;
          }
          .block-toolbar .drag-handle-block:hover {
              color: hsl(var(--foreground));
          }
          .block-toolbar .delete-handle-block {
            height: 1.75rem;
            width: 1.75rem;
            color: hsl(var(--muted-foreground));
          }
          .block-toolbar .delete-handle-block:hover {
              background-color: hsl(var(--destructive) / 0.1);
              color: hsl(var(--destructive));
          }
          .editable-table td {
              outline: none;
          }
          .editable-table td:focus {
              background-color: hsl(var(--accent));
          }
        `;
        document.head.appendChild(styleSheet);
    }
}
