import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { getGrammarList } from '../api/language-content.api';
import type { JlptLevel } from '../types';

export function GrammarPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [jlpt, setJlpt] = useState<JlptLevel | ''>('N5');

  const grammarQuery = useQuery({
    queryKey: ['grammar', query, jlpt],
    queryFn: () => getGrammarList({
      query: query || undefined,
      jlpt: jlpt || undefined,
      pageSize: 50,
    }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <section className="language-content-page">
      <div className="page-heading">
        <p className="eyebrow">Japanese Grammar</p>
        <h1>Ngữ pháp</h1>
        <p>
          Tra cứu mẫu câu theo JLPT với giải thích và ví dụ song ngữ.
        </p>
      </div>

      <form className="content-filter-bar" onSubmit={submit}>
        <input
          type="search"
          value={input}
          placeholder="です, ～たい, trợ từ..."
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
        <button className="primary-button" type="submit">
          Tìm
        </button>
      </form>

      {grammarQuery.isLoading && <p>Đang tải ngữ pháp...</p>}
      {grammarQuery.isError && (
        <p className="form-error">Không thể tải dữ liệu ngữ pháp.</p>
      )}

      <div className="grammar-list">
        {grammarQuery.data?.items.map((item) => (
          <article className="grammar-card" key={item.id}>
            <div className="grammar-card-heading">
              <div>
                <p className="eyebrow">{item.jlptLevel ?? 'JLPT'}</p>
                <h2>{item.pattern}</h2>
              </div>
              <span>{item.code}</span>
            </div>

            <h3>{item.meaningVi}</h3>
            {item.meaningEn && <p className="muted">{item.meaningEn}</p>}
            {item.formation && (
              <div className="content-formula">{item.formation}</div>
            )}
            {item.explanationVi && <p>{item.explanationVi}</p>}

            {item.examples.map((example) => (
              <div className="example-box" key={example.id}>
                <strong>{example.japanese}</strong>
                {example.vietnamese && <p>{example.vietnamese}</p>}
                {example.english && <small>{example.english}</small>}
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
