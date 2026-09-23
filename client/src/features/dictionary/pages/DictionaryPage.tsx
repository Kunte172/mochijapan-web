import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SaveWordButton } from '../../notebook/components/SaveWordButton';
import { searchDictionary } from '../api/dictionary.api';

export function DictionaryPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const searchQuery = useQuery({
    queryKey: ['dictionary', query],
    queryFn: () => searchDictionary(query),
    enabled: Boolean(query),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = input.trim();

    if (!normalized) {
      return;
    }

    setQuery(normalized);
  }

  async function playAudio(audioUrl: string | null) {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);
    await audio.play().catch(() => undefined);
  }

  return (
    <section className="dictionary-page">
      <div className="page-heading">
        <p className="eyebrow">Japanese Dictionary</p>
        <h1>Từ điển MochiJapan</h1>
        <p>
          Tìm theo Kanji, Kana, Romaji, nghĩa tiếng Việt hoặc tiếng Anh.
        </p>
      </div>

      <form className="dictionary-search" onSubmit={submit}>
        <input
          type="search"
          value={input}
          placeholder="食べる, たべる, taberu, ăn..."
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary-button" type="submit">
          Tra từ
        </button>
      </form>

      {searchQuery.isFetching && <p>Đang tìm...</p>}

      {searchQuery.isError && (
        <p className="form-error">
          Không thể tra từ: {searchQuery.error.message}
        </p>
      )}

      {searchQuery.data && (
        <div className="dictionary-results">
          <p className="muted">
            {searchQuery.data.count} kết quả cho “{searchQuery.data.query}”
          </p>

          {searchQuery.data.words.map((word) => (
            <article className="dictionary-card" key={word.id}>
              <div className="dictionary-card-main">
                <div>
                  <p className="eyebrow">
                    {word.partOfSpeech ?? 'Vocabulary'}
                  </p>
                  <h2>{word.writtenForm ?? word.reading}</h2>
                  {word.writtenForm && (
                    <p className="reading">{word.reading}</p>
                  )}
                  {word.romaji && <p className="muted">{word.romaji}</p>}
                </div>

                {word.pictureUrl && (
                  <img
                    className="dictionary-image"
                    src={word.pictureUrl}
                    alt={word.writtenForm ?? word.reading}
                  />
                )}
              </div>

              <h3>{word.meaningVi}</h3>
              {word.meaningEn && <p>{word.meaningEn}</p>}

              {word.examples[0] && (
                <div className="example-box">
                  <p>{word.examples[0].japanese}</p>
                  {word.examples[0].vietnamese && (
                    <p>{word.examples[0].vietnamese}</p>
                  )}
                </div>
              )}

              <div className="dictionary-actions">
                {word.audioUrl && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void playAudio(word.audioUrl)}
                  >
                    Nghe phát âm
                  </button>
                )}

                <SaveWordButton
                  wordId={word.id}
                  source="DICTIONARY"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
