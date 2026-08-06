"use client";

import React, { useState, useEffect } from "react";
import { dailyLogService } from "../services/dailyLogService";
import type { DailyLog } from "../types";
import { Calendar, Moon, Zap, Coffee } from "lucide-react";

interface DailyLogsHistoryProps {
  childId: string;
  onSelectLog: (log: DailyLog) => void;
  refreshTrigger?: number; // Pass a number that increments to force refresh
}

const formatDateStr = (d: Date) => d.toISOString().split("T")[0];
const subDaysDate = (d: Date, days: number) => new Date(d.getTime() - days * 86400000);
const formatDisplayDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const DailyLogsHistory: React.FC<DailyLogsHistoryProps> = ({
  childId,
  onSelectLog,
  refreshTrigger = 0,
}) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [childId, refreshTrigger]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      const endDateStr = formatDateStr(today);
      const startDateStr = formatDateStr(subDaysDate(today, 7));

      const response = await dailyLogService.getLogsByDateRange(
        childId,
        startDateStr,
        endDateStr
      );

      if (response.success && response.data) {
        setLogs(response.data);
      } else {
        setError(response.error || "Could not load history.");
      }
    } catch (err: any) {
      console.error("Failed to fetch logs history:", err);
      setError("An error occurred loading history.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-sm text-gray-500">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 text-center">
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <button
          onClick={fetchHistory}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const todayStr = formatDateStr(new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <Calendar className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-800">Recent Logs</h2>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">No logs found in the last 7 days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const dateObj = new Date(log.log_date);
            const isToday = todayStr === log.log_date;

            return (
              <button
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {isToday ? "Today" : formatDisplayDate(dateObj)}
                    </span>
                    {log.mood && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 group-hover:bg-white">
                        {log.mood}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5" />
                      {log.sleep_hours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      {log.physical_activity_minutes || 0}m
                    </span>
                    {(log.diet_details || log.notes) && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Coffee className="w-3.5 h-3.5" />
                        Details
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-blue-600">Edit &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
