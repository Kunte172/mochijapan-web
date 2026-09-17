import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getLesson } from '../api/lesson.api';

export function LessonDetailPage() {
  const { lessonId } = useParams();

  const query = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId as string),
    enabled: Boolean(lessonId),
  });

  if (!lessonId) {
    return <p>Lesson ID không hợp lệ.</p>;
  }

  if (query.isLoading) {
    return <p>Đang tải bài học...</p>;
  }

  if (query.isError) {
    return <p>Không thể tải bài học: {query.error.message}</p>;
  }

  if (!query.data) {
    return <p>Không tìm thấy bài học.</p>;
  }

  const lesson = query.data;

  return (
    <section>
      <Link className="back-link" to={`/learn/courses/${lesson.course.id}`}>
        ← {lesson.course.title}
      </Link>
      <div className="course-hero">
        <div>
          <p className="eyebrow">{lesson.code ?? 'Lesson'}</p>
          <h1>{lesson.title}</h1>
          {lesson.titleEn && <p className="lead">{lesson.titleEn}</p>}
          <p>{lesson.description ?? 'Chưa có mô tả.'}</p>
          <div className="summary-row">
            <span>{lesson.wordCount} từ</span>
          </div>
          <Link className="primary-button" to={`/learn/lessons/${lesson.id}/session`}>
            Bắt đầu học
          </Link>
        </div>
      </div>
      <div className="lesson-word-preview">
        <h2>Nội dung bài học</h2>
        {lesson.words.map((word) => (
          <article className="word-preview-row" key={word.id}>
            <div>
              <strong>{word.writtenForm ?? word.reading}</strong>
              {word.writtenForm && <span className="muted"> {word.reading}</span>}
            </div>
            <div>{word.meaningVi}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
