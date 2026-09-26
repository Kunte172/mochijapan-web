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
import { ReviewDashboardPage } from './features/review/pages/ReviewDashboardPage';
import { ReviewSessionPage } from './features/review/pages/ReviewSessionPage';
import { LessonQuizPage } from './features/quiz/pages/LessonQuizPage';
import { DictionaryPage } from './features/dictionary/pages/DictionaryPage';
import { NotebookPage } from './features/notebook/pages/NotebookPage';
import { LearningAnalyticsPage } from './features/analytics/pages/LearningAnalyticsPage';
import { GrammarPage } from './features/language-content/pages/GrammarPage';
import { KanjiPage } from './features/language-content/pages/KanjiPage';
import { KanjiDetailPage } from './features/language-content/pages/KanjiDetailPage';
import { PracticeDashboardPage } from './features/content-practice/pages/PracticeDashboardPage';
import { GrammarPracticePage } from './features/content-practice/pages/GrammarPracticePage';
import { KanjiPracticePage } from './features/content-practice/pages/KanjiPracticePage';

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
          <Route path="/learn/lessons/:lessonId/session" element={
              <ProtectedRoute>
                <LearningSessionPage />
              </ProtectedRoute>
            }
          />
          <Route path="/review" element={
              <ProtectedRoute>
                <ReviewDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/review/session" element={
              <ProtectedRoute>
                <ReviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route path="/learn/lessons/:lessonId/quiz" element={
              <ProtectedRoute>
                <LessonQuizPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/notebook" element={
              <ProtectedRoute>
                <NotebookPage />
              </ProtectedRoute>
            }
          />
          <Route path="/analytics" element={
              <ProtectedRoute>
                <LearningAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/kanji" element={<KanjiPage />} />
          <Route path="/kanji/:character" element={<KanjiDetailPage />} />
          <Route path="/practice" element={
              <ProtectedRoute>
                <PracticeDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/practice/grammar" element={
              <ProtectedRoute>
                <GrammarPracticePage />
              </ProtectedRoute>
            }
          />
          <Route path="/practice/kanji" element={
              <ProtectedRoute>
                <KanjiPracticePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
