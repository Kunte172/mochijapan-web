import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getCourse } from '../api/course.api';

export function CourseDetailPage() {
  const { courseId } = useParams();

  const query = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId as string),
    enabled: Boolean(courseId),
  });

  if (!courseId) {
    return <p>Course ID không hợp lệ.</p>;
  }

  if (query.isLoading) {
    return <p>Đang tải nội dung khóa học...</p>;
  }

  if (query.isError) {
    return <p>Không thể tải khóa học: {query.error.message}</p>;
  }

  if (!query.data) {
    return <p>Không tìm thấy khóa học.</p>;
  }

  const course = query.data;

  return (
    <section>
      <Link className="back-link" to="/learn">
        ← Tất cả khóa học
      </Link>
      <div className="course-hero">
        <div>
          <p className="eyebrow">{course.code ?? 'Course'}</p>
          <h1>{course.title}</h1>
          {course.titleEn && <p className="lead">{course.titleEn}</p>}
          <p>{course.description ?? 'Chưa có mô tả.'}</p>
          <div className="summary-row">
            <span>{course.lessonCount} bài học</span>
            {course.level && <span>{course.level}</span>}
          </div>
        </div>
      </div>
      <div className="lesson-list">
        {course.lessons.map((lesson, index) => (
          <article className="lesson-row" key={lesson.id}>
            <div className="lesson-index">{index + 1}</div>
            <div className="lesson-main">
              <div className="lesson-title-row">
                <h2>{lesson.title}</h2>
                <span>{lesson.wordCount} từ</span>
              </div>
              {lesson.titleEn && <p className="muted">{lesson.titleEn}</p>}
              {lesson.description && <p>{lesson.description}</p>}
            </div>
            <Link className="secondary-button" to={`/learn/lessons/${lesson.id}`}>
              Mở bài học
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
