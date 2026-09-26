import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getKanjiList } from '../api/language-content.api';
import type { JlptLevel } from '../types';

export function KanjiPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [jlpt, setJlpt] = useState<JlptLevel | ''>('N5');

  const kanjiQuery = useQuery({
    queryKey: ['kanji', query, jlpt],
    queryFn: () => getKanjiList({
      query: query || undefined,
      jlpt: jlpt || undefined,
      pageSize: 100,
    }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <section className="language-content-page">
      <div className="page-heading">
        <p className="eyebrow">Kanji Library</p>
        <h1>Kanji</h1>
        <p>
          Xem nghĩa, âm On/Kun và các từ vựng trong MochiJapan có chứa Kanji.
        </p>
      </div>

      <form className="content-filter-bar" onSubmit={submit}>
        <input
          type="search"
          value={input}
          placeholder="日, ニチ, ngày..."
          onChange={(event) => setInput(event.target.value)}
        />
        <select
          value={jlpt}
          onChange={(event) => setJlpt(event.target.value as JlptLevel | '')}
        >
          <option value="">Tất cả JLPT</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
        <button className="primary-button" type="submit">Tìm</button>
      </form>

      {kanjiQuery.isLoading && <p>Đang tải Kanji...</p>}
      {kanjiQuery.isError && (
        <p className="form-error">Không thể tải dữ liệu Kanji.</p>
      )}

      <div className="kanji-grid">
        {kanjiQuery.data?.items.map((item) => (
          <Link
            className="kanji-card"
            to={`/kanji/${encodeURIComponent(item.character)}`}
            key={item.id}
          >
            <strong>{item.character}</strong>
            <span>{item.meaningsVi.join(', ')}</span>
            <small>
              {item.jlptLevel ?? '-'} · {item.strokeCount ?? '?'} nét · {item.wordCount} từ
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
