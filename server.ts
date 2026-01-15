import 'dotenv/config'; // 👈 This must be line #1
import app from './app';

const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});