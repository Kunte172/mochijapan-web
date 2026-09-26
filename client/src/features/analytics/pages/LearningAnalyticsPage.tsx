import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getLearningAnalytics } from '../api/analytics.api';

function minutesLabel(value: number) {
  if (value < 60) return `${value} phút`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function LearningAnalyticsPage() {
  const [days, setDays] = useState(14);
  const query = useQuery({
    queryKey: ['learning-analytics', days],
    queryFn: () => getLearningAnalytics(days),
  });

  if (query.isLoading) return <p>Đang tổng hợp thống kê...</p>;
  if (query.isError || !query.data) return <p>Không thể tải thống kê học tập.</p>;
  const data = query.data;

  return (
    <section className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="eyebrow">Learning Analytics</p>
          <h1>Tiến độ học tập</h1>
          <p>Dữ liệu được tổng hợp từ phiên học, ReviewEvent, Quiz và trạng thái ghi nhớ.</p>
        </div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={90}>90 ngày</option>
        </select>
      </div>

      <div className="analytics-kpi-grid">
        <article className="analytics-kpi"><span>Từ đã học</span><strong>{data.overview.learnedWords}</strong></article>
        <article className="analytics-kpi"><span>Lesson hoàn thành</span><strong>{data.overview.completedLessons}</strong></article>
        <article className="analytics-kpi"><span>Đến hạn ôn</span><strong>{data.overview.dueNow}</strong></article>
        <article className="analytics-kpi"><span>Chuỗi học hiện tại</span><strong>{data.overview.currentStreakDays} ngày</strong></article>
        <article className="analytics-kpi"><span>Độ chính xác</span><strong>{data.overview.accuracyPercent}%</strong></article>
        <article className="analytics-kpi"><span>Thời gian học</span><strong>{minutesLabel(data.overview.studyMinutes)}</strong></article>
      </div>

      <div className="analytics-chart-grid">
        <article className="analytics-card">
          <div className="analytics-card-heading"><h2>Hoạt động theo ngày</h2><p>Số lượt tương tác và câu trả lời đúng.</p></div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.activity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reviews" name="Lượt học/ôn" stroke="#111827" strokeWidth={2} />
                <Line type="monotone" dataKey="correct" name="Đúng" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-heading"><h2>Phân bố mức độ thành thạo</h2><p>Mastery level 0–5 của toàn bộ từ đã học.</p></div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.masteryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="masteryLevel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Số từ" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="analytics-card">
        <div className="analytics-card-heading"><h2>Hiệu quả theo chế độ học</h2></div>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead><tr><th>Chế độ</th><th>Phiên</th><th>Items</th><th>Đúng</th><th>Accuracy</th><th>Thời gian</th></tr></thead>
            <tbody>
              {data.modes.map((mode) => (
                <tr key={mode.type}>
                  <td>{mode.type}</td><td>{mode.sessions}</td><td>{mode.totalItems}</td><td>{mode.correctItems}</td><td>{mode.accuracyPercent}%</td><td>{minutesLabel(mode.studyMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="analytics-chart-grid">
        <article className="analytics-card">
          <div className="analytics-card-heading"><h2>Quiz</h2></div>
          <div className="quiz-analytics">
            <div><span>Đã hoàn thành</span><strong>{data.quiz.completedAttempts}</strong></div>
            <div><span>Điểm trung bình</span><strong>{data.quiz.averageScorePercent}%</strong></div>
            <div><span>Điểm tốt nhất</span><strong>{data.quiz.bestScorePercent}%</strong></div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-heading"><h2>Từ cần chú ý</h2><p>Ưu tiên theo lapse, số lần sai và mastery thấp.</p></div>
          <div className="difficult-word-list">
            {data.difficultWords.map((item) => (
              <div className="difficult-word-row" key={item.word.id}>
                <div>
                  <strong>{item.word.writtenForm ?? item.word.reading}</strong>
                  <span>{item.word.reading}</span>
                  <small>{item.word.meaningVi}</small>
                </div>
                <div>Lv {item.masteryLevel} · sai {item.incorrectCount} · lapse {item.lapseCount}</div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
