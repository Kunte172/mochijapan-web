import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  getNotebookSummary,
  getNotebookWords,
  removeNotebookWord,
  updateNotebookNote,
} from '../api/notebook.api';
import type { NotebookWord } from '../types';

function NotebookWordCard({ item }: { item: NotebookWord }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(item.note ?? '');

  const noteMutation = useMutation({
    mutationFn: () => updateNotebookNote(
      item.wordId,
      note.trim() || null,
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notebook'],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeNotebookWord(item.wordId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notebook'],
      });
    },
  });

  return (
    <article className="notebook-card">
      <div className="notebook-card-heading">
        <div>
          <p className="eyebrow">{item.source}</p>
          <h2>{item.word.writtenForm ?? item.word.reading}</h2>
          {item.word.writtenForm && (
            <p className="reading">{item.word.reading}</p>
          )}
          <p>{item.word.meaningVi}</p>
        </div>

        <div className="mastery-badge">
          Lv {item.learningState?.masteryLevel ?? 0}
        </div>
      </div>

      <div className="notebook-meta">
        <span>
          Ôn: {item.learningState?.reviewCount ?? 0}
        </span>
        <span>
          Đúng: {item.learningState?.correctCount ?? 0}
        </span>
        <span>
          Sai: {item.learningState?.incorrectCount ?? 0}
        </span>
        {item.isDue && <strong>Đến hạn ôn</strong>}
      </div>

      <label className="notebook-note">
        Ghi chú cá nhân
        <textarea
          value={note}
          maxLength={1000}
          placeholder="Ví dụ: dễ nhầm với..."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="dictionary-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={noteMutation.isPending}
          onClick={() => noteMutation.mutate()}
        >
          {noteMutation.isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
        </button>

        <button
          className="danger-button"
          type="button"
          disabled={removeMutation.isPending}
          onClick={() => removeMutation.mutate()}
        >
          Bỏ khỏi sổ tay
        </button>
      </div>
    </article>
  );
}

export function NotebookPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['notebook', 'summary'],
    queryFn: getNotebookSummary,
  });

  const notebookQuery = useQuery({
    queryKey: ['notebook', 'list', query],
    queryFn: () => getNotebookWords({
      query: query || undefined,
      page: 1,
      pageSize: 50,
    }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Personal Vocabulary</p>
        <h1>Sổ tay từ vựng</h1>
      </div>

      {summaryQuery.data && (
        <div className="notebook-summary-grid">
          <div className="summary-card">
            <strong>{summaryQuery.data.total}</strong>
            <span>Từ đã lưu</span>
          </div>
          <div className="summary-card">
            <strong>{summaryQuery.data.dueNow}</strong>
            <span>Đến hạn ôn</span>
          </div>
          <div className="summary-card">
            <strong>{summaryQuery.data.bySource.DICTIONARY ?? 0}</strong>
            <span>Từ từ điển</span>
          </div>
          <div className="summary-card">
            <strong>{summaryQuery.data.bySource.LESSON ?? 0}</strong>
            <span>Từ bài học</span>
          </div>
        </div>
      )}

      <form className="dictionary-search" onSubmit={submit}>
        <input
          type="search"
          value={input}
          placeholder="Tìm trong sổ tay..."
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="secondary-button" type="submit">
          Tìm
        </button>
      </form>

      {notebookQuery.isLoading && <p>Đang tải sổ tay...</p>}

      {notebookQuery.isError && (
        <p className="form-error">Không thể tải sổ tay.</p>
      )}

      {notebookQuery.data?.items.length === 0 && (
        <div className="empty-review-card">
          <h2>Chưa có từ nào trong sổ tay</h2>
          <p>Tra từ hoặc lưu từ trong bài học để bắt đầu.</p>
        </div>
      )}

      <div className="notebook-list">
        {notebookQuery.data?.items.map((item) => (
          <NotebookWordCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
