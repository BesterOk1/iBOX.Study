import { db } from "~/server/db";
import { getAuth, upload } from "~/server/actions";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// 1. Добавим схемы валидации
const CourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  pdfBase64: z.string().regex(/^data:application\/pdf;base64,/),
  videoUrl: z.string().url().optional().nullable(),
});

const BulkCourseSchema = CourseSchema.extend({
  title: z.string().min(3).max(100),
});

// 2. Вспомогательные функции для проверки прав
async function requireAdmin() {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return auth.userId;
}

async function requireAuth() {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return auth.userId;
}

// 3. Обновленная функция создания администратора
export async function _seedAdminUser() {
  const email = "bestra@live.ru";
  
  try {
    return await db.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            isAdmin: true,
            emailVerified: new Date(),
          },
        });
        console.log(`Created admin user: ${email}`);
        return user;
      }

      if (!user.isAdmin) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
        console.log(`Updated user to admin: ${email}`);
      }

      return user;
    });
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// 4. Улучшенная регистрация пользователя
export async function registerUser({ email }: { email: string }) {
  const userId = await requireAuth();
  
  return await db.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (existingUser) {
      if (existingUser.email === email) return existingUser;
      if (existingUser.email) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already associated with another account",
        });
      }
    }

    const emailExists = await tx.user.findUnique({ 
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email already in use",
      });
    }

    const isAdmin = ["bestra@live.ru", "tvv@avtodigit.ru"].includes(email);

    return tx.user.upsert({
      where: { id: userId },
      update: { email, isAdmin },
      create: {
        id: userId,
        email,
        isAdmin,
        emailVerified: new Date(),
      },
    });
  });
}

// 5. Оптимизированное управление курсами
export async function createCourse(input: z.infer<typeof CourseSchema>) {
  await requireAdmin();

  try {
    const pdfUrl = await upload({
      bufferOrBase64: input.pdfBase64,
      fileName: `courses/${Date.now()}-${input.title.slice(0, 20)}.pdf`,
    });

    return await db.course.create({
      data: {
        title: input.title,
        description: input.description,
        pdfUrl,
        videoUrl: input.videoUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create course:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to upload PDF",
    });
  }
}

// 6. Улучшенное массовое создание курсов
export async function bulkCreateCourses(input: {
  courses: z.infer<typeof BulkCourseSchema>[];
}) {
  await requireAdmin();

  return await db.$transaction(async (tx) => {
    const results = [];
    const errors = [];

    for (const [index, course] of input.courses.entries()) {
      try {
        const pdfUrl = await upload({
          bufferOrBase64: course.pdfBase64,
          fileName: `courses/${Date.now()}-${index}-${course.title.slice(0, 20)}.pdf`,
        });

        const newCourse = await tx.course.create({
          data: {
            title: course.title,
            description: course.description,
            pdfUrl,
            videoUrl: course.videoUrl,
          },
        });

        results.push(newCourse);
      } catch (error) {
        errors.push({
          title: course.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success: results.length, failed: errors.length, results, errors };
  });
}

// 7. Безопасное обновление курса
export async function updateCourse(input: {
  id: string;
  data: Partial<z.infer<typeof CourseSchema>>;
}) {
  await requireAdmin();

  const updateData: Record<string, unknown> = {};
  const { data } = input;

  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.videoUrl) updateData.videoUrl = data.videoUrl;

  if (data.pdfBase64) {
    const existingCourse = await db.course.findUnique({
      where: { id: input.id },
      select: { title: true },
    });

    const pdfUrl = await upload({
      bufferOrBase64: data.pdfBase64,
      fileName: `courses/${Date.now()}-${existingCourse?.title || "updated"}.pdf`,
    });
    
    updateData.pdfUrl = pdfUrl;
  }

  return await db.course.update({
    where: { id: input.id },
    data: updateData,
  });
}

// 8. Улучшенное отслеживание прогресса
export async function getCourseProgress({ courseId }: { courseId: string }) {
  const userId = await requireAuth();

  const progress = await db.progress.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { completed: true, completedAt: true },
  });

  return {
    completed: progress?.completed ?? false,
    completedAt: progress?.completedAt,
  };
}

export async function markCourseAsCompleted({ courseId }: { courseId: string }) {
  const userId = await requireAuth();

  return await db.progress.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { 
      completed: true,
      completedAt: new Date(),
    },
    create: {
      userId,
      courseId,
      completed: true,
      completedAt: new Date(),
    },
  });
}

// 9. Оптимизированные запросы
export async function listCourses() {
  return await db.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      pdfUrl: true,
      videoUrl: true,
      createdAt: true,
    },
  });
}

export async function getCourse({ id }: { id: string }) {
  return await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      pdfUrl: true,
      videoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
