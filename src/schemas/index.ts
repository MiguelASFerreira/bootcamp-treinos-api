import z from "zod";
import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      coverImageUrl: z.url().nullable().optional(),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});

export const StartWorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.string(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.iso.datetime(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.string(),
  completedAt: z.string(),
  startedAt: z.string(),
});

export const HomeResponseSchema = z.object({
  activeWorkoutPlanId: z.string(),
  todayWorkoutDay: z.object({
    workoutPlanId: z.string(),
    id: z.string(),
    name: z.string(),
    isRest: z.boolean(),
    weekDay: z.string(),
    estimatedDurationInSeconds: z.number(),
    coverImageUrl: z.string().optional(),
    exercisesCount: z.number(),
  }),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});
