"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

type ActionBarProps = {
  onReset: () => void;
  reportRef: React.RefObject<HTMLDivElement>;
};

export default function ActionBar({ onReset, reportRef }: ActionBarProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    const reportContainer = reportRef.current;
    if (!reportContainer) {
      toast({
        title: "Error",
        description: "Could not find report content to download.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
        title: "Generating PDF...",
        description: "Please wait while your report is being generated. This may take a moment.",
    });

    const originalBackgroundColor = reportContainer.style.backgroundColor;
    reportContainer.style.backgroundColor = 'white';

    // Temporarily hide elements that shouldn't be in the PDF
    const elementsToHide = reportContainer.querySelectorAll('.drag-handle, .chart-tools, .ai-insights-btn, [data-hide-print="true"]');
    elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    // Replace textareas with divs for rendering
    const textareas = reportContainer.querySelectorAll('textarea');
    const originalTextareas: { parent: ParentNode; nextSibling: Node | null; textarea: HTMLTextAreaElement }[] = [];
    textareas.forEach(textarea => {
      const div = document.createElement('div');
      div.innerText = textarea.value;
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      div.style.width = `${textarea.clientWidth}px`;
      div.style.minHeight = `${textarea.clientHeight}px`;
      div.className = textarea.className;
      div.classList.add('printable-div');
      originalTextareas.push({ parent: textarea.parentNode!, nextSibling: textarea.nextSibling, textarea });
      textarea.parentNode!.replaceChild(div, textarea);
    });
    
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const sections = reportContainer.querySelectorAll<HTMLElement>('.report-header, .meta-bar, .report-section');
      let yOffset = 0;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        const canvas = await html2canvas(section, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: reportContainer.scrollWidth,
            windowHeight: reportContainer.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / pdfWidth;
        const imgHeightInPdf = imgHeight / ratio;

        if (yOffset + imgHeightInPdf > pdfHeight) {
          pdf.addPage();
          yOffset = 0;
        }

        pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, imgHeightInPdf);
        yOffset += imgHeightInPdf;
      }
      
      pdf.save('energy-bill-audit-report.pdf');
      
      toast({
        title: "Success!",
        description: "Your PDF report has been downloaded.",
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "An unexpected error occurred while generating the PDF.",
        variant: "destructive",
      });
    } finally {
      // Restore hidden elements
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
      
      // Restore textareas
      reportContainer.querySelectorAll('.printable-div').forEach(div => div.remove());
      originalTextareas.forEach(({ parent, nextSibling, textarea }) => {
        parent.insertBefore(textarea, nextSibling);
      });
      
      // Restore original background color
      reportContainer.style.backgroundColor = originalBackgroundColor;
    }
  };

  return (
    <div className="action-bar bg-card shadow-md p-2 flex justify-end items-center gap-2 sticky top-0 z-40">
      <Button variant="outline" onClick={onReset}>
        <RotateCcw />
        Reset All
      </Button>
      <Button onClick={handleDownload}>
        <Download />
        Download Report as PDF
      </Button>
    </div>
  );
}
