import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthBootstrap } from './features/auth/components/AuthBootstrap';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { CourseDetailPage } from './features/courses/pages/CourseDetailPage';
import { CourseListPage } from './features/courses/pages/CourseListPage';
import { LessonDetailPage } from './features/lessons/pages/LessonDetailPage';
import { LearningSessionPage } from './features/lessons/pages/LearningSessionPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <>
      <AuthBootstrap />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/learn" element={<CourseListPage />} />
          <Route path="/learn/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/learn/lessons/:lessonId" element={<LessonDetailPage />} />
          <Route
            path="/learn/lessons/:lessonId/session"
            element={
              <ProtectedRoute>
                <LearningSessionPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
