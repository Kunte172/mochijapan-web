import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import {
  completeLesson,
  startLesson,
  submitLearningAnswer,
} from '../../learning/api/learning.api';
import type { ReviewRating } from '../../learning/types';
import { getLesson } from '../api/lesson.api';

export function LearningSessionPage() {
  const { lessonId } = useParams();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startRequested = useRef(false);
  const shownAt = useRef(performance.now());

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId as string),
    enabled: Boolean(lessonId),
  });

  const startMutation = useMutation({
    mutationFn: () => startLesson(lessonId as string),
  });

  const answerMutation = useMutation({
    mutationFn: submitLearningAnswer,
  });

  const completeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      completeLesson(lessonId as string, sessionId),
    onSuccess: async () => {
      setCompleted(true);
      await queryClient.invalidateQueries({
        queryKey: ['lesson-progress', lessonId],
      });
    },
  });

  useEffect(() => {
    if (
      lessonId &&
      lessonQuery.data &&
      !startRequested.current
    ) {
      startRequested.current = true;
      startMutation.mutate();
    }
  }, [lessonId, lessonQuery.data]);

  useEffect(() => {
    const startData = startMutation.data;

    if (!startData || !lessonQuery.data) {
      return;
    }

    const resumeIndex = startData.progress.status === 'COMPLETED'
      ? 0
      : Math.min(
          startData.progress.currentPosition,
          Math.max(lessonQuery.data.words.length - 1, 0),
        );

    setIndex(resumeIndex);
    setRevealed(false);
    shownAt.current = performance.now();
  }, [lessonQuery.data, startMutation.data]);

  const lesson = lessonQuery.data;
  const word = useMemo(
    () => lesson?.words[index],
    [lesson, index],
  );

  if (!lessonId) {
    return <p>Lesson ID không hợp lệ.</p>;
  }

  if (lessonQuery.isLoading) {
    return <p>Đang tải bài học...</p>;
  }

  if (lessonQuery.isError || !lesson) {
    return <p>Không thể tải bài học.</p>;
  }

  if (startMutation.isPending) {
    return <p>Đang tạo phiên học...</p>;
  }

  if (startMutation.isError) {
    return (
      <p>
        Không thể bắt đầu phiên học: {startMutation.error.message}
      </p>
    );
  }

  if (!startMutation.data || !word) {
    return <p>Đang chuẩn bị phiên học...</p>;
  }

  if (completed) {
    return (
      <section className="session-complete-card">
        <p className="eyebrow">Hoàn thành</p>
        <h1>Đã hoàn thành bài học</h1>
        <p>
          Kết quả từng từ và tiến độ bài học đã được lưu.
        </p>
        <Link
          className="primary-button"
          to={`/learn/lessons/${lesson.id}`}
        >
          Quay lại bài học
        </Link>
      </section>
    );
  }

  const session = startMutation.data.session;
  const isLast = index === lesson.words.length - 1;

  async function playAudio(audioUrl: string | null) {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);
    await audio.play().catch(() => undefined);
  }

  async function rateWord(rating: ReviewRating) {
    const currentWord = lesson?.words[index];

    if (!currentWord) {
      return;
    }

    const responseTimeMs = Math.max(
      0,
      Math.round(performance.now() - shownAt.current),
    );

    try {
      await answerMutation.mutateAsync({
        sessionId: session.id,
        wordId: currentWord.id,
        rating,
        responseTimeMs,
        idempotencyKey: crypto.randomUUID(),
        currentPosition: index + 1,
      });

      if (isLast) {
        await completeMutation.mutateAsync(session.id);
        return;
      }

      setIndex((current) => current + 1);
      setRevealed(false);
      shownAt.current = performance.now();
    } catch {
      return;
    }
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
        <p className="eyebrow">
          {word.partOfSpeech ?? 'Vocabulary'}
        </p>
        <h1>{word.writtenForm ?? word.reading}</h1>
        {word.writtenForm && (
          <p className="reading">{word.reading}</p>
        )}
        {word.romaji && (
          <p className="muted">{word.romaji}</p>
        )}
        {word.audioUrl && (
          <button
            className="audio-button"
            type="button"
            onClick={() => void playAudio(word.audioUrl)}
          >
            Nghe phát âm
          </button>
        )}
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
                {word.example.vietnamese && (
                  <p>{word.example.vietnamese}</p>
                )}
              </div>
            )}
            <div className="rating-grid">
              <button
                className="rating-button rating-again"
                type="button"
                disabled={answerMutation.isPending || completeMutation.isPending}
                onClick={() => void rateWord('AGAIN')}
              >
                Chưa nhớ
                <small>Giảm 1 mức</small>
              </button>
              <button
                className="rating-button"
                type="button"
                disabled={answerMutation.isPending || completeMutation.isPending}
                onClick={() => void rateWord('HARD')}
              >
                Khó
                <small>Giữ mức</small>
              </button>
              <button
                className="rating-button"
                type="button"
                disabled={answerMutation.isPending || completeMutation.isPending}
                onClick={() => void rateWord('GOOD')}
              >
                Nhớ
                <small>Tăng 1 mức</small>
              </button>
              <button
                className="rating-button rating-easy"
                type="button"
                disabled={answerMutation.isPending || completeMutation.isPending}
                onClick={() => void rateWord('EASY')}
              >
                Rất dễ
                <small>Tăng 2 mức</small>
              </button>
            </div>
          </div>
        )}
      </article>
      {(answerMutation.isError || completeMutation.isError) && (
        <p className="form-error">
          Không thể lưu kết quả. Hãy thử lại.
        </p>
      )}
      {(answerMutation.isPending || completeMutation.isPending) && (
        <p className="saving-indicator">Đang lưu kết quả...</p>
      )}
    </section>
  );
}
