import { usePlanStore } from '../../src/store/usePlanStore';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import WeeklyScheduleView from '../../src/components/calendar/WeeklyScheduleView';

export default function ScheduleRoute() {
  const weeklyPlan = usePlanStore((state) => state.weeklyPlan);
  return (
    <ScreenContainer title="תוכנית ולו״ז" subtitle="האימונים שלך לאורך השבוע">
      {weeklyPlan ? (
        <WeeklyScheduleView plan={weeklyPlan} />
      ) : (
        <WeeklyScheduleView
          plan={{ weekStart: new Date().toISOString(), sessions: [] }}
        />
      )}
    </ScreenContainer>
  );
}
