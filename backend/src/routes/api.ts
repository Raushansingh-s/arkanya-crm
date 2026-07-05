import { Router } from 'express';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';
import * as crmController from '../controllers/crm.controller';
import * as erpController from '../controllers/erp.controller';
import * as acctController from '../controllers/accounting.controller';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// ==========================================
// AUTHENTICATION & PORTAL ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.registerStudent);
router.get('/auth/profile', authenticateJWT, authController.getProfile);
router.post('/auth/otp/send', authController.sendOTP);
router.post('/auth/otp/verify', authController.verifyOTP);

// ==========================================
// STUDENT CRM ROUTES
// ==========================================
router.get('/crm/leads', authenticateJWT, crmController.getLeads);
router.post('/crm/leads/create', authenticateJWT, crmController.createLead);
router.patch('/crm/leads/:id/stage', authenticateJWT, crmController.updateLeadStage);
router.patch('/crm/leads/:id', authenticateJWT, crmController.updateLead);
router.post('/crm/leads/followup', authenticateJWT, crmController.addFollowUp);
router.patch('/crm/leads/followup/:id/complete', authenticateJWT, crmController.completeFollowUp);
router.get('/crm/stats', authenticateJWT, crmController.getCounsellorStats);

// ==========================================
// ERP CORE MANAGEMENT (COLLEGES, UNIVERSITIES, COURSES)
// ==========================================
router.get('/erp/universities', authenticateJWT, erpController.getUniversities);
router.post('/erp/universities/create', authenticateJWT, erpController.createUniversity);
router.get('/erp/colleges', authenticateJWT, erpController.getColleges);
router.post('/erp/colleges/create', authenticateJWT, erpController.createCollege);
router.get('/erp/courses', authenticateJWT, erpController.getCourses);
router.post('/erp/courses/create', authenticateJWT, erpController.createCourse);
router.get('/erp/collaborations', authenticateJWT, erpController.getCollaborations);
router.post('/erp/collaborations/create', authenticateJWT, erpController.createCollaboration);
router.post('/erp/book-seat', authenticateJWT, erpController.bookSeat);

// ==========================================
// FINANCIALS & ACCOUNTING MODULE
// ==========================================
router.get('/accounting/transactions', authenticateJWT, acctController.getTransactions);
router.post('/accounting/transactions/create', authenticateJWT, acctController.createTransaction);
router.get('/accounting/profit-loss', authenticateJWT, acctController.getProfitAndLoss);
router.get('/accounting/commissions', authenticateJWT, acctController.getCommissions);

// ==========================================
// AI ADVANCED FEATURES ROUTES
// ==========================================
router.post('/ai/recommendations', authenticateJWT, aiController.getCollegeRecommendations);
router.post('/ai/predict-chance', authenticateJWT, aiController.predictAdmissionChance);
router.post('/ai/scholarships', authenticateJWT, aiController.getScholarships);
router.post('/ai/verify-doc', authenticateJWT, aiController.simulateDocumentVerification);
router.post('/ai/chat', authenticateJWT, aiController.chatAssistant);

export default router;
