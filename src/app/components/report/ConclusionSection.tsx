"use client";

import React from 'react';
import { ReportState } from '@/lib/report-data';
import EditableField from './EditableField';

type ConclusionSectionProps = {
  data: ReportState;
  updateField: (id: string, value: string) => void;
  getReportTextContent: () => string;
  getChartDescriptions: () => string;
};

export default function ConclusionSection({ data, updateField }: ConclusionSectionProps) {
  return (
    <div className="report-section" id="conclusion">
      <div className='flex items-center justify-between'>
        <h2>✅ Conclusions</h2>
      </div>
      <div className="chart-card">
        <div className="remarks h-full">
            <EditableField
              id="conclusion"
              value={data.conclusion}
              onChange={updateField}
              type="richtext"
              className='min-h-[100px]'
            />
        </div>
      </div>
    </div>
  );
}
