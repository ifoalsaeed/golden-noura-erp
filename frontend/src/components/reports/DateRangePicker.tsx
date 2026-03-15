import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  presets?: Array<{ label: string; start: Date; end: Date }>;
}

const PRESET_RANGES = [
  { label: 'Today', start: new Date(), end: new Date() },
  { label: 'Yesterday', start: new Date(Date.now() - 86400000), end: new Date(Date.now() - 86400000) },
  { label: 'Last 7 Days', start: new Date(Date.now() - 7 * 86400000), end: new Date() },
  { label: 'Last 30 Days', start: new Date(Date.now() - 30 * 86400000), end: new Date() },
  { label: 'This Month', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() },
  { label: 'Last Month', start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), end: new Date(new Date().getFullYear(), new Date().getMonth(), 0) },
  { label: 'This Quarter', start: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1), end: new Date() },
  { label: 'This Year', start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
  { label: 'Last Year', start: new Date(new Date().getFullYear() - 1, 0, 1), end: new Date(new Date().getFullYear() - 1, 11, 31) }
];

export function DateRangePicker({ startDate, endDate, onChange, presets = PRESET_RANGES }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    onChange(preset.start, preset.end);
    setSelectedPreset(preset.label);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = (date: Date, type: 'start' | 'end') => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      const isSelected = type === 'start' 
        ? currentDate.toDateString() === startDate.toDateString()
        : currentDate.toDateString() === endDate.toDateString();
      const isInRange = currentDate >= startDate && currentDate <= endDate;
      const isToday = currentDate.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => {
            if (type === 'start') {
              onChange(currentDate, endDate);
            } else {
              onChange(startDate, currentDate);
            }
          }}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
            isSelected
              ? 'bg-gn-gold text-gn-black'
              : isInRange && !isSelected
              ? 'bg-gn-gold/20 text-gn-gold'
              : isToday
              ? 'bg-gn-surface text-white'
              : 'text-gray-400 hover:text-white hover:bg-gn-surface/50'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (type: 'start' | 'end', direction: 'prev' | 'next') => {
    const currentDate = type === 'start' ? startDate : endDate;
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    if (type === 'start') {
      onChange(newDate, endDate);
    } else {
      onChange(startDate, newDate);
    }
  };

  return (
    <div className="relative">
      {/* Date Range Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gn-surface/50 border border-gn-surface rounded-lg hover:bg-gn-surface/70 transition text-white min-w-[300px]"
      >
        <Calendar className="w-4 h-4 text-gn-gold" />
        <span className="flex-1 text-left">
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-gn-black border border-gn-surface rounded-xl shadow-2xl z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Select Date Range</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gn-surface rounded transition"
            >
              ×
            </button>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Select</h4>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPreset === preset.label
                      ? 'bg-gn-gold text-gn-black'
                      : 'bg-gn-surface/50 text-gray-300 hover:bg-gn-surface hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendars */}
          <div className="grid grid-cols-2 gap-6">
            {/* Start Date Calendar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Start Date</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateMonth('start', 'prev')}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gn-surface rounded transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateMonth('start', 'next')}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gn-surface rounded transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-center text-sm font-medium text-gn-gold mb-3">
                {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center h-6 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar(startDate, 'start')}
              </div>
            </div>

            {/* End Date Calendar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">End Date</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigateMonth('end', 'prev')}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gn-surface rounded transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateMonth('end', 'next')}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gn-surface rounded transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-center text-sm font-medium text-gn-gold mb-3">
                {endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center h-6 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar(endDate, 'end')}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gn-surface">
            <div className="text-sm text-gray-400">
              Selected: {formatDate(startDate)} - {formatDate(endDate)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onChange(new Date(Date.now() - 30 * 86400000), new Date());
                  setSelectedPreset('Last 30 Days');
                }}
                className="px-3 py-1 bg-gn-surface/50 text-gray-300 hover:bg-gn-surface hover:text-white rounded-lg transition text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1 bg-gn-gold text-gn-black rounded-lg font-medium hover:bg-gn-gold/90 transition text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
