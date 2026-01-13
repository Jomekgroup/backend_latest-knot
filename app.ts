
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/payment.routes';
import matchingRoutes from './routes/matching.routes';

const app = express();

// Middleware
app.use(cors());
// Fixed: Explicitly cast express.json() to any to avoid overload mismatch in environments where RequestHandler types are shadowed or incorrectly resolved.
app.use(express.json() as any);

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/matching', matchingRoutes);

// Error Handling
// Fixed: Use 'any' for the response object to bypass "status" property missing errors on the Express Response type in this execution context.
app.use((err: any, req: express.Request, res: any, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

export default app;
