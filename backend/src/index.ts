import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import apiRouter from './routes/api';
import prisma from './utils/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable security headers and CORS
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for local development/testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Arkanya Edutech Pvt. Ltd. ERP & CRM API Server is fully operational.',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$runCommandRaw({ ping: 1 });
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Mount modular API router
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Arkanya API Server running on: http://localhost:${PORT}`);
  console.log(`📂 DB: MongoDB database initialized`);
  console.log(`====================================================`);
});
