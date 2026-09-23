import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  startLessonQuiz,
  submitQuizAnswer,
} from '../api/quiz.api';
import type { QuizAttempt } from '../types';

export function LessonQuizPage() {
  const { lessonId } = useParams();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctOptionId: string;
    selectedOptionId: string | null;
    nextAttempt: QuizAttempt;
  } | null>(null);
  const shownAt = useRef(performance.now());
  const started = useRef(false);

  useEffect(() => {
    if (!lessonId || started.current) {
      return;
    }

    started.current = true;

    void startLessonQuiz(lessonId, 10)
      .then((result) => {
        setAttempt(result.attempt);
        shownAt.current = performance.now();
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Không thể bắt đầu bài trắc nghiệm.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lessonId]);

  if (!lessonId) {
    return <p>Lesson ID không hợp lệ.</p>;
  }

  if (loading) {
    return <p>Đang tạo bài trắc nghiệm...</p>;
  }

  if (error && !attempt) {
    return <p className="form-error">{error}</p>;
  }

  if (!attempt) {
    return <p>Không tìm thấy bài trắc nghiệm.</p>;
  }

  if (attempt.status === 'COMPLETED') {
    return (
      <section className="quiz-result-card">
        <p className="eyebrow">Lesson Quiz</p>
        <h1>Hoàn thành trắc nghiệm</h1>
        <div className="quiz-score">
          {attempt.correctAnswers}/{attempt.totalQuestions}
        </div>
        <p>Điểm: {attempt.scorePercent}%</p>
        <Link
          className="primary-button"
          to={`/learn/lessons/${attempt.lesson.id}`}
        >
          Quay lại bài học
        </Link>
      </section>
    );
  }

  const question = attempt.currentQuestion;

  if (!question) {
    return <p>Đang tải câu hỏi tiếp theo...</p>;
  }

  const attemptId = attempt.id;
  const activeQuestion = question;

  async function playAudio(audioUrl: string | null) {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);
    await audio.play().catch(() => undefined);
  }

  async function chooseOption(optionId: string) {
    if (saving || feedback) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await submitQuizAnswer({
        attemptId,
        itemId: activeQuestion.id,
        selectedWordId: optionId,
        responseTimeMs: Math.max(
          0,
          Math.round(performance.now() - shownAt.current),
        ),
        idempotencyKey: crypto.randomUUID(),
      });

      setFeedback({
        isCorrect: result.isCorrect,
        correctOptionId: result.correctOptionId,
        selectedOptionId: result.selectedOptionId,
        nextAttempt: result.attempt,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể lưu câu trả lời.',
      );
    } finally {
      setSaving(false);
    }
  }

  function nextQuestion() {
    if (!feedback) {
      return;
    }

    setAttempt(feedback.nextAttempt);
    setFeedback(null);
    setError('');
    shownAt.current = performance.now();
  }

  const displayPosition = attempt.answeredCount + 1;

  return (
    <section className="quiz-session">
      <div className="session-topbar">
        <Link to={`/learn/lessons/${attempt.lesson.id}`}>
          ← Thoát
        </Link>
        <strong>Lesson Quiz</strong>
        <span>
          {displayPosition}/{attempt.totalQuestions}
        </span>
      </div>

      <div className="session-progress">
        <div
          className="session-progress-bar"
          style={{
            width: `${(displayPosition / attempt.totalQuestions) * 100}%`,
          }}
        />
      </div>

      <article className="quiz-question-card">
        <p className="eyebrow">
          {activeQuestion.type.replaceAll('_', ' ')}
        </p>

        <h1>{activeQuestion.prompt.primary}</h1>

        {activeQuestion.prompt.secondary && (
          <p className="reading">
            {activeQuestion.prompt.secondary}
          </p>
        )}

        {activeQuestion.prompt.audioUrl && (
          <button
            className="audio-button"
            type="button"
            onClick={() => void playAudio(activeQuestion.prompt.audioUrl)}
          >
            Nghe phát âm
          </button>
        )}

        <div className="quiz-options">
          {activeQuestion.options.map((option) => {
            const isSelected =
              feedback?.selectedOptionId === option.id;
            const isCorrect =
              feedback?.correctOptionId === option.id;

            let className = 'quiz-option';

            if (feedback && isCorrect) {
              className += ' quiz-option-correct';
            } else if (feedback && isSelected && !isCorrect) {
              className += ' quiz-option-wrong';
            }

            return (
              <button
                className={className}
                type="button"
                key={option.id}
                disabled={saving || Boolean(feedback)}
                onClick={() => void chooseOption(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="quiz-feedback">
            <strong>
              {feedback.isCorrect ? 'Chính xác' : 'Chưa chính xác'}
            </strong>
            <button
              className="primary-button"
              type="button"
              onClick={nextQuestion}
            >
              {feedback.nextAttempt.status === 'COMPLETED'
                ? 'Xem kết quả'
                : 'Câu tiếp theo'}
            </button>
          </div>
        )}

        {saving && <p>Đang lưu đáp án...</p>}
        {error && <p className="form-error">{error}</p>}
      </article>
    </section>
  );
}
