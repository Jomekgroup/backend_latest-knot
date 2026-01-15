import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes';
import matchingRoutes from './routes/matching.routes';

// 1. Load environment variables (.env)
dotenv.config();

const app = express();

// 2. Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',          // Local React
    'http://localhost:5173',          // Local Vite
    'https://knot-p5gn.vercel.app'    // Your specific Vercel Frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

export default app;