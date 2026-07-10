import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import apiRouter from './routes/api';
import prisma from './utils/db';


const app = express();
const PORT = process.env.PORT || 5000;

// Enable security headers and CORS
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading uploaded images/files in iframe/img tags
}));
app.use(cors({
  origin: '*', // Allow all origins for local development/testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    console.error('Health check database error:', error);
    res.status(500).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

// Mount modular API router
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Arkanya API Server running on: http://localhost:${PORT}`);
  console.log(`📂 DB: MongoDB database initialized`);
  console.log(`====================================================`);
});
