import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPracticeSummary } from '../api/content-practice.api';

export function PracticeDashboardPage() {
  const query = useQuery({
    queryKey: ['content-practice-summary'],
    queryFn: getPracticeSummary,
  });

  if (query.isLoading) {
    return <p>Đang tải luyện tập...</p>;
  }

  if (query.isError || !query.data) {
    return <p>Không thể tải dữ liệu luyện tập.</p>;
  }

  const data = query.data;

  return (
    <section className="content-practice-page">
      <div className="practice-heading">
        <p className="eyebrow">Adaptive Practice</p>
        <h1>Luyện tập ngữ pháp & Kanji</h1>
        <p>
          Ưu tiên nội dung đến hạn trước, sau đó bổ sung nội dung mới.
        </p>
      </div>

      <div className="practice-domain-grid">
        <article className="practice-domain-card">
          <p className="eyebrow">Grammar</p>
          <h2>Ngữ pháp</h2>
          <div className="practice-stats">
            <div><span>Đến hạn</span><strong>{data.grammar.due}</strong></div>
            <div><span>Đã học</span><strong>{data.grammar.learned}</strong></div>
            <div><span>Mới</span><strong>{data.grammar.new}</strong></div>
          </div>
          <Link className="primary-button" to="/practice/grammar">
            Luyện ngữ pháp
          </Link>
        </article>

        <article className="practice-domain-card">
          <p className="eyebrow">Kanji</p>
          <h2>Kanji</h2>
          <div className="practice-stats">
            <div><span>Đến hạn</span><strong>{data.kanji.due}</strong></div>
            <div><span>Đã học</span><strong>{data.kanji.learned}</strong></div>
            <div><span>Mới</span><strong>{data.kanji.new}</strong></div>
          </div>
          <Link className="primary-button" to="/practice/kanji">
            Luyện Kanji
          </Link>
        </article>
      </div>
    </section>
  );
}
