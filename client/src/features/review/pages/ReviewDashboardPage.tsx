import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getActiveReviewSession,
  getReviewSummary,
  startReviewSession,
} from '../api/review.api';

export function ReviewDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({
    queryKey: ['review-summary'],
    queryFn: getReviewSummary,
  });
  const activeQuery = useQuery({
    queryKey: ['review-session', 'active'],
    queryFn: getActiveReviewSession,
  });
  const startMutation = useMutation({
    mutationFn: () => startReviewSession(20),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ['review-session', 'active'],
      });

      if (result.session) {
        navigate('/review/session');
      }
    },
  });

  if (summaryQuery.isLoading || activeQuery.isLoading) {
    return <p>Đang tải dữ liệu ôn tập...</p>;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <p>Không thể tải dữ liệu ôn tập.</p>;
  }

  const summary = summaryQuery.data;
  const activeSession = activeQuery.data;

  return (
    <section className="review-dashboard">
      <div className="review-hero">
        <div>
          <p className="eyebrow">Golden Hour</p>
          <h1>Ôn tập đúng lúc</h1>
          <p>
            Hệ thống ưu tiên từ đã đến lịch, mức nhớ thấp và có nhiều lần quên.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={startMutation.isPending}
          onClick={() => startMutation.mutate()}
        >
          {activeSession
            ? 'Tiếp tục phiên ôn tập'
            : summary.dueNow > 0
              ? `Ôn ${Math.min(summary.dueNow, 20)} từ ngay`
              : 'Kiểm tra lịch ôn'}
        </button>
      </div>
      <div className="review-stat-grid">
        <article className="review-stat-card">
          <span>Đến hạn</span>
          <strong>{summary.dueNow}</strong>
        </article>
        <article className="review-stat-card">
          <span>Cửa sổ vàng ±60 phút</span>
          <strong>{summary.goldenWindow}</strong>
        </article>
        <article className="review-stat-card">
          <span>24 giờ tới</span>
          <strong>{summary.dueNext24Hours}</strong>
        </article>
        <article className="review-stat-card">
          <span>Đã ôn 24 giờ qua</span>
          <strong>{summary.reviewedLast24Hours}</strong>
        </article>
      </div>
      {summary.dueNow === 0 && !activeSession && (
        <div className="empty-review-card">
          <h2>Chưa có từ đến hạn</h2>
          <p>
            {summary.nextReviewAt
              ? `Lịch gần nhất: ${new Date(summary.nextReviewAt).toLocaleString()}`
              : 'Hãy hoàn thành một bài học để tạo lịch ôn.'}
          </p>
        </div>
      )}
      <div className="mastery-panel">
        <h2>Phân bố mức độ ghi nhớ</h2>
        <div className="mastery-list">
          {summary.masteryDistribution.map((item) => (
            <div className="mastery-row" key={item.masteryLevel}>
              <span>Level {item.masteryLevel}</span>
              <strong>{item.count} từ</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
