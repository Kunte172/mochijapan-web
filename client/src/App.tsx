import { useQuery } from '@tanstack/react-query';

type HealthResponse = {
  status: string;
  service: string;
};

async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('http://localhost:4000/api/health');

  if (!response.ok) {
    throw new Error('Cannot connect to API');
  }

  return response.json();
}

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  return (
    <main>
      <h1>MochiJapan 2.0</h1>

      <p>Japanese Learning Platform</p>

      {isLoading && <p>API: Connecting...</p>}

      {isError && <p>API: Disconnected</p>}

      {data && (
        <p>
          API: Connected — {data.service}
        </p>
      )}
    </main>
  );
}

export default App;