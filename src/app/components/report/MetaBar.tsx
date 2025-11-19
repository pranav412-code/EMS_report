"use client";

import React from 'react';
import EditableField from './EditableField';
import { ReportState } from '@/lib/report-data';
import ImageSlot from './ImageSlot';

type MetaBarProps = {
  data: ReportState;
  updateField: (id: string, value: string) => void;
};

const MetaItem = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="item">
    <b className="label">{label}:</b>
    <div className='value-col'>
      {children}
    </div>
  </div>
);

export default function MetaBar({ data, updateField }: MetaBarProps) {
  const handleUpload = (id: string, src: string | null) => {
    // If src is null (cleared), set empty string or keep previous value as needed
    updateField(id, src ?? '');
  };
  return (
    <div className="meta-bar">
      <div className='logo-col'>
        <ImageSlot
          id="logo"
          src={data.logo}
          onUpload={handleUpload}
          className="!min-h-[60px] h-full"
          hint="Upload Logo"
        />
      </div>
      <div className='details-col'>
        <div className='w-full'>
          <MetaItem label="Consumer">
            <EditableField id="consumer" value={data.consumer} onChange={updateField} />
          </MetaItem>
        </div>
        <div className='grid grid-cols-2 gap-x-4 w-full'>
          <MetaItem label="Report Type">
            <EditableField id="reportType" value={data.reportType} onChange={updateField} />
          </MetaItem>
          <MetaItem label="Generated">
            {data.generatedDate}
          </MetaItem>
        </div>
        <div className='w-full'>
          <MetaItem label="Prepared by">
            <EditableField id="preparedBy" value={data.preparedBy} onChange={updateField} />
          </MetaItem>
        </div>
      </div>
    </div>
  );
}
