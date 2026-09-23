import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/auth.store';
import { saveNotebookWord } from '../api/notebook.api';
import type { SavedWordSource } from '../types';

type Props = {
  wordId: string;
  source: SavedWordSource;
};

export function SaveWordButton({ wordId, source }: Props) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => saveNotebookWord(wordId, source),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notebook'],
      });
    },
  });

  if (!user) {
    return (
      <Link className="secondary-button" to="/login">
        Đăng nhập để lưu
      </Link>
    );
  }

  return (
    <button
      className="secondary-button"
      type="button"
      disabled={mutation.isPending || mutation.isSuccess}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending
        ? 'Đang lưu...'
        : mutation.isSuccess
          ? 'Đã lưu'
          : 'Lưu vào sổ tay'}
    </button>
  );
}
