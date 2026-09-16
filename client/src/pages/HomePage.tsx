import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section>
      <p className="eyebrow">MochiJapan 2.0</p>
      <h1>Học tiếng Nhật theo tiến độ của bạn</h1>
      <p className="lead">
        Day 7 đã kết nối giao diện Course với dữ liệu thật từ PostgreSQL.
      </p>
      <Link className="primary-button" to="/learn">
        Xem khóa học
      </Link>
    </section>
  );
}
