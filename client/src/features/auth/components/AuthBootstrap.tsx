import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';

export function AuthBootstrap() {
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    if (!initialized) void bootstrap();
  }, [bootstrap, initialized]);

  return null;
}
