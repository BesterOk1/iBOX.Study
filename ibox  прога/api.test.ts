import { expect } from "expect";
import { listCourses, getCourse, createCourse, deleteCourse } from "./api";
import { z } from "zod";

// 1. Добавим схему валидации для курса
const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  pdfUrl: z.string().url(),
  videoUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
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

// 2. Обертка для выполнения тестов
async function runTest<T extends unknown[]>(
  name: string,
  testFn: (...args: T) => Promise<void>,
  ...args: T
): Promise<Omit<TestResult, "duration">> {
  try {
    await testFn(...args);
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

// 3. Добавим тестовые данные
const TEST_COURSE = {
  title: "Test Course",
  description: "Test Description",
  pdfUrl: "data:application/pdf;base64,VEhJUyBJUyBBIERFTU8=", // Исправлено на pdfUrl
  videoUrl: null, // Добавлено поле videoUrl для соответствия схеме
};

// 4. Основные тесты
async function testListCourses() {
  const courses = await listCourses();
  
  expect(Array.isArray(courses)).toBe(true);
  expect(courses.length).toBeGreaterThanOrEqual(0);

  // Валидация структуры данных
  if (courses.length > 0) {
    courses.forEach(course => {
      expect(() => CourseSchema.parse(course)).not.toThrow();
    });
  }
}

async function testCourseLifecycle() {
  // Создание курса
  const newCourse = await createCourse(TEST_COURSE);
  
  // Проверка создания
  expect(newCourse).toMatchObject({
    title: TEST_COURSE.title,
    description: TEST_COURSE.description
  });
  
  // Получение курса
  const course = await getCourse({ id: newCourse.id });
  expect(course).toEqual(newCourse);

  // Удаление курса
  await deleteCourse({ id: newCourse.id });
  const deletedCourse = await getCourse({ id: newCourse.id });
  expect(deletedCourse).toBeNull();
}

// 5. Обновленная функция запуска тестов
export async function _runApiTests(): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = { 
    passed: [], 
    failed: [], 
    duration: 0 
  };

  // Запуск тестов с обработкой результатов
  const tests = [
    runTest("testListCourses", testListCourses),
    runTest("testCourseLifecycle", testCourseLifecycle),
  ];

  for await (const testResult of tests) {
    result.passed.push(...testResult.passed);
    result.failed.push(...testResult.failed);
  }

  result.duration = Date.now() - start;
  return result;
}

// 6. Дополнительные утилиты (для расширения)
function describe(name: string, tests: () => void) {
  console.log(`\nDescribe: ${name}`);
  tests();
}

function it(name: string, testFn: () => Promise<void>) {
  console.log(`  Test: ${name}`);
  return testFn();
}
