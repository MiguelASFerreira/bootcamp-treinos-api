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
  todayWorkoutDay: z
    .object({
      workoutPlanId: z.string(),
      id: z.string(),
      name: z.string(),
      isRest: z.boolean(),
      weekDay: z.string(),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.string().optional(),
      exercisesCount: z.number(),
    })
    .optional(),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.iso.date(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const GetWorkoutPlanResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.string(),
      weekDay: z.string(),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const GetWorkoutDayResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().optional(),
  estimatedDurationInSeconds: z.number(),
  weekDay: z.string(),
  exercises: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      workoutDayId: z.string(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      workoutDayId: z.string(),
      startedAt: z.string().optional(),
      completedAt: z.string().optional(),
    }),
  ),
});

export const StatsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const StatsResponseSchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.iso.date(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});

export const UserTrainDataSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number().min(0).max(100),
});

export const UpsertUserTrainDataBodySchema = z.object({
  weightInGrams: z.number().min(1),
  heightInCentimeters: z.number().min(1),
  age: z.number().min(1),
  bodyFatPercentage: z.number().min(0).max(100),
});

export const UpsertUserTrainDataResponseSchema = z.object({
  userId: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number(),
});

export const ListWorkoutPlansQuerySchema = z.object({
  active: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export const ListWorkoutPlansResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    workoutDays: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        weekDay: z.string(),
        isRest: z.boolean(),
        coverImageUrl: z.string().optional(),
        estimatedDurationInSeconds: z.number(),
        exercises: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            order: z.number(),
            workoutDayId: z.string(),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
          }),
        ),
      }),
    ),
  }),
);
