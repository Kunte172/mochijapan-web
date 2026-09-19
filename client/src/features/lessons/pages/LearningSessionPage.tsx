import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  completeLesson,
  startLesson,
  updateLessonProgress,
} from '../../learning/api/learning.api';
import { getLesson } from '../api/lesson.api';

export function LearningSessionPage() {
  const { lessonId } = useParams();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startRequested = useRef(false);

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId as string),
    enabled: Boolean(lessonId),
  });

  const startMutation = useMutation({
    mutationFn: () => startLesson(lessonId as string),
  });

  const progressMutation = useMutation({
    mutationFn: (currentPosition: number) =>
      updateLessonProgress(lessonId as string, currentPosition),
  });

  const completeMutation = useMutation({
    mutationFn: (sessionId: string) => completeLesson(lessonId as string, sessionId),
    onSuccess: async () => {
      setCompleted(true);
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId] });
    },
  });

  useEffect(() => {
    if (lessonId && lessonQuery.data && !startRequested.current) {
      startRequested.current = true;
      startMutation.mutate();
    }
  }, [lessonId, lessonQuery.data]);

  useEffect(() => {
    const startData = startMutation.data;
    if (!startData || !lessonQuery.data) return;

    if (startData.progress.status === 'COMPLETED') {
      setIndex(0);
      return;
    }

    const resumeIndex = Math.min(
      startData.progress.currentPosition,
      Math.max(lessonQuery.data.words.length - 1, 0),
    );
    setIndex(resumeIndex);
  }, [lessonQuery.data, startMutation.data]);

  const lesson = lessonQuery.data;
  const word = useMemo(() => lesson?.words[index], [lesson, index]);

  if (!lessonId) return <p>Lesson ID không hợp lệ.</p>;
  if (lessonQuery.isLoading) return <p>Đang tải bài học...</p>;
  if (lessonQuery.isError || !lesson) return <p>Không thể tải bài học.</p>;
  if (startMutation.isPending) return <p>Đang tạo phiên học...</p>;
  if (startMutation.isError) {
    return <p>Không thể bắt đầu phiên học: {startMutation.error.message}</p>;
  }
  if (!startMutation.data || !word) return <p>Đang chuẩn bị phiên học...</p>;

  if (completed) {
    return (
      <section className="session-complete-card">
        <p className="eyebrow">Hoàn thành</p>
        <h1>Đã hoàn thành bài học</h1>
        <p>Tiến độ và trạng thái từ vựng đã được lưu vào MochiJapan.</p>
        <Link className="primary-button" to={`/learn/lessons/${lesson.id}`}>
          Quay lại bài học
        </Link>
      </section>
    );
  }

  const session = startMutation.data.session;
  const isFirst = index === 0;
  const isLast = index === lesson.words.length - 1;

  function moveNext() {
    if (isLast) {
      completeMutation.mutate(session.id);
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setRevealed(false);
    progressMutation.mutate(nextIndex);
  }

  function movePrevious() {
    if (isFirst) return;
    setIndex((current) => current - 1);
    setRevealed(false);
  }

  async function playAudio(audioUrl: string | null) {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);

    await audio.play().catch(() => undefined);
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
          style={{ width: `${((index + 1) / lesson.wordCount) * 100}%` }}
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
        {word.audioUrl && (
          <button className="audio-button" type="button" onClick={() => void playAudio(word.audioUrl)}>
            Nghe phát âm
          </button>
        )}
        {!revealed ? (
          <button className="primary-button" type="button" onClick={() => setRevealed(true)}>
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
      {(progressMutation.isError || completeMutation.isError) && (
        <p className="form-error">Không thể lưu tiến độ. Hãy thử lại.</p>
      )}
      <div className="session-actions">
        <button className="secondary-button" type="button" disabled={isFirst} onClick={movePrevious}>
          Trước
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={progressMutation.isPending || completeMutation.isPending}
          onClick={moveNext}
        >
          {isLast
            ? completeMutation.isPending ? 'Đang hoàn thành...' : 'Hoàn thành'
            : progressMutation.isPending ? 'Đang lưu...' : 'Tiếp theo'}
        </button>
      </div>
    </section>
  );
}
