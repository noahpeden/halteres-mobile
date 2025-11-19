import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDashboardDataMobile() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activeWorkouts: 0,
    upcomingWorkouts: 0,
  });

  async function fetchData() {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch entities
      const { data: entitiesData, error: entitiesError } = await supabase
        .from("entities")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (entitiesError) throw entitiesError;
      setEntities(entitiesData || []);

      const entityIds = entitiesData?.map((e) => e.id) || [];

      // Fetch programs (even if no entities, though usually they are linked)
      // If no entities, we might still want to fetch programs if they aren't strictly enforced to have an entity_id in RLS or query
      // But web checks `in('entity_id', entityIds)`. Let's stick to that if entityIds exist.

      let programsQuery = supabase
        .from("programs")
        .select("*") // We'll map client names manually from entities list
        .order("created_at", { ascending: false });

      if (entityIds.length > 0) {
        programsQuery = programsQuery.in("entity_id", entityIds);
      } else {
        // If no entities, user probably has no programs either if the app enforces entity linkage
        // But let's just return empty if we are strictly filtering by entity
        setPrograms([]);
        setStats({ totalPrograms: 0, activeWorkouts: 0, upcomingWorkouts: 0 });
        setIsLoading(false);
        return;
      }

      const { data: programsData, error: programsError } = await programsQuery;

      if (programsError) throw programsError;

      // Map client_name for UI
      const programsWithClientName = programsData?.map((p) => ({
        ...p,
        client_name: entitiesData?.find((e) => e.id === p.entity_id)?.name,
      }));

      setPrograms(programsWithClientName || []);

      // Calculate stats
      const programIds = programsData?.map((p) => p.id) || [];

      if (programIds.length > 0) {
        const { data: workoutsData, error: workoutsError } = await supabase
          .from("program_workouts")
          .select("id, scheduled_date, tags")
          .in("program_id", programIds);

        if (workoutsError)
          console.error("Error fetching workouts for stats:", workoutsError);

        if (workoutsData) {
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0];
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          const nextWeekStr = nextWeek.toISOString().split("T")[0];

          let todaysCount = 0;
          let upcomingCount = 0;

          workoutsData.forEach((workout) => {
            let dateStr = null;
            if (workout.scheduled_date) {
              dateStr = new Date(workout.scheduled_date)
                .toISOString()
                .split("T")[0];
            } else if (workout.tags?.scheduled_date || workout.tags?.date) {
              try {
                const d = new Date(
                  workout.tags?.scheduled_date || workout.tags?.date,
                );
                if (!isNaN(d.getTime()))
                  dateStr = d.toISOString().split("T")[0];
              } catch (e) {}
            }

            if (dateStr === todayStr) todaysCount++;
            if (dateStr && dateStr > todayStr && dateStr <= nextWeekStr)
              upcomingCount++;
          });

          setStats({
            totalPrograms: programsData?.length || 0,
            activeWorkouts: todaysCount,
            upcomingWorkouts: upcomingCount,
          });
        }
      } else {
        setStats({
          totalPrograms: 0,
          activeWorkouts: 0,
          upcomingWorkouts: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    programs,
    entities,
    stats,
    isLoading,
    refetch: fetchData,
  };
}
