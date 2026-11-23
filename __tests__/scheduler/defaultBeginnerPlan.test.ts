import { describe, expect, it } from '@jest/globals';
import { createDefaultBeginnerPlan, getNextWorkout } from '../../src/core/scheduler/defaultBeginnerPlan';
import { usePlanStore } from '../../src/store/usePlanStore';

describe('default beginner plan', () => {
  it('is initialized in the plan store without a user profile or Supabase setup', () => {
    const state = usePlanStore.getState();

    expect(state.weeklyPlan?.sessions.length).toBeGreaterThan(0);
    expect(state.nutritionPlan).toBeNull();
  });

  it('restores the default plan after clearing a personalized plan', () => {
    const personalizedPlan = { weekStart: '2026-11-23', sessions: [] };
    usePlanStore.setState({ weeklyPlan: personalizedPlan });

    usePlanStore.getState().clearPlans();

    expect(usePlanStore.getState().weeklyPlan).not.toBe(personalizedPlan);
    expect(usePlanStore.getState().weeklyPlan?.sessions[0]?.titleHe).toBe('אימון מתחילים A');
    expect(usePlanStore.getState().nutritionPlan).toBeNull();
  });

  it('creates a workout for today without relying on a user profile', () => {
    const now = new Date(2026, 10, 23, 21, 30);
    const plan = createDefaultBeginnerPlan(now);
    const todaySession = plan.sessions.find((session) => session.date?.slice(0, 10) === '2026-11-23');

    expect(plan.sessions.length).toBeGreaterThan(0);
    expect(todaySession).toMatchObject({ status: 'planned', titleHe: 'אימון מתחילים A' });
    expect(todaySession?.exercises).toHaveLength(3);
  });

  it('selects today even after its scheduled hour, then advances after completion', () => {
    const now = new Date(2026, 10, 23, 21, 30);
    const plan = createDefaultBeginnerPlan(now);
    const todaySession = plan.sessions.find((session) => session.date?.slice(0, 10) === '2026-11-23');

    expect(getNextWorkout(plan, now)).toBe(todaySession);
    if (!todaySession) throw new Error('Expected a workout today');

    const updatedPlan = {
      ...plan,
      sessions: plan.sessions.map((session) =>
        session === todaySession ? { ...session, status: 'completed' as const } : session,
      ),
    };
    expect(getNextWorkout(updatedPlan, now)).toBe(updatedPlan.sessions[1]);
  });

  it('keeps an overdue uncompleted workout available when no future session remains', () => {
    const now = new Date(2026, 10, 29, 12);
    const plan = createDefaultBeginnerPlan(new Date(2026, 10, 23));
    const lastWorkout = plan.sessions[plan.sessions.length - 1];
    const overduePlan = {
      ...plan,
      sessions: plan.sessions.map((session, index) =>
        index < plan.sessions.length - 1 ? { ...session, status: 'completed' as const } : session,
      ),
    };

    expect(getNextWorkout(overduePlan, now)).toBe(lastWorkout);
  });
});
