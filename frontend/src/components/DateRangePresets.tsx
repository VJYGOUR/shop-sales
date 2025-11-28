import React from "react";

interface DateRangePresetsProps {
  onDateRangeChange: (range: { start: string; end: string }) => void;
  currentRange: { start: string; end: string };
}

const DateRangePresets: React.FC<DateRangePresetsProps> = ({
  onDateRangeChange,
  currentRange,
}) => {
  const presets = [
    {
      id: "today",
      label: "Today",
      getRange: () => {
        const today = new Date();
        return {
          start: today.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        };
      },
    },
    {
      id: "yesterday",
      label: "Yesterday",
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday.toISOString().split("T")[0],
          end: yesterday.toISOString().split("T")[0],
        };
      },
    },
    {
      id: "last7",
      label: "Last 7 Days",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        };
      },
    },
    {
      id: "last30",
      label: "Last 30 Days",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        };
      },
    },
    {
      id: "thisMonth",
      label: "This Month",
      getRange: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0],
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0],
        };
      },
    },
    {
      id: "lastMonth",
      label: "Last Month",
      getRange: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1)
            .toISOString()
            .split("T")[0],
          end: new Date(now.getFullYear(), now.getMonth(), 0)
            .toISOString()
            .split("T")[0],
        };
      },
    },
    {
      id: "thisQuarter",
      label: "This Quarter",
      getRange: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1)
            .toISOString()
            .split("T")[0],
          end: new Date(now.getFullYear(), quarter * 3 + 3, 0)
            .toISOString()
            .split("T")[0],
        };
      },
    },
    {
      id: "thisYear",
      label: "This Year",
      getRange: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
          end: new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0],
        };
      },
    },
  ];

  const isPresetActive = (preset: (typeof presets)[0]) => {
    const presetRange = preset.getRange();
    return (
      currentRange.start === presetRange.start &&
      currentRange.end === presetRange.end
    );
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700 mr-2 self-center">
        Quick ranges:
      </span>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onDateRangeChange(preset.getRange())}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
            isPresetActive(preset)
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangePresets;
