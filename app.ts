import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes';
import matchingRoutes from './routes/matching.routes';
import db from './services/db'; 

// 1. Load environment variables
dotenv.config();

console.log("Paystack Key Loaded:", process.env.PAYSTACK_SECRET_KEY ? "✅ YES" : "❌ NO");

const app = express();

// 2. Professional Middleware & CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://knot-latest.vercel.app',  
    'https://knot-p5gn.vercel.app',    
    'https://knot-registry.vercel.app' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json() as any);

// 3. User Synchronization Route
app.post('/api/users/sync', async (req: express.Request, res: any) => {
    // Note: ensure these field names match exactly what your frontend AuthScreen sends
    const { id, email, name, image } = req.body;

    const upsertQuery = `
        INSERT INTO users (id, email, name, image, last_login)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            last_login = NOW()
        RETURNING *;
    `;

    try {
        const result = await db.query(upsertQuery, [id, email, name, image]);
        console.log(`✅ Sync Success: User ${email} updated in PostgreSQL.`);
        res.status(200).json(result.rows[0]);
    } catch (error: any) {
        console.error('❌ Sync Database Error:', error.message);
        res.status(500).json({ error: 'Failed to synchronize user data' });
    }
});

// 4. Feature Routes
app.use('/api/payments', paymentRoutes);

/**
 * FIX: Changed from '/api/matching' to '/api/matches'
 * This resolves the 404 error your frontend was getting.
 */
app.use('/api/matches', matchingRoutes);

// 5. Health Check
app.get('/', (req, res) => {
  res.send({ status: 'Knot Backend is active and running!' });
});

// 6. Global Error Handling
app.use((err: any, req: express.Request, res: any, next: express.NextFunction) => {
  console.error('Critical Server Error:', err.stack);
  res.status(500).send({ 
      error: 'Something went wrong on the server!',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;