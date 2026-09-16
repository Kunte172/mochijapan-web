import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/course.api';

export function CourseListPage() {
  const query = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  if (query.isLoading) {
    return <p>Đang tải khóa học...</p>;
  }

  if (query.isError) {
    return <p>Không thể tải khóa học: {query.error.message}</p>;
  }

  const courses = query.data ?? [];

  return (
    <section>
      <p className="eyebrow">Học</p>
      <div className="section-heading">
        <div>
          <h1>Khóa học</h1>
          <p className="lead">{courses.length} khóa học đang được phát hành.</p>
        </div>
      </div>
      <div className="course-grid">
        {courses.map((course) => (
          <Link className="course-card" to={`/learn/courses/${course.id}`} key={course.id}>
            <div className="course-image">
              {course.imageUrl ? <img src={course.imageUrl} alt="" /> : <span>日本語</span>}
            </div>
            <div className="course-card-body">
              <div className="course-meta">
                <span>{course.code ?? 'COURSE'}</span>
                <span>{course.lessonCount} bài</span>
              </div>
              <h2>{course.title}</h2>
              {course.titleEn && <p className="muted">{course.titleEn}</p>}
              <p>{course.description ?? 'Chưa có mô tả.'}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
