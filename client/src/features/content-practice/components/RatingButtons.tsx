import type { ReviewRating } from '../types';

export function RatingButtons(props: {
  disabled: boolean;
  onRate: (rating: ReviewRating) => void;
}) {
  return (
    <div className="rating-grid">
      <button
        className="rating-button rating-again"
        type="button"
        disabled={props.disabled}
        onClick={() => props.onRate('AGAIN')}
      >
        Chưa nhớ
      </button>
      <button
        className="rating-button"
        type="button"
        disabled={props.disabled}
        onClick={() => props.onRate('HARD')}
      >
        Khó
      </button>
      <button
        className="rating-button"
        type="button"
        disabled={props.disabled}
        onClick={() => props.onRate('GOOD')}
      >
        Nhớ
      </button>
      <button
        className="rating-button rating-easy"
        type="button"
        disabled={props.disabled}
        onClick={() => props.onRate('EASY')}
      >
        Rất dễ
      </button>
    </div>
  );
}
