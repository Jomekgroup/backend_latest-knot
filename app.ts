import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes';
import matchingRoutes from './routes/matching.routes';
// Import your database pool/client (assuming you use 'pg')
import db from './services/db'; 

dotenv.config();

const app = express();

// 2. Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://knot-p5gn.vercel.app',
    'https://knot-registry.vercel.app' // Added your probable production URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- NEW: USER SYNC ROUTE ---
app.post('/api/users/sync', async (req, res) => {
    const { id, email, name, avatar_url } = req.body;

    // This query ensures we don't get duplicate users (UPSERT)
    const upsertQuery = `
        INSERT INTO users (id, email, name, avatar_url, last_login)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            last_login = NOW()
        RETURNING *;
    `;

    try {
        const result = await db.query(upsertQuery, [id, email, name, avatar_url]);
        console.log(`✅ Sync: User ${email} updated in database.`);
        res.status(200).json(result.rows[0]);
    } catch (error: any) {
        console.error('❌ Sync Error:', error.message);
        res.status(500).json({ error: 'Database synchronization failed' });
    }
});

// 3. Existing Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/matching', matchingRoutes);

// ... rest of your code (Health Check & Error Handling)
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