import React, { useState, useEffect, FormEvent } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~/client/api";
import { useAuth, encodeFileAsBase64DataURL, useToast } from "~/client/utils";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
} from "~/components/ui";
import {
  Book,
  FileText,
  User,
  LogIn,
  LogOut,
  Plus,
  Check,
  Video,
  ChevronLeft,
  Settings,
  Loader2,
} from "lucide-react";

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { data: user } = useQuery(["currentUser"], apiClient.getCurrentUser, {
    enabled: auth.status === "authenticated",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = () => {
    auth.signIn();
  };

  const registerMutation = useMutation(apiClient.registerUser, {
    onSuccess: () => {
      toast({
        title: "Регистрация успешна",
        description: "Ваш аккаунт зарегистрирован.",
      });
    },
  });

  useEffect(() => {
    if (auth.status === "authenticated" && auth.userId && !user) {
      // Генерируем дефолтный email на основе ID
      const email = `user-${auth.userId.substring(0, 8)}@example.com`;
      registerMutation.mutate({ email });
    }
  }, [auth.status, auth.userId, user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">iBOX Study</span>
          </Link>

          <nav className="flex items-center space-x-4">
            {auth.status === "authenticated" && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium hover:text-primary"
                >
                  Панель
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium hover:text-primary"
                >
                  Профиль
                </Link>
                {user.isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium hover:text-primary"
                  >
                    Админ
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/")}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleSignIn}>
                <LogIn className="h-4 w-4 mr-2" />
                Войти
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-6 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} iBOX Study. Все права защищены.
        </div>
      </footer>
    </div>
  );
}

// Home page
function HomePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate("/dashboard");
    }
  }, [auth.status, navigate]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка на допустимые email администраторов
    if (adminEmail === "bestra@live.ru" || adminEmail === "tvv@avtodigit.ru") {
      auth.signIn({ provider: 'AC1', email: adminEmail });
    } else {
      toast({
        title: "Ошибка авторизации",
        description: "Указанный email не имеет прав администратора",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <h1 className="text-4xl font-bold mb-6">Добро пожаловать в iBOX Study</h1>
      <p className="text-xl mb-8 text-muted-foreground">
        Изучайте продукты компании с помощью интерактивного обучения
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Начните обучение сегодня</CardTitle>
          <CardDescription>
            Получите доступ к нашей библиотеке курсов по продуктам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            iBOX Study предоставляет простой способ изучения наших продуктов
            через подробные PDF-презентации и дополнительные видеоматериалы.
          </p>
          <p className="mb-6">
            Отслеживайте свой прогресс и развивайте базу знаний по мере
            прохождения курсов.
          </p>
          
          {showAdminForm ? (
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email администратора</Label>
                <Input 
                  id="adminEmail" 
                  type="email" 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Введите email администратора"
                  required
                  className="max-w-md mx-auto"
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button type="submit" variant="default">
                  <LogIn className="h-4 w-4 mr-2" />
                  Войти как администратор
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAdminForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button onClick={() => auth.signIn()}>
                <LogIn className="h-4 w-4 mr-2" />
                Войти как пользователь
              </Button>
              <Button variant="outline" onClick={() => setShowAdminForm(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Войти как администратор
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard page
function DashboardPage() {
  const { data: courses = [] } = useQuery(["courses"], apiClient.listCourses);
  const { data: progress = [] } = useQuery(
    ["userProgress"],
    apiClient.getUserProgress,
  );

  // Create a map of courseId -> progress for quick lookup
  const progressMap = progress.reduce(
    (acc, item) => {
      acc[item.courseId] = item;
      return acc;
    },
    {} as Record<string, any>,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Доступные курсы</h1>
        <Badge variant="outline" className="text-sm">
          {courses.length} {courses.length === 1 ? 'курс' : 
           courses.length >= 2 && courses.length <= 4 ? 'курса' : 'курсов'}
        </Badge>
      </div>

      {courses.length === 0 ? (
        <Alert className="bg-muted/50 border border-border">
          <AlertTitle className="font-medium">Нет доступных курсов</AlertTitle>
          <AlertDescription>
            В данный момент нет доступных курсов. Пожалуйста, проверьте позже.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/40"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
                      <Book className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </div>
                  {progressMap[course.id]?.completed && (
                    <Badge variant="secondary" className="ml-2">
                      <Check className="h-3 w-3 mr-1" /> Завершено
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center bg-muted/60 px-2 py-1 rounded-md">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF Материалы
                  </div>
                  {course.videoUrl && (
                    <div className="flex items-center bg-muted/60 px-2 py-1 rounded-md">
                      <Video className="h-3.5 w-3.5 mr-1.5" /> Доступно видео
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/40">
                <Button asChild className="w-full shadow-sm hover:shadow transition-shadow duration-300">
                  <Link to={`/courses/${course.id}`}>
                    {progressMap[course.id]?.completed
                      ? "Повторить курс"
                      : "Начать обучение"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Course detail page
function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useQuery(
    ["course", courseId],
    () => apiClient.getCourse({ id: courseId! }),
    { enabled: !!courseId },
  );

  const { data: progress, isLoading: progressLoading } = useQuery(
    ["courseProgress", courseId],
    () => apiClient.getCourseProgress({ courseId: courseId! }),
    { enabled: !!courseId },
  );

  const markCompletedMutation = useMutation(apiClient.markCourseAsCompleted, {
    onSuccess: () => {
      queryClient.invalidateQueries(["courseProgress", courseId]);
      queryClient.invalidateQueries(["userProgress"]);
      toast({
        title: "Курс завершен",
        description: "Этот курс был отмечен как завершенный.",
      });
    },
  });

  if (courseLoading || progressLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertTitle className="font-medium">Курс не найден</AlertTitle>
        <AlertDescription>
          Курс, который вы ищете, не существует или был удален.
          <Button variant="link" onClick={() => navigate("/dashboard")}>
            Вернуться на панель
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        className="mb-6 shadow-sm hover:shadow transition-shadow duration-300 group"
        onClick={() => navigate("/dashboard")}
      >
        <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" /> Назад к панели
      </Button>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-3 flex items-center">
            <div className="p-2 bg-primary/10 rounded-full mr-3">
              <Book className="h-6 w-6 text-primary" />
            </div>
            {course.title}
          </h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        
        <div className="flex items-center self-start">
          {progress?.completed ? (
            <Badge className="shadow-sm py-1.5 px-3">
              <Check className="h-3.5 w-3.5 mr-2" /> Завершено{" "}
              {progress.completedAt
                ? new Date(progress.completedAt).toLocaleDateString()
                : "Неизвестная дата"}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted/50 py-1.5 px-3">
              В процессе изучения
            </Badge>
          )}
        </div>
      </div>

      <Card className="mb-8 shadow-md overflow-hidden border border-border/40">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" /> Материалы курса
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center text-lg">
              <div className="p-1.5 bg-primary/10 rounded-full mr-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              PDF Презентация
            </h3>
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={course.pdfUrl}
                className="w-full h-[600px]"
                title={`${course.title} PDF`}
              />
            </div>
          </div>

          {course.videoUrl && (
            <div className="mt-8">
              <h3 className="font-medium mb-3 flex items-center text-lg">
                <div className="p-1.5 bg-primary/10 rounded-full mr-2">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                Дополнительное видео
              </h3>
              <Button 
                variant="outline" 
                asChild 
                className="shadow-sm hover:shadow transition-shadow duration-300"
              >
                <a
                  href={course.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Video className="h-4 w-4 mr-2" /> Смотреть видео
                </a>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-muted/30 border-t border-border/40">
          <Button
            onClick={() =>
              markCompletedMutation.mutate({ courseId: course.id })
            }
            disabled={progress?.completed || markCompletedMutation.isLoading}
            className="w-full shadow-sm hover:shadow transition-shadow duration-300"
            size="lg"
          >
            {markCompletedMutation.isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Обработка...
              </>
            ) : progress?.completed ? (
              <>
                <Check className="h-5 w-5 mr-2" /> Уже завершено
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" /> Отметить как завершенный
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Profile page
function ProfilePage() {
  const { data: user } = useQuery(["currentUser"], apiClient.getCurrentUser);
  const { data: progress = [] } = useQuery(
    ["userProgress"],
    apiClient.getUserProgress,
  );

  const completedCourses = progress.filter((p) => p.completed);
  const completionPercentage =
    progress.length > 0
      ? Math.round((completedCourses.length / progress.length) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Ваш профиль</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Информация о пользователе</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-muted-foreground break-all">{user?.email || 'Загрузка...'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Прогресс обучения</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full mt-4">
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  {/* Фоновый круг */}
                  <circle 
                    cx="18" cy="18" r="15.9" 
                    fill="none" 
                    stroke="var(--muted)" 
                    strokeWidth="2.5" 
                  />
                  
                  {/* Прогресс круг */}
                  <circle 
                    cx="18" cy="18" r="15.9" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="2.5" 
                    strokeDasharray={`${completionPercentage * 100 / 100}, 100`} 
                    strokeDashoffset="25" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Текст в центре */}
                  <text 
                    x="18" y="19" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="currentColor" 
                    fontSize="8" 
                    fontWeight="bold"
                  >
                    {completionPercentage}%
                  </text>
                </svg>
              </div>
              <p className="text-sm text-center">
                <span className="font-medium">{completedCourses.length}</span> из <span className="font-medium">{progress.length}</span> курсов завершено
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Статус аккаунта</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">Тип аккаунта</div>
                  <div className="mt-1">
                    <Badge variant={user?.isAdmin ? "default" : "secondary"} className="text-xs">
                      {user?.isAdmin ? "Администратор" : "Обычный пользователь"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center bg-muted/50 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">Дата регистрации</div>
                  <div className="text-muted-foreground">
                    {new Date(user?.createdAt || Date.now()).toLocaleDateString(
                      "ru-RU",
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Завершенные курсы</h2>
        <Badge variant="outline" className="text-sm">
          {completedCourses.length} {completedCourses.length === 1 ? 'курс' : 
           completedCourses.length >= 2 && completedCourses.length <= 4 ? 'курса' : 'курсов'}
        </Badge>
      </div>

      {completedCourses.length === 0 ? (
        <Alert className="bg-muted/50 border border-border">
          <AlertTitle className="font-medium">Нет завершенных курсов</AlertTitle>
          <AlertDescription>
            Вы еще не завершили ни одного курса. Перейдите на панель, чтобы
            начать обучение.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedCourses.map((item) => (
            <Card key={item.courseId} className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  {item.course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.course.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Завершено{" "}
                  <span className="font-medium">
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild className="text-xs h-8">
                  <Link to={`/courses/${item.courseId}`}>Просмотр</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin page
function AdminPage() {
  const { data: user } = useQuery(["currentUser"], apiClient.getCurrentUser);
  const { data: courses = [] } = useQuery(["courses"], apiClient.listCourses);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Course form state
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    pdfFile: null as File | null,
    videoUrl: "",
  });

  // Bulk upload state
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Editing state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editedCourse, setEditedCourse] = useState({
    id: "",
    title: "",
    description: "",
    videoUrl: "",
    pdfFile: null as File | null,
  });

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора.",
        variant: "destructive",
      });
    }
  }, [user, navigate]);

  const createCourseMutation = useMutation(apiClient.createCourse, {
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setNewCourse({
        title: "",
        description: "",
        pdfFile: null,
        videoUrl: "",
      });
      toast({
        title: "Курс создан",
        description: "Курс был успешно создан.",
      });
    },
  });

  const bulkCreateCoursesMutation = useMutation(apiClient.bulkCreateCourses, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(["courses"]);
      setBulkUploadFile(null);
      setShowBulkUpload(false);
      toast({
        title: "Массовая загрузка завершена",
        description: `Успешно добавлено ${data.success} курсов. ${data.failed > 0 ? `Не удалось добавить ${data.failed} курсов.` : ""}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка массовой загрузки",
        description:
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation(apiClient.deleteCourse, {
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      toast({
        title: "Курс удален",
        description: "Курс был успешно удален.",
      });
    },
  });

  const updateCourseMutation = useMutation(apiClient.updateCourse, {
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setEditingCourseId(null);
      toast({
        title: "Курс обновлен",
        description: "Курс был успешно обновлен.",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCourse.title || !newCourse.description || !newCourse.pdfFile) {
      toast({
        title: "Отсутствует информация",
        description: "Пожалуйста, заполните все обязательные поля.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBase64 = await encodeFileAsBase64DataURL(newCourse.pdfFile);

      createCourseMutation.mutate({
        title: newCourse.title,
        description: newCourse.description,
        pdfBase64,
        videoUrl: newCourse.videoUrl || undefined,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обработать PDF файл.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedCourse.id) return;

    const updateData: {
      id: string;
      title?: string;
      description?: string;
      pdfBase64?: string;
      videoUrl?: string;
    } = {
      id: editedCourse.id,
    };

    // Only include fields that have changed
    const originalCourse = courses.find((c) => c.id === editedCourse.id);
    if (!originalCourse) return;

    if (editedCourse.title !== originalCourse.title) {
      updateData.title = editedCourse.title;
    }

    if (editedCourse.description !== originalCourse.description) {
      updateData.description = editedCourse.description;
    }

    if (editedCourse.videoUrl !== (originalCourse.videoUrl || "")) {
      updateData.videoUrl = editedCourse.videoUrl || undefined;
    }

    if (editedCourse.pdfFile) {
      try {
        updateData.pdfBase64 = await encodeFileAsBase64DataURL(
          editedCourse.pdfFile,
        );
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось обработать PDF файл.",
          variant: "destructive",
        });
        return;
      }
    }

    updateCourseMutation.mutate(updateData);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkUploadFile) {
      toast({
        title: "Файл не выбран",
        description: "Пожалуйста, выберите JSON файл для загрузки.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Read and parse the JSON file
      const fileContent = await bulkUploadFile.text();
      const coursesData = JSON.parse(fileContent);

      if (!Array.isArray(coursesData)) {
        throw new Error(
          "Invalid format: File must contain an array of courses",
        );
      }

      // Process each course in the JSON file
      const coursesWithPdf: Array<{
        title: string;
        description: string;
        pdfBase64: string;
        videoUrl?: string;
      }> = [];

      for (const course of coursesData) {
        if (!course.title || !course.description || !course.pdfBase64) {
          throw new Error(
            `Invalid course data: ${course.title || "Unnamed course"} is missing required fields. Each course must include title, description, and pdfBase64.`,
          );
        }

        coursesWithPdf.push({
          title: course.title,
          description: course.description,
          pdfBase64: course.pdfBase64,
          videoUrl: course.videoUrl,
        });
      }

      bulkCreateCoursesMutation.mutate({ courses: coursesWithPdf });
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      toast({
        title: "Ошибка массовой загрузки",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось обработать JSON файл.",
        variant: "destructive",
      });
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setShowBulkUpload(!showBulkUpload)}
        >
          {showBulkUpload
            ? "Скрыть массовую загрузку"
            : "Показать массовую загрузку"}
        </Button>
      </div>

      {showBulkUpload && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Массовая загрузка курсов</CardTitle>
            <CardDescription>
              Загрузите несколько курсов одновременно, используя JSON файл
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkUploadFile">JSON Файл</Label>
                <Input
                  id="bulkUploadFile"
                  type="file"
                  accept="application/json"
                  onChange={(e) =>
                    setBulkUploadFile(e.target.files?.[0] || null)
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Загрузите JSON файл, содержащий массив объектов курсов. Каждый
                  объект должен содержать title, description, pdfBase64
                  (содержимое PDF в виде base64 строки) и опционально поле
                  videoUrl.
                </p>
                <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
                  <pre>{`[
  {
    "title": "Course Title 1",
    "description": "Course description 1",
    "pdfBase64": "data:application/pdf;base64,JVBERi0xLjM...",
    "videoUrl": "https://example.com/video1.mp4" (optional)
  },
  {
    "title": "Course Title 2",
    "description": "Course description 2",
    "pdfBase64": "data:application/pdf;base64,JVBERi0xLjM..."
  }
]`}</pre>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  bulkCreateCoursesMutation.isLoading || !bulkUploadFile
                }
                className="w-full"
              >
                {bulkCreateCoursesMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>Загрузить курсы</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Добавить новый курс</CardTitle>
            <CardDescription>
              Создайте новый курс с PDF материалами и опциональной видео-ссылкой
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название курса</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, title: e.target.value })
                  }
                  placeholder="Введите название курса"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  placeholder="Введите описание курса"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFile">PDF Презентация</Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      pdfFile: e.target.files?.[0] || null,
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Загрузите PDF файл с материалами курса
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Ссылка на видео (опционально)</Label>
                <Input
                  id="videoUrl"
                  value={newCourse.videoUrl}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, videoUrl: e.target.value })
                  }
                  placeholder="https://example.com/video"
                />
                <p className="text-xs text-muted-foreground">
                  Добавьте ссылку на дополнительное видео, если имеется
                </p>
              </div>

              <Button
                type="submit"
                disabled={createCourseMutation.isLoading}
                className="w-full"
              >
                {createCourseMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Добавить курс
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Управление существующими курсами</CardTitle>
            <CardDescription>
              Просмотр и управление всеми доступными курсами
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <Alert>
                <AlertTitle>Нет доступных курсов</AlertTitle>
                <AlertDescription>
                  Нет доступных курсов. Добавьте новый курс, чтобы начать.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    {editingCourseId === course.id ? (
                      <form
                        onSubmit={(e) => handleUpdateSubmit(e)}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`title-${course.id}`}>
                            Название курса
                          </Label>
                          <Input
                            id={`title-${course.id}`}
                            value={editedCourse.title}
                            onChange={(e) =>
                              setEditedCourse({
                                ...editedCourse,
                                title: e.target.value,
                              })
                            }
                            placeholder="Введите название курса"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`description-${course.id}`}>
                            Описание
                          </Label>
                          <Textarea
                            id={`description-${course.id}`}
                            value={editedCourse.description}
                            onChange={(e) =>
                              setEditedCourse({
                                ...editedCourse,
                                description: e.target.value,
                              })
                            }
                            placeholder="Введите описание курса"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`pdfFile-${course.id}`}>
                            PDF Презентация (опционально)
                          </Label>
                          <Input
                            id={`pdfFile-${course.id}`}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) =>
                              setEditedCourse({
                                ...editedCourse,
                                pdfFile: e.target.files?.[0] || null,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Загрузите новый PDF файл только если хотите заменить
                            текущий
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`videoUrl-${course.id}`}>
                            Ссылка на видео (опционально)
                          </Label>
                          <Input
                            id={`videoUrl-${course.id}`}
                            value={editedCourse.videoUrl}
                            onChange={(e) =>
                              setEditedCourse({
                                ...editedCourse,
                                videoUrl: e.target.value,
                              })
                            }
                            placeholder="https://example.com/video"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="submit"
                            disabled={updateCourseMutation.isLoading}
                            size="sm"
                          >
                            {updateCourseMutation.isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                                Обновление...
                              </>
                            ) : (
                              "Сохранить изменения"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCourseId(null);
                            }}
                          >
                            Отмена
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                          {course.videoUrl && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Видео: {course.videoUrl}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCourseId(course.id);
                              setEditedCourse({
                                id: course.id,
                                title: course.title,
                                description: course.description,
                                videoUrl: course.videoUrl || "",
                                pdfFile: null,
                              });
                            }}
                          >
                            Редактировать
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              deleteCourseMutation.mutate({ id: course.id })
                            }
                            disabled={deleteCourseMutation.isLoading}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth({ required: true });

  if (auth.status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

// Main App component
export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}
