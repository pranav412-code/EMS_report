"use client";

import React, { useState, useRef, useCallback } from "react";
import { initialReportState, ReportState } from "@/lib/report-data";
import ReportHeader from "./ReportHeader";
import MetaBar from "./MetaBar";
import ActionBar from "./ActionBar";
import ConclusionSection from "./ConclusionSection";
import { PlusCircle, GripVertical, Trash2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomSection, { Block } from "./CustomSection";

const componentMap = {
  conclusion: ConclusionSection,
  custom: CustomSection,
};

type Section = {
  id: string;
  component: string;
  props: any;
  isDeletable: boolean;
  isLocked: boolean;
};

const createNewSection = (id: string, title: string): Section => ({
  id,
  component: "custom",
  props: { id },
  isDeletable: true,
  isLocked: false,
});

const initialSections: Section[] = [createNewSection("custom-initial", "Section Title")];

export default function ReportPage() {
  const [reportData, setReportData] = useState<ReportState>(() => {
    const initialId = "custom-initial";
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: "layout",
      layout: "1-col",
      children: [[]],
    };
    return {
      ...initialReportState,
      [`${initialId}-title`]: "Your Section Title",
      [initialId]: [newBlock],
    };
  });

  const [sections, setSections] = useState(initialSections);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const draggedItemId = useRef<string | null>(null);

  const updateField = useCallback((key: string, value: any) => {
    setReportData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to reset all fields and images? This action cannot be undone."
      )
    ) {
      const newInitialSectionId = `custom-${Date.now()}`;
      const newInitialSection = createNewSection(newInitialSectionId, "Section Title");
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: "layout",
        layout: "1-col",
        children: [[]],
      };
      setReportData({
        ...initialReportState,
        [`${newInitialSectionId}-title`]: "Section Title",
        [newInitialSectionId]: [newBlock],
      });
      setSections([newInitialSection]);
    }
  }, []);

  const addSection = () => {
    const newSectionId = `custom-${Date.now()}`;
    const newSection = createNewSection(newSectionId, "New Section Title");

    setSections((prev) => [...prev, newSection]);

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: "layout",
      layout: "1-col",
      children: [[]],
    };
    setReportData((prev) => ({
      ...prev,
      [`${newSectionId}-title`]: "New Section Title",
      [newSectionId]: [newBlock],
    }));
  };

  const deleteSection = (idToDelete: string) => {
    const section = sections.find((s) => s.id === idToDelete);
    if (!section || !section.isDeletable || section.isLocked) return;

    if (
      window.confirm(
        "Are you sure you want to delete this section? This action cannot be undone."
      )
    ) {
      setSections((sections) => sections.filter((s) => s.id !== idToDelete));
    }
  };

  const toggleLockSection = (idToToggle: string) => {
    setSections((sections) =>
      sections.map((s) =>
        s.id === idToToggle ? { ...s, isLocked: !s.isLocked } : s
      )
    );
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section?.isLocked) {
      e.preventDefault();
      return;
    }
    draggedItemId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedItemId.current === null || draggedItemId.current === targetId) {
      return;
    }

    const targetSection = sections.find((s) => s.id === targetId);
    if (targetSection?.isLocked) return;

    const draggedIndex = sections.findIndex((s) => s.id === draggedItemId.current);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    setSections(newSections);
    draggedItemId.current = null;
  };

  const conclusionSection = sections.find((s) => s.component === "conclusion");
  const customSections = sections.filter((s) => s.component !== "conclusion");

  // ---------- UPDATED: renderer with optional wrapping ----------
  const renderSection = (section: Section, options?: { wrap?: boolean }) => {
    const wrap = options?.wrap ?? true;
    const Component = componentMap[section.component as keyof typeof componentMap];
    if (!Component) return null;

    const sectionContent = (
      <Component
        data={reportData}
        updateField={updateField}
        isLocked={section.isLocked}
        {...section.props}
      />
    );

    // Conclusion: usually its own page
    if (section.component === "conclusion") {
      if (!wrap) return sectionContent;
      return (
        <div key={section.id} className="report-section">
          {sectionContent}
        </div>
      );
    }

    // Custom sections (draggable)
    if (!wrap) {
      // used for FIRST section inside header's page
      return (
        <div
          key={section.id}
          draggable={!section.isLocked}
          onDragStart={(e) => handleDragStart(e, section.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, section.id)}
          className="draggable-section relative group/section"
          data-locked={section.isLocked}
        >
          <div className="section-controls">
            {!section.isLocked && (
              <div className="drag-handle" title="Drag to reorder">
                <GripVertical size={20} />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-secondary"
              onClick={() => toggleLockSection(section.id)}
              aria-label={section.isLocked ? "Unlock section" : "Lock section"}
              title={section.isLocked ? "Unlock section" : "Lock section"}
            >
              {section.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </Button>
            {section.isDeletable && !section.isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => deleteSection(section.id)}
                aria-label="Delete section"
                title="Delete section"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>

          {sectionContent}
        </div>
      );
    }

    // Default: wrap in its own report-section page
    return (
      <div
        key={section.id}
        className="report-section draggable-section relative group/section"
        draggable={!section.isLocked}
        onDragStart={(e) => handleDragStart(e, section.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, section.id)}
        data-locked={section.isLocked}
      >
        <div className="section-controls">
          {!section.isLocked && (
            <div className="drag-handle" title="Drag to reorder">
              <GripVertical size={20} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-secondary"
            onClick={() => toggleLockSection(section.id)}
            aria-label={section.isLocked ? "Unlock section" : "Lock section"}
            title={section.isLocked ? "Unlock section" : "Lock section"}
          >
            {section.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </Button>
          {section.isDeletable && !section.isLocked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => deleteSection(section.id)}
              aria-label="Delete section"
              title="Delete section"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>

        {sectionContent}
      </div>
    );
  };

  // ---------- NEW: split first section vs others ----------
  const [firstCustom, ...otherCustom] = customSections;

  return (
    <>
      <ActionBar 
      onReset={handleReset} 
      reportRef={reportContainerRef} 
      dateRange={reportData.period}   // ← ADD THIS LINE
    />

      <div className="report-container" ref={reportContainerRef}>
        {/* PAGE 1+: Header + MetaBar + FIRST custom section */}
        <div className="report-section">
          <ReportHeader data={reportData} updateField={updateField} />
          <MetaBar data={reportData} updateField={updateField} />
          {firstCustom && renderSection(firstCustom, { wrap: false })}
        </div>

        <div className="report-body">
          {/* Each remaining section gets at least one full page */}
          {otherCustom.map((s) => renderSection(s))}
          {conclusionSection && renderSection(conclusionSection as Section)}
        </div>

        <div className="p-5 flex justify-center border-t add-section-container">
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={addSection}
          >
            <PlusCircle className="mr-2" />
            Add Section
          </Button>
        </div>

        <footer className="report-footer">
          Energy Bill Audit Report generated by Energy Audit Pro.
        </footer>
      </div>
    </>
  );
}
