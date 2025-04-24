import { db } from "~/server/db";
import { getAuth, upload } from "~/server/actions";
import { z } from "zod";

// Seed function to create admin user
export async function _seedAdminUser() {
  const email = "bestra@live.ru";

  // Check if user already exists
  let user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create new user if doesn't exist
    user = await db.user.create({
      data: {
        email,
        isAdmin: true,
      },
    });
    console.log(`Created admin user with email ${email}`);
  } else if (!user.isAdmin) {
    // Update existing user to have admin rights if not already
    user = await db.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    console.log(`Updated user ${email} to have admin rights`);
  } else {
    console.log(`Admin user ${email} already exists`);
  }

  return user;
}

// User authentication
export async function getCurrentUser() {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
  });

  return user;
}

export async function registerUser({ email }: { email: string }) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  // First check if user already exists with this auth ID
  const existingUserById = await db.user.findUnique({
    where: { id: auth.userId },
  });

  if (existingUserById) {
    // If user exists but email is different and not set, update it
    if (!existingUserById.email && email) {
      return await db.user.update({
        where: { id: auth.userId },
        data: { email },
      });
    }
    return existingUserById;
  }

  // Check if another user exists with this email
  const existingUserByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingUserByEmail) {
    // Cannot create a new user with this email as it's already taken
    throw new Error("Этот email уже используется другим пользователем");
  }

  // Check if this is an admin email
  const isAdmin = email === "bestra@live.ru" || email === "tvv@avtodigit.ru";

  // Create new user
  return await db.user.create({
    data: {
      id: auth.userId,
      email,
      isAdmin,
    },
  });
}

export async function setAdminStatus({ isAdmin }: { isAdmin: boolean }) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  return await db.user.update({
    where: { id: auth.userId },
    data: { isAdmin },
  });
}

// Course management
export async function listCourses() {
  return await db.course.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourse({ id }: { id: string }) {
  return await db.course.findUnique({
    where: { id },
  });
}

export async function createCourse(input: {
  title: string;
  description: string;
  pdfBase64: string;
  videoUrl?: string;
}) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user?.isAdmin) {
    throw new Error("Требуются права администратора");
  }

  const pdfUrl = await upload({
    bufferOrBase64: input.pdfBase64,
    fileName: `courses/${Date.now()}-${input.title.replace(/\s+/g, "-")}.pdf`,
  });

  return await db.course.create({
    data: {
      title: input.title,
      description: input.description,
      pdfUrl,
      videoUrl: input.videoUrl,
    },
  });
}

export async function bulkCreateCourses(input: {
  courses: Array<{
    title: string;
    description: string;
    pdfBase64: string;
    videoUrl?: string;
  }>;
}) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user?.isAdmin) {
    throw new Error("Требуются права администратора");
  }

  type CourseResult = {
    id: string;
    title: string;
    description: string;
    pdfUrl: string;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type ErrorResult = {
    title: string;
    error: string;
  };

  const results: CourseResult[] = [];
  const errors: ErrorResult[] = [];

  for (const course of input.courses) {
    try {
      const pdfUrl = await upload({
        bufferOrBase64: course.pdfBase64,
        fileName: `courses/${Date.now()}-${course.title.replace(/\s+/g, "-")}.pdf`,
      });

      const newCourse = await db.course.create({
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

  return {
    success: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

export async function updateCourse(input: {
  id: string;
  title?: string;
  description?: string;
  pdfBase64?: string;
  videoUrl?: string;
}) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user?.isAdmin) {
    throw new Error("Требуются права администратора");
  }

  const updateData: any = {};

  if (input.title) updateData.title = input.title;
  if (input.description) updateData.description = input.description;
  if (input.videoUrl) updateData.videoUrl = input.videoUrl;

  if (input.pdfBase64) {
    const pdfUrl = await upload({
      bufferOrBase64: input.pdfBase64,
      fileName: `courses/${Date.now()}-${input.title || "updated"}.pdf`,
    });
    updateData.pdfUrl = pdfUrl;
  }

  return await db.course.update({
    where: { id: input.id },
    data: updateData,
  });
}

export async function deleteCourse({ id }: { id: string }) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user?.isAdmin) {
    throw new Error("Требуются права администратора");
  }

  // Delete related progress records first
  await db.progress.deleteMany({
    where: { courseId: id },
  });

  return await db.course.delete({
    where: { id },
  });
}

// Progress tracking
export async function getUserProgress() {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  return await db.progress.findMany({
    where: { userId: auth.userId },
    include: { course: true },
  });
}

export async function getCourseProgress({ courseId }: { courseId: string }) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  const progress = await db.progress.findUnique({
    where: {
      userId_courseId: {
        userId: auth.userId,
        courseId,
      },
    },
  });

  if (!progress) {
    return { completed: false, completedAt: null };
  }

  return { completed: progress.completed, completedAt: progress.completedAt };
}

export async function markCourseAsCompleted({
  courseId,
}: {
  courseId: string;
}) {
  const auth = await getAuth();
  if (auth.status !== "authenticated") {
    throw new Error("Требуется аутентификация");
  }

  return await db.progress.upsert({
    where: {
      userId_courseId: {
        userId: auth.userId,
        courseId,
      },
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
    create: {
      userId: auth.userId,
      courseId,
      completed: true,
      completedAt: new Date(),
    },
  });
}
