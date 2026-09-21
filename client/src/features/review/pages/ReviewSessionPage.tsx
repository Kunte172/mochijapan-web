import { useQuery } from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { submitSessionAnswer } from '../../learning/api/learning.api';
import type { ReviewRating } from '../../learning/types';
import { getActiveReviewSession } from '../api/review.api';

export function ReviewSessionPage() {
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const shownAt = useRef(performance.now());

  const sessionQuery = useQuery({
    queryKey: ['review-session', 'active'],
    queryFn: getActiveReviewSession,
  });

  const session = sessionQuery.data;

  const currentItem = session?.items.find(
    (item) => !item.answeredAt,
  );

  useEffect(() => {
    if (!currentItem?.id) {
      return;
    }

    shownAt.current = performance.now();
    setRevealed(false);
  }, [currentItem?.id]);

  if (sessionQuery.isLoading) {
    return <p>Đang tải phiên ôn tập...</p>;
  }

  if (sessionQuery.isError) {
    return <p>Không thể tải phiên ôn tập.</p>;
  }

  if (completed) {
    return (
      <section className="session-complete-card">
        <p className="eyebrow">Golden Hour</p>

        <h1>Đã hoàn thành phiên ôn tập</h1>

        <p>
          Kết quả đã được dùng để tính lịch ôn tiếp theo.
        </p>

        <Link
          className="primary-button"
          to="/review"
        >
          Xem lịch ôn
        </Link>
      </section>
    );
  }

  if (!session || !currentItem) {
    return (
      <section className="empty-review-card">
        <h1>Không có phiên ôn tập đang hoạt động</h1>

        <Link
          className="primary-button"
          to="/review"
        >
          Quay lại ôn tập
        </Link>
      </section>
    );
  }

  const sessionId = session.id;
  const totalItems = session.totalItems;
  const item = currentItem;
  const word = item.word;

  const answeredCount = session.items.filter(
    (sessionItem) => Boolean(sessionItem.answeredAt),
  ).length;

  const displayPosition = answeredCount + 1;

  async function playAudio(audioUrl: string | null) {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);

    await audio.play().catch(() => undefined);
  }

  async function rateWord(rating: ReviewRating) {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await submitSessionAnswer({
        sessionId,
        wordId: item.word.id,
        rating,
        responseTimeMs: Math.max(
          0,
          Math.round(
            performance.now() - shownAt.current,
          ),
        ),
        idempotencyKey: crypto.randomUUID(),
        currentPosition: item.position,
      });

      if (result.sessionCompleted) {
        setCompleted(true);
        return;
      }

      await sessionQuery.refetch();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể lưu kết quả ôn tập.',
      );
    } finally {
      setSaving(false);
    }
  }

  const progressPercent = totalItems > 0
    ? (displayPosition / totalItems) * 100
    : 0;

  return (
    <section className="learning-session">
      <div className="session-topbar">
        <Link to="/review">
          ← Thoát
        </Link>

        <strong>Golden Hour</strong>

        <span>
          {displayPosition}/{totalItems}
        </span>
      </div>

      <div className="session-progress">
        <div
          className="session-progress-bar"
          style={{
            width: `${progressPercent}%`,
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
          Review Priority {item.priorityScore}
        </p>

        <h1>
          {word.writtenForm ?? word.reading}
        </h1>

        {word.writtenForm && (
          <p className="reading">
            {word.reading}
          </p>
        )}

        {word.romaji && (
          <p className="muted">
            {word.romaji}
          </p>
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

            {word.meaningEn && (
              <p>{word.meaningEn}</p>
            )}

            {word.example && (
              <div className="example-box">
                <p>
                  {word.example.japanese}
                </p>

                {word.example.vietnamese && (
                  <p>
                    {word.example.vietnamese}
                  </p>
                )}
              </div>
            )}

            <div className="rating-grid">
              <button
                className="rating-button rating-again"
                type="button"
                disabled={saving}
                onClick={() => void rateWord('AGAIN')}
              >
                Chưa nhớ
              </button>

              <button
                className="rating-button"
                type="button"
                disabled={saving}
                onClick={() => void rateWord('HARD')}
              >
                Khó
              </button>

              <button
                className="rating-button"
                type="button"
                disabled={saving}
                onClick={() => void rateWord('GOOD')}
              >
                Nhớ
              </button>

              <button
                className="rating-button rating-easy"
                type="button"
                disabled={saving}
                onClick={() => void rateWord('EASY')}
              >
                Rất dễ
              </button>
            </div>
          </div>
        )}
      </article>

      {saving && (
        <p className="saving-indicator">
          Đang lưu kết quả...
        </p>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}