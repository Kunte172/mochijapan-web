import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLesson } from '../api/lesson.api';

export function LearningSessionPage() {
  const { lessonId } = useParams();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const query = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId as string),
    enabled: Boolean(lessonId),
  });

  const lesson = query.data;
  const word = useMemo(
    () => lesson?.words[index],
    [lesson, index],
  );

  if (!lessonId) {
    return <p>Lesson ID không hợp lệ.</p>;
  }

  if (query.isLoading) {
    return <p>Đang chuẩn bị phiên học...</p>;
  }

  if (query.isError || !lesson || !word) {
    return <p>Không thể mở phiên học.</p>;
  }

  const isFirst = index === 0;
  const isLast = index === lesson.words.length - 1;

  function move(nextIndex: number) {
    setIndex(nextIndex);
    setRevealed(false);
  }

  return (
    <section className="learning-session">
      <div className="session-topbar">
        <Link to={`/learn/lessons/${lesson.id}`}>← Thoát</Link>
        <strong>{lesson.title}</strong>
        <span>{index + 1}/{lesson.wordCount}</span>
      </div>
      <div className="session-progress">
        <div
          className="session-progress-bar"
          style={{
            width: `${((index + 1) / lesson.wordCount) * 100}%`,
          }}
        />
      </div>
      <article className="flashcard-shell">
        {word.pictureUrl && (
          <img
            className="flashcard-image"
            src={word.pictureUrl}
            alt={word.writtenForm ?? word.reading}
          />
        )}
        <p className="eyebrow">{word.partOfSpeech ?? 'Vocabulary'}</p>
        <h1>{word.writtenForm ?? word.reading}</h1>
        {word.writtenForm && <p className="reading">{word.reading}</p>}
        {word.romaji && <p className="muted">{word.romaji}</p>}
        {!revealed ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => setRevealed(true)}
          >
            Hiện nghĩa
          </button>
        ) : (
          <div className="answer-panel">
            <h2>{word.meaningVi}</h2>
            {word.meaningEn && <p>{word.meaningEn}</p>}
            {word.example && (
              <div className="example-box">
                <p>{word.example.japanese}</p>
                {word.example.vietnamese && <p>{word.example.vietnamese}</p>}
              </div>
            )}
          </div>
        )}
      </article>
      <div className="session-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={isFirst}
          onClick={() => move(index - 1)}
        >
          Trước
        </button>
        {!isLast ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => move(index + 1)}
          >
            Tiếp theo
          </button>
        ) : (
          <Link className="primary-button" to={`/learn/lessons/${lesson.id}`}>
            Hoàn tất xem trước
          </Link>
        )}
      </div>
    </section>
  );
}
