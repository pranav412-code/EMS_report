"use client";

import React, { useState, useRef, useCallback } from 'react';
import { initialReportState, ReportState } from '@/lib/report-data';
import ReportHeader from './ReportHeader';
import MetaBar from './MetaBar';
import ActionBar from './ActionBar';
import SummarySection from './SummarySection';
import PartASection from './PartASection';
import PartBSection from './PartBSection';
import ConclusionSection from './ConclusionSection';
import { PlusCircle, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CustomSection from './CustomSection';

const componentMap = {
  conclusion: ConclusionSection,
  summary: SummarySection,
  partA: PartASection,
  partB: PartBSection,
  custom: CustomSection,
};

const initialSections: { id: string; component: string; props: any; isDeletable: boolean }[] = [
  { id: 'summary', component: 'summary', props: {}, isDeletable: true },
  { id: 'partA', component: 'partA', props: {}, isDeletable: true },
  { id: 'partB', component: 'partB', props: {}, isDeletable: true },
  { id: 'conclusion', component: 'conclusion', props: {}, isDeletable: true },
];

export default function ReportPage() {
  const [reportData, setReportData] = useState<ReportState>(initialReportState);
  const [sections, setSections] = useState(initialSections);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const draggedItemId = useRef<string | null>(null);

  const updateField = useCallback((key: string, value: any) => {
    setReportData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all fields and images? This action cannot be undone.')) {
      setReportData(initialReportState);
      setSections(initialSections);
    }
  }, []);

  const addSection = (type: 'overlay' | 'separate') => {
    const newSectionId = `custom-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      component: 'custom',
      props: {
        id: newSectionId,
        layout: type,
      },
      isDeletable: true,
    };
    
    setSections(prev => [...prev, newSection]);

    // Initialize data for the new section
    setReportData(prev => ({
        ...prev,
        [`${newSectionId}-title`]: "Custom Section Title",
        // for separate layout
        [newSectionId]: [],
        // for overlay layout
        [`${newSectionId}-image`]: null,
        [`${newSectionId}-overlays`]: [],
    }));
  };

  const deleteSection = (idToDelete: string) => {
    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      setSections(sections => sections.filter(s => s.id !== idToDelete));
      // Note: Data associated with the section remains in reportData but becomes orphaned.
      // This is generally fine, but for a production app, you might want to clean it up.
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    draggedItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedItemId.current === null || draggedItemId.current === targetId) {
      return;
    }

    const draggedIndex = sections.findIndex(s => s.id === draggedItemId.current);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);
    
    setSections(newSections);
    draggedItemId.current = null;
  };

  return (
    <>
      <ActionBar onReset={handleReset} reportRef={reportContainerRef} />
      <div className="report-container" ref={reportContainerRef}>
        <ReportHeader data={reportData} updateField={updateField} />
        <MetaBar data={reportData} updateField={updateField} />
        
        <div className='report-body'>
            {sections.map(section => {
            const Component = componentMap[section.component as keyof typeof componentMap];
            
            return (
                <div 
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
                className="draggable-section relative group/section"
                >
                <div className="drag-handle">
                    <GripVertical size={20} />
                </div>

                {section.isDeletable && (
                    <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 z-10 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover/section:opacity-100 transition-opacity"
                    onClick={() => deleteSection(section.id)}
                    aria-label="Delete section"
                    >
                        <Trash2 size={16}/>
                    </Button>
                )}

                <Component 
                    data={reportData} 
                    updateField={updateField}
                    {...section.props}
                />
                </div>
            )
            })}
        </div>

        <div className="p-5 flex justify-center border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <PlusCircle className="mr-2"/>
                  Add Custom Section
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => addSection('overlay')}>
                  Image with Text Overlay
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addSection('separate')}>
                  Flexible Image & Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <footer className="report-footer">
          Energy Bill Audit Report generated by Energy Audit Pro.
        </footer>
      </div>
    </>
  );
}
