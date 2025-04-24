import { expect } from "expect";
import { listCourses, getCourse, createCourse, deleteCourse } from "./api";
import { z } from "zod";

// 1. Исправленная схема валидации с преобразованием дат
const CourseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  pdfUrl: z.string().url(),
  videoUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type TestResult = {
  passed: string[];
  failed: Array<{ 
    name: string; 
    error: string;
    stack?: string;
  }>;
  duration: number;
};

// 2. Улучшенная обертка для тестов с таймаутом
async function runTest<T extends unknown[]>(
  name: string,
  testFn: (...args: T) => Promise<void>,
  ...args: T
): Promise<Omit<TestResult, "duration">> {
  try {
    await Promise.race([
      testFn(...args),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout after 5000ms")), 5000)
      )
    ]);
    return { 
      passed: [name], 
      failed: [] 
    };
  } catch (error) {
    return {
      passed: [],
      failed: [{
        name,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }]
    };
  }
}

// 3. Корректные тестовые данные согласно API
const TEST_COURSE = {
  title: "Test Course",
  description: "Test Description",
  pdfBase64: "VEhJUyBJUyBBIERFTU8=", // Исправлено имя параметра
  videoUrl: null,
};

// 4. Обновленные тесты с улучшенной обработкой ошибок
async function testListCourses() {
  const courses = await listCourses();
  
  expect(Array.isArray(courses)).toBe(true);
  
  if (courses.length > 0) {
    courses.forEach((course, index) => {
      try {
        CourseSchema.parse(course);
      } catch (e) {
        throw new Error(`Invalid course at index ${index}: ${e.message}`);
      }
    });
  }
}

async function testCourseLifecycle() {
  // Создание курса
  const newCourse = await createCourse(TEST_COURSE);
  
  // Расширенная проверка структуры
  expect(() => CourseSchema.parse(newCourse)).not.toThrow();
  
  // Получение курса
  const course = await getCourse({ id: newCourse.id });
  expect(course).toMatchObject({
    id: newCourse.id,
    title: TEST_COURSE.title,
    description: TEST_COURSE.description
  });

  // Удаление и проверка
  await deleteCourse({ id: newCourse.id });
  
  // Обработка ошибки при получении удаленного курса
  try {
    await getCourse({ id: newCourse.id });
    expect(true).toBe(false); // Force fail если не выброшена ошибка
  } catch (error) {
    expect(error.message).toMatch(/not found/i);
  }
}

// 5. Улучшенный запуск тестов с параллельным выполнением
export async function _runApiTests(): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = { 
    passed: [], 
    failed: [], 
    duration: 0 
  };

  const testResults = await Promise.all([
    runTest("testListCourses", testListCourses),
    runTest("testCourseLifecycle", testCourseLifecycle),
  ]);

  testResults.forEach((tr) => {
    result.passed.push(...tr.passed);
    result.failed.push(...tr.failed);
  });

  result.duration = Date.now() - start;
  return result;
}

// 6. Удалены неиспользуемые утилиты
