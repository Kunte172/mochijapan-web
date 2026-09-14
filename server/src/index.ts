import 'dotenv/config';

import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`MochiJapan API running at http://localhost:${PORT}`);
});