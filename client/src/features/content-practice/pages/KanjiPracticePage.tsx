import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getKanjiPracticeQueue,
  rateKanji,
} from '../api/content-practice.api';
import { RatingButtons } from '../components/RatingButtons';
import type { ReviewRating } from '../types';

export function KanjiPracticePage() {
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const shownAt = useRef(performance.now());

  const query = useQuery({
    queryKey: ['kanji-practice-queue'],
    queryFn: () => getKanjiPracticeQueue(10),
  });

  const item = query.data?.items[0];

  useEffect(() => {
    if (!item?.content.id) return;
    shownAt.current = performance.now();
    setRevealed(false);
  }, [item?.content.id]);

  if (query.isLoading) {
    return <p>Đang tạo hàng đợi Kanji...</p>;
  }

  if (query.isError) {
    return <p>Không thể tải hàng đợi Kanji.</p>;
  }

  if (!item) {
    return (
      <section className="practice-complete-card">
        <p className="eyebrow">Kanji</p>
        <h1>Đã xử lý hết hàng đợi hiện tại</h1>
        <Link className="primary-button" to="/practice/kanji">Luyện Kanji</Link>
      </section>
    );
  }

  const currentItem = item;

  async function submit(rating: ReviewRating) {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      await rateKanji({
        kanjiId: currentItem.content.id,
        rating,
        responseTimeMs: Math.max(
          0,
          Math.round(performance.now() - shownAt.current),
        ),
        idempotencyKey: crypto.randomUUID(),
      });
      await query.refetch();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể lưu kết quả Kanji.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-practice-session">
      <div className="session-topbar">
        <Link to="/practice">← Thoát</Link>
        <strong>Kanji Practice</strong>
        <span>{currentItem.reason === 'DUE' ? 'Đến hạn' : 'Mới'}</span>
      </div>

      <article className="practice-flashcard kanji-practice-card">
        <p className="eyebrow">{currentItem.content.jlptLevel ?? 'JLPT'}</p>
        <div className="practice-kanji-character">{currentItem.content.character}</div>

        {!revealed ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => setRevealed(true)}
          >
            Hiện đáp án
          </button>
        ) : (
          <div className="practice-answer-panel">
            <h2>{currentItem.content.meaningsVi.join(', ')}</h2>
            {currentItem.content.meaningsEn.length > 0 && (
              <p>{currentItem.content.meaningsEn.join(', ')}</p>
            )}
            <div className="kanji-reading-grid">
              <div>
                <strong>On</strong>
                <p>{currentItem.content.onyomi.join('・') || '—'}</p>
              </div>
              <div>
                <strong>Kun</strong>
                <p>{currentItem.content.kunyomi.join('・') || '—'}</p>
              </div>
              <div>
                <strong>Số nét</strong>
                <p>{currentItem.content.strokeCount ?? '—'}</p>
              </div>
              <div>
                <strong>Bộ</strong>
                <p>{currentItem.content.radical ?? '—'}</p>
              </div>
            </div>
            {currentItem.content.words.length > 0 && (
              <div className="practice-linked-words">
                <strong>Từ liên quan</strong>
                {currentItem.content.words.map((word) => (
                  <span key={word.id}>
                    {word.writtenForm ?? word.reading} · {word.meaningVi}
                  </span>
                ))}
              </div>
            )}
            <RatingButtons disabled={saving} onRate={(rating) => void submit(rating)} />
          </div>
        )}

        {saving && <p>Đang lưu kết quả...</p>}
        {error && <p className="form-error">{error}</p>}
      </article>
    </section>
  );
}
