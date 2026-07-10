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
router.post('/auth/upload-doc', authenticateJWT, authController.uploadDocument);

// EMPLOYEE / USER MANAGEMENT ROUTES
router.get('/users', authenticateJWT, requireRoles(['SUPERADMIN']), authController.getUsers);
router.post('/users/create', authenticateJWT, requireRoles(['SUPERADMIN']), authController.createUser);
router.patch('/users/:id', authenticateJWT, requireRoles(['SUPERADMIN']), authController.updateUser);
router.delete('/users/:id', authenticateJWT, requireRoles(['SUPERADMIN']), authController.deleteUser);
router.post('/users/:id/reset-password', authenticateJWT, requireRoles(['SUPERADMIN']), authController.resetUserPassword);

// ==========================================
// STUDENT CRM ROUTES
// ==========================================
router.get('/crm/leads', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.getLeads);
router.post('/crm/leads/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.createLead);
router.patch('/crm/leads/:id/stage', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.updateLeadStage);
router.patch('/crm/leads/:id', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.updateLead);
router.post('/crm/leads/followup', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.addFollowUp);
router.patch('/crm/leads/followup/:id/complete', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.completeFollowUp);
router.get('/crm/stats', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.getCounsellorStats);
router.post('/crm/student/reset-password', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), crmController.resetStudentPassword);

// ==========================================
// ERP CORE MANAGEMENT (COLLEGES, UNIVERSITIES, COURSES)
// ==========================================
router.get('/erp/universities', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'DIRECTOR_LEGAL', 'COUNSELLOR']), erpController.getUniversities);
router.post('/erp/universities/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.createUniversity);
router.patch('/erp/universities/:id', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.updateUniversity);
router.get('/erp/colleges', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'DIRECTOR_LEGAL', 'COUNSELLOR']), erpController.getColleges);
router.post('/erp/colleges/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.createCollege);
router.patch('/erp/colleges/:id', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.updateCollege);
router.get('/erp/courses', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'DIRECTOR_LEGAL', 'COUNSELLOR']), erpController.getCourses);
router.post('/erp/courses/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.createCourse);
router.patch('/erp/courses/:id', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS']), erpController.updateCourse);
router.get('/erp/collaborations', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_FINANCE', 'DIRECTOR_LEGAL']), erpController.getCollaborations);
router.post('/erp/collaborations/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_LEGAL']), erpController.createCollaboration);
router.post('/erp/book-seat', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_ACADEMICS', 'COUNSELLOR']), erpController.bookSeat);

// ==========================================
// FINANCIALS & ACCOUNTING MODULE
// ==========================================
router.get('/accounting/transactions', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_FINANCE', 'ACCOUNTANT']), acctController.getTransactions);
router.post('/accounting/transactions/create', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_FINANCE', 'ACCOUNTANT']), acctController.createTransaction);
router.get('/accounting/profit-loss', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_FINANCE']), acctController.getProfitAndLoss);
router.get('/accounting/commissions', authenticateJWT, requireRoles(['SUPERADMIN', 'DIRECTOR_FINANCE', 'ACCOUNTANT']), acctController.getCommissions);

// ==========================================
// AI ADVANCED FEATURES ROUTES
// ==========================================
router.post('/ai/recommendations', authenticateJWT, aiController.getCollegeRecommendations);
router.post('/ai/predict-chance', authenticateJWT, aiController.predictAdmissionChance);
router.post('/ai/scholarships', authenticateJWT, aiController.getScholarships);
router.post('/ai/verify-doc', authenticateJWT, aiController.simulateDocumentVerification);
router.post('/ai/chat', authenticateJWT, aiController.chatAssistant);

export default router;
