import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getGrammarPracticeQueue,
  rateGrammar,
} from '../api/content-practice.api';
import { RatingButtons } from '../components/RatingButtons';
import type { ReviewRating } from '../types';

export function GrammarPracticePage() {
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const shownAt = useRef(performance.now());

  const query = useQuery({
    queryKey: ['grammar-practice-queue'],
    queryFn: () => getGrammarPracticeQueue(10),
  });

  const item = query.data?.items[0];

  useEffect(() => {
    if (!item?.content.id) return;
    shownAt.current = performance.now();
    setRevealed(false);
  }, [item?.content.id]);

  if (query.isLoading) {
    return <p>Đang tạo hàng đợi ngữ pháp...</p>;
  }

  if (query.isError) {
    return <p>Không thể tải hàng đợi ngữ pháp.</p>;
  }

  if (!item) {
    return (
      <section className="practice-complete-card">
        <p className="eyebrow">Grammar</p>
        <h1>Đã xử lý hết hàng đợi hiện tại</h1>
        <p>Không còn điểm ngữ pháp đến hạn hoặc mới trong batch này.</p>
        <Link className="primary-button" to="/practice/grammar">Luyện ngữ pháp</Link>
      </section>
    );
  }

  const currentItem = item;

  async function submit(rating: ReviewRating) {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      await rateGrammar({
        grammarId: currentItem.content.id,
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
          : 'Không thể lưu kết quả ngữ pháp.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-practice-session">
      <div className="session-topbar">
        <Link to="/practice">← Thoát</Link>
        <strong>Grammar Practice</strong>
        <span>{currentItem.reason === 'DUE' ? 'Đến hạn' : 'Mới'}</span>
      </div>

      <article className="practice-flashcard">
        <p className="eyebrow">{currentItem.content.jlptLevel ?? 'JLPT'}</p>
        <h1>{currentItem.content.pattern}</h1>

        {!revealed ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => setRevealed(true)}
          >
            Hiện giải thích
          </button>
        ) : (
          <div className="practice-answer-panel">
            <h2>{currentItem.content.meaningVi}</h2>
            {currentItem.content.meaningEn && <p>{currentItem.content.meaningEn}</p>}
            {currentItem.content.formation && (
              <div className="practice-info-box">
                <strong>Cấu trúc</strong>
                <p>{currentItem.content.formation}</p>
              </div>
            )}
            {currentItem.content.explanationVi && (
              <p>{currentItem.content.explanationVi}</p>
            )}
            {currentItem.content.examples.map((example) => (
              <div className="practice-example" key={example.id}>
                <strong>{example.japanese}</strong>
                {example.vietnamese && <span>{example.vietnamese}</span>}
              </div>
            ))}
            <RatingButtons disabled={saving} onRate={(rating) => void submit(rating)} />
          </div>
        )}

        {saving && <p>Đang lưu kết quả...</p>}
        {error && <p className="form-error">{error}</p>}
      </article>
    </section>
  );
}
