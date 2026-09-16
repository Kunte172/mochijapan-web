import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CourseDetailPage } from './features/courses/pages/CourseDetailPage';
import { CourseListPage } from './features/courses/pages/CourseListPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<CourseListPage />} />
        <Route path="/learn/courses/:courseId" element={<CourseDetailPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
