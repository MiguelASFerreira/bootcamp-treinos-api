import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import type { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

const WEEKDAY_MAP: Record<number, WeekDay> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

interface InputDto {
  userId: string;
  date: string;
}

interface ConsistencyEntry {
  workoutDayCompleted: boolean;
  workoutDayStarted: boolean;
}

interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: string;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
  };
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyEntry>;
}

export class GetHomeData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const currentDate = dayjs.utc(dto.date);
    const currentWeekDay = WEEKDAY_MAP[currentDate.day()];

    // Calcular início (domingo) e fim (sábado) da semana em UTC
    const weekStart = currentDate.startOf("week"); // domingo 00:00:00
    const weekEnd = currentDate.endOf("week"); // sábado 23:59:59

    // Buscar plano de treino ativo do usuário
    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
      include: {
        workoutDays: {
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!activeWorkoutPlan) {
      throw new NotFoundError("Active workout plan not found");
    }

    // Buscar o dia de treino correspondente ao dia da semana
    const todayWorkoutDay = activeWorkoutPlan.workoutDays.find(
      (day) => day.weekDay === currentWeekDay,
    );

    if (!todayWorkoutDay) {
      throw new NotFoundError("Workout day not found for today");
    }

    // Buscar sessões da semana
    const weekSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: dto.userId,
          },
        },
        startedAt: {
          gte: weekStart.toDate(),
          lte: weekEnd.toDate(),
        },
      },
    });

    // Montar consistencyByDay — incluir TODOS os dias da semana
    const consistencyByDay: Record<string, ConsistencyEntry> = {};

    for (let i = 0; i < 7; i++) {
      const day = weekStart.add(i, "day");
      const dayKey = day.format("YYYY-MM-DD");
      consistencyByDay[dayKey] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    // Agrupar sessões por data e preencher consistência
    weekSessions.forEach((session) => {
      const dayKey = dayjs.utc(session.startedAt).format("YYYY-MM-DD");
      if (consistencyByDay[dayKey]) {
        consistencyByDay[dayKey].workoutDayStarted = true;
        if (session.completedAt) {
          consistencyByDay[dayKey].workoutDayCompleted = true;
        }
      }
    });

    // Calcular workout streak
    const workoutStreak = this.calculateStreak(dto.userId, currentDate);

    return {
      activeWorkoutPlanId: activeWorkoutPlan.id,
      todayWorkoutDay: {
        workoutPlanId: activeWorkoutPlan.id,
        id: todayWorkoutDay.id,
        name: todayWorkoutDay.name,
        isRest: todayWorkoutDay.isRest,
        weekDay: todayWorkoutDay.weekDay,
        estimatedDurationInSeconds: todayWorkoutDay.estimatedDurationInSeconds,
        coverImageUrl: todayWorkoutDay.coverImageUrl ?? undefined,
        exercisesCount: todayWorkoutDay.exercises.length,
      },
      workoutStreak: await workoutStreak,
      consistencyByDay,
    };
  }

  private async calculateStreak(
    userId: string,
    currentDate: dayjs.Dayjs,
  ): Promise<number> {
    // Buscar o plano ativo e seus dias de treino para saber quais dias da semana são "treino"
    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        workoutDays: true,
      },
    });

    if (!activeWorkoutPlan) {
      return 0;
    }

    const workoutWeekDays = new Set(
      activeWorkoutPlan.workoutDays.map((d) => d.weekDay),
    );

    let streak = 0;
    let checkDate = currentDate;

    // Iterar para trás dia a dia
    while (true) {
      const weekDay = WEEKDAY_MAP[checkDate.day()];

      // Se este dia da semana não faz parte do plano de treino, pular
      if (!workoutWeekDays.has(weekDay)) {
        checkDate = checkDate.subtract(1, "day");
        continue;
      }

      // Verificar se há sessão completada neste dia
      const dayStart = checkDate.startOf("day").toDate();
      const dayEnd = checkDate.endOf("day").toDate();

      const session = await prisma.workoutSession.findFirst({
        where: {
          workoutDay: {
            workoutPlan: {
              userId,
            },
          },
          startedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          completedAt: { not: null },
        },
      });

      if (session) {
        streak++;
        checkDate = checkDate.subtract(1, "day");
      } else {
        break;
      }
    }

    return streak;
  }
}
