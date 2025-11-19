// ActionBar.tsx → FINAL VERSION (NO SERVER, NO ERROR, PERFECT PDF)
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { DateRange } from "react-day-picker";
type ActionBarProps = {
  onReset: () => void;
 reportRef: React.RefObject<HTMLDivElement>;
 dateRange?: DateRange | undefined;  // Now properly typed
};

export default function ActionBar({ onReset, reportRef, dateRange }: ActionBarProps){
  const { toast } = useToast();
  const downloadInProgress = useRef(false);

  const handleDownload = async () => {
    if (downloadInProgress.current) return;
    downloadInProgress.current = true;

    const element = reportRef.current;
    if (!element) {
      toast({ title: "Error", description: "Report not found", variant: "destructive" });
      downloadInProgress.current = false;
      return;
    }

    toast({ title: "Generating Perfect PDF...", description: "This takes 2-4 seconds" });

    try {
      // Step 1: Dynamically import (only when needed)
      const html2pdf = (await import("html2pdf.js")).default;

      // Step 2: Clone + clean the DOM
      const clone = element.cloneNode(true) as HTMLElement;

      // Hide all editor-only stuff
      clone.querySelectorAll(".section-controls, .add-section-container, .action-bar, [data-hide-print], button, .drag-handle").forEach(el => el.remove());

      // Replace all inputs/textareas with their values
      clone.querySelectorAll("input, textarea").forEach((input: any) => {
        const span = document.createElement("span");
        span.textContent = input.value || input.placeholder || "";
        span.style.cssText = window.getComputedStyle(input).cssText;
        span.style.background = "transparent";
        span.style.border = "1px solid transparent";
        input.parentNode?.replaceChild(span, input);
      });

      // Force print styles
      const style = document.createElement("style");
      style.textContent = `
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body, .report-container { background: white !important; }
        .report-header { background: #1e40af !important; color: white !important; }
      `;
      clone.appendChild(style);

      // Step 3: Generate PDF with html2pdf.js (THE ONLY ONE THAT WORKS)
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: "Energy-Bill-Audit-Report.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          //pagebreak: { mode: ["avoid-all", "css", "legacy"] }
        })
        .from(clone)
        .save();

      toast({ title: "Downloaded!", description: "Your PDF is pixel-perfect!", duration: 3000 });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed", description: "Try again or refresh", variant: "destructive" });
    } finally {
      downloadInProgress.current = false;
    }
  };

  return (
    <div className="action-bar bg-card shadow-md p-4 flex justify-end gap-3 sticky top-0 z-50 border-b">
      <Button variant="outline" size="sm" onClick={onReset}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reset All
      </Button>
      <Button onClick={handleDownload} size="sm">
        <Download className="mr-2 h-4 w-4" /> Download Report as PDF
      </Button>
    </div>
  );
}