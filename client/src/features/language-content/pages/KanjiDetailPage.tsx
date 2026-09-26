import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getKanjiDetail } from '../api/language-content.api';

export function KanjiDetailPage() {
  const { character } = useParams();

  const query = useQuery({
    queryKey: ['kanji-detail', character],
    queryFn: () => getKanjiDetail(character as string),
    enabled: Boolean(character),
  });

  if (!character) {
    return <p>Kanji không hợp lệ.</p>;
  }

  if (query.isLoading) {
    return <p>Đang tải Kanji...</p>;
  }

  if (query.isError || !query.data) {
    return <p>Không thể tải chi tiết Kanji.</p>;
  }

  const kanji = query.data;

  return (
    <section className="kanji-detail-page">
      <Link className="back-link" to="/kanji">← Danh sách Kanji</Link>

      <div className="kanji-hero">
        <div className="kanji-glyph">{kanji.character}</div>
        <div>
          <p className="eyebrow">{kanji.jlptLevel ?? 'Kanji'}</p>
          <h1>{kanji.meaningsVi.join(', ')}</h1>
          <p>{kanji.meaningsEn.join(', ')}</p>
          <div className="kanji-meta-grid">
            <div><strong>On</strong><span>{kanji.onyomi.join('、') || '—'}</span></div>
            <div><strong>Kun</strong><span>{kanji.kunyomi.join('、') || '—'}</span></div>
            <div><strong>Số nét</strong><span>{kanji.strokeCount ?? '—'}</span></div>
            <div><strong>Bộ</strong><span>{kanji.radical ?? '—'}</span></div>
          </div>
        </div>
      </div>

      <article className="language-content-card">
        <h2>Từ vựng có chứa {kanji.character}</h2>
        <div className="kanji-word-list">
          {kanji.words.map((word) => (
            <div className="kanji-word-row" key={word.id}>
              <div>
                <strong>{word.writtenForm ?? word.reading}</strong>
                <span>{word.reading}</span>
              </div>
              <span>{word.meaningVi}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
