import React, { useState, useEffect } from "react";
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
  // ... остальные импорты компонентов
} from "~/components/ui";
import {
  Book,
  // ... остальные импорты иконок
} from "lucide-react";

// Вспомогательная функция для склонения
function getCoursePlural(count: number) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'курсов';
  const last = count % 10;
  return last === 1 ? 'курс' : last >= 2 && last <= 4 ? 'курса' : 'курсов';
}

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { data: user, isLoading: isUserLoading } = useQuery(
    ["currentUser"], 
    apiClient.getCurrentUser, 
    { enabled: auth.status === "authenticated" }
  );
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = () => {
    auth.signOut();
    navigate("/");
  };

  // ... остальной код компонента

  // Исправленная кнопка выхода
  <Button
    variant="ghost"
    size="sm"
    onClick={handleSignOut}
  >
    <LogOut className="h-4 w-4 mr-2" />
    Выйти
  </Button>
}

// DashboardPage
function DashboardPage() {
  // ... остальной код

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold">Доступные курсы</h1>
      <Badge variant="outline" className="text-sm">
        {courses.length} {getCoursePlural(courses.length)}
      </Badge>
    </div>
  );
}

// AdminPage
function AdminPage() {
  const { data: user, isLoading: isUserLoading } = useQuery(
    ["currentUser"], 
    apiClient.getCurrentUser
  );
  
  useEffect(() => {
    if (!isUserLoading && user && !user.isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора.",
        variant: "destructive",
      });
    }
  }, [user, isUserLoading, navigate]);

  // ... остальной код
}

// HomePage
function HomePage() {
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "bestra@live.ru" || adminEmail === "tvv@avtodigit.ru") {
      auth.signIn({ email: adminEmail });
    } else {
      // ... обработка ошибки
    }
  };

  // ... остальной код
}

// ProfilePage
function ProfilePage() {
  // ... остальной код

  <Badge variant="outline" className="text-sm">
    {completedCourses.length} {getCoursePlural(completedCourses.length)}
  </Badge>
}

// Исправление SVG прогресса
<circle 
  cx="18" cy="18" r="15.9" 
  fill="none" 
  stroke="hsl(var(--primary))" 
  strokeWidth="2.5" 
  strokeDasharray={`${completionPercentage}, 100`}
  strokeLinecap="round"
/>

// Исправление мутаций
const markCompletedMutation = useMutation(
  (data: { courseId: string }) => apiClient.markCourseAsCompleted(data),
  // ... обработчики
);

const deleteCourseMutation = useMutation(
  (data: { id: string }) => apiClient.deleteCourse(data),
  // ... обработчики
);
