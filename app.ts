import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes';
import matchingRoutes from './routes/matching.routes';

// 1. Load environment variables (.env)
dotenv.config();

const app = express();

// 2. Middleware
app.use(cors());
// Cast to 'any' to handle specific TypeScript environment typing quirks
app.use(express.json() as any);

// 3. Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/matching', matchingRoutes);

// 4. Health Check Endpoint
app.get('/', (req, res) => {
  res.send({ status: 'Knot Backend is active and running!' });
});

// 5. Error Handling Middleware
app.use((err: any, req: express.Request, res: any, next: express.NextFunction) => {
  console.error('Server Error:', err.stack);
  res.status(500).send({ error: 'Something went wrong on the server!' });
});

// 6. Start the Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server initialized on port ${PORT}`);
  console.log(`Local link: http://localhost:${PORT}`);
});

export default app;