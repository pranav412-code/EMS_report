"use client";

import React from 'react';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import EditableField from './EditableField';
import { ReportState } from '@/lib/report-data';

type ReportHeaderProps = {
  data: ReportState;
  updateField: (id: string, value: any) => void;
};

export default function ReportHeader({ data, updateField }: ReportHeaderProps) {
  const date: DateRange | undefined = data.period;

  const handleDateChange = (newDate: DateRange | undefined) => {
    updateField('period', newDate);
  }

  return (
    <div className="report-header">
      <div>
        <h1>
          <EditableField id="title" value={data.title} onChange={updateField} className="!font-bold" />
        </h1>
        <div style={{ opacity: 0.95 }}>
          <EditableField id="subTitle" value={data.subTitle} onChange={updateField} />
        </div>
      </div>
      <div className="right">
        <div className="tag">
          <EditableField id="clientName" value={data.clientName} onChange={updateField} />
        </div>
        <div className="tag">
          <EditableField id="clientLocation" value={data.clientLocation} onChange={updateField} />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "tag h-auto justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <div className="tag">
          <EditableField id="reportTags" value={data.reportTags} onChange={updateField} />
        </div>
      </div>
    </div>
  );
}
