import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CourseDetailPage } from './features/courses/pages/CourseDetailPage';
import { CourseListPage } from './features/courses/pages/CourseListPage';
import { HomePage } from './pages/HomePage';
import { LessonDetailPage } from './features/lessons/pages/LessonDetailPage';
import { LearningSessionPage } from './features/lessons/pages/LearningSessionPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<CourseListPage />} />
        <Route path="/learn/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/learn/lessons/:lessonId" element={<LessonDetailPage />} />
        <Route path="/learn/lessons/:lessonId/session" element={<LearningSessionPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
