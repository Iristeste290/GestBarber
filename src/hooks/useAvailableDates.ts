import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";

interface UseAvailableDatesProps {
  barberId: string | undefined;
  daysToCheck?: number;
}

interface DateAvailability {
  [dateStr: string]: boolean; // true = has availability, false = no availability
}

export const useAvailableDates = ({ barberId, daysToCheck = 60 }: UseAvailableDatesProps) => {
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const checkDateAvailability = useCallback(async () => {
    if (!barberId) return;

    try {
      setLoading(true);
      const unavailable = new Set<string>();
      const today = startOfDay(new Date());

      // Get all work hours for this barber
      const { data: workHours, error: workHoursError } = await supabase
        .from("barber_work_hours")
        .select("weekday")
        .eq("barber_id", barberId);

      if (workHoursError) throw workHoursError;

      const workDays = new Set(workHours?.map((wh) => wh.weekday) || []);

      // Get exceptions (closed days)
      const { data: exceptions, error: exceptionsError } = await supabase
        .from("barber_exceptions")
        .select("date, is_closed")
        .eq("barber_id", barberId)
        .eq("is_closed", true);

      if (exceptionsError) throw exceptionsError;

      const closedDates = new Set(exceptions?.map((ex) => ex.date) || []);

      // Check each day in the range
      for (let i = 0; i < daysToCheck; i++) {
        const checkDate = addDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const weekday = checkDate.getDay();

        // Mark as unavailable if:
        // 1. Barber doesn't work on this weekday
        // 2. It's a closed exception date
        if (!workDays.has(weekday) || closedDates.has(dateStr)) {
          unavailable.add(dateStr);
        }
      }

      setUnavailableDates(unavailable);
    } catch (error) {
      console.error("Error checking date availability:", error);
    } finally {
      setLoading(false);
    }
  }, [barberId, daysToCheck]);

  useEffect(() => {
    checkDateAvailability();
  }, [checkDateAvailability]);

  const isDateUnavailable = useCallback(
    (date: Date): boolean => {
      const dateStr = format(date, "yyyy-MM-dd");
      return unavailableDates.has(dateStr);
    },
    [unavailableDates]
  );

  return {
    unavailableDates,
    isDateUnavailable,
    loading,
    refetch: checkDateAvailability,
  };
};
