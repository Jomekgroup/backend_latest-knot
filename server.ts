import 'dotenv/config'; // Loads variables BEFORE app is imported

console.log("Paystack Key Loaded:", process.env.PAYSTACK_SECRET_KEY ? "✅ YES" : "❌ NO");
import app from './app';

const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});