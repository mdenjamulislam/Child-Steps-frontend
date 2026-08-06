"use client";

import React, { useState, useEffect } from "react";
import { dailyLogService } from "../services/dailyLogService";
import type { DailyLog } from "../types";
import { Smile, Meh, Frown, Zap, Battery, Thermometer, AlertCircle, Baby } from "lucide-react";

interface DailyTrackerFormProps {
  childId: string;
  initialData?: DailyLog | null;
  onSaveSuccess?: (log: DailyLog) => void;
}

const MOODS = [
  { value: "Happy", icon: Smile, color: "text-green-500", bg: "bg-green-100 border-green-200" },
  { value: "Calm", icon: Battery, color: "text-blue-500", bg: "bg-blue-100 border-blue-200" },
  { value: "Energetic", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100 border-yellow-200" },
  { value: "Tired", icon: Meh, color: "text-gray-500", bg: "bg-gray-100 border-gray-200" },
  { value: "Irritable", icon: Frown, color: "text-orange-500", bg: "bg-orange-100 border-orange-200" },
  { value: "Sick", icon: Thermometer, color: "text-red-500", bg: "bg-red-100 border-red-200" },
  { value: "Anxious", icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-100 border-purple-200" },
  { value: "Fussy", icon: Baby, color: "text-pink-500", bg: "bg-pink-100 border-pink-200" },
];

export const DailyTrackerForm: React.FC<DailyTrackerFormProps> = ({ childId, initialData, onSaveSuccess }) => {
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [mood, setMood] = useState<string>("");
  const [activityMinutes, setActivityMinutes] = useState<number>(30);
  const [dietDetails, setDietDetails] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLogDate(initialData.log_date);
      setSleepHours(initialData.sleep_hours || 0);
      setMood(initialData.mood || "");
      setActivityMinutes(initialData.physical_activity_minutes || 0);
      setDietDetails(initialData.diet_details || "");
      setNotes(initialData.notes || "");
    } else {
      // Fetch data for the current logDate if we don't have initialData provided explicitly
      fetchLogForDate(logDate);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData || initialData.log_date !== logDate) {
      fetchLogForDate(logDate);
    }
  }, [logDate]);

  const fetchLogForDate = async (date: string) => {
    try {
      const response = await dailyLogService.getLogByDate(childId, date);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        setSleepHours(data.sleep_hours || 0);
        setMood(data.mood || "");
        setActivityMinutes(data.physical_activity_minutes || 0);
        setDietDetails(data.diet_details || "");
        setNotes(data.notes || "");
      } else {
        // Reset if no log exists for this date
        setSleepHours(8);
        setMood("");
        setActivityMinutes(30);
        setDietDetails("");
        setNotes("");
      }
    } catch (err) {
      console.error("Failed to fetch log for date:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await dailyLogService.upsertLog({
        child_id: childId,
        log_date: logDate,
        sleep_hours: sleepHours,
        mood,
        physical_activity_minutes: activityMinutes,
        diet_details: dietDetails,
        notes,
      });

      if (response.data?.success && response.data.data) {
        setSuccessMsg("Daily log saved successfully!");
        if (onSaveSuccess) {
          onSaveSuccess(response.data.data);
        }
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response.data?.error || "Failed to save daily log");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Daily Tracker</h2>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium text-gray-700"
          max={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">
          {successMsg}
        </div>
      )}

      {/* Sleep Tracker */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-gray-700">Sleep Duration</label>
          <span className="text-sm font-semibold text-blue-600">{sleepHours} hours</span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Mood Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Mood</label>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {MOODS.map((m) => {
            const Icon = m.icon;
            const isSelected = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                  isSelected ? `${m.bg} shadow-sm scale-105` : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isSelected ? m.color : "text-gray-400"}`} />
                <span className={`text-xs font-medium ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                  {m.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physical Activity */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-gray-700">Active Play / Physical Activity</label>
          <span className="text-sm font-semibold text-green-600">{activityMinutes} mins</span>
        </div>
        <input
          type="range"
          min="0"
          max="300"
          step="5"
          value={activityMinutes}
          onChange={(e) => setActivityMinutes(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
        />
      </div>

      {/* Diet & Meals */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Diet & Meals</label>
        <textarea
          value={dietDetails}
          onChange={(e) => setDietDetails(e.target.value)}
          placeholder="What did they eat today? (e.g., Ate full breakfast, refused veggies at lunch...)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm min-h-[80px]"
        />
      </div>

      {/* General Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">General Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other observations? (e.g., Slightly feverish in the afternoon, learned a new word...)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm min-h-[80px]"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            "Save Daily Log"
          )}
        </button>
      </div>
    </form>
  );
};
