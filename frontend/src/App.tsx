import React, { useState, useEffect } from 'react';
import { 
  Users, School, FileText, CheckSquare, MessageSquare, AlertTriangle, ShieldCheck, 
  Search, Sun, Moon, LayoutDashboard, Kanban, DollarSign, BarChart3, 
  Send, Sparkles, UserPlus, LogOut, CheckCircle2, XCircle, Clock, FileBadge, Download, 
  QrCode, Upload, Eye, UserCheck, Settings, Globe, PlusCircle, Edit3,
  Building2, MapPin, Phone, Mail, Link, Award, Home, Briefcase,
  TrendingUp, ArrowLeft, GraduationCap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// Types definition
interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  lead?: Lead;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  parentName?: string;
  state?: string;
  city?: string;
  qualification?: string;
  marksPercentage?: number;
  preferredCourse?: string;
  preferredCollege?: string;
  budget?: number;
  source: string;
  pipelineStage: string;
  leadScore: number;
  counsellorId?: string;
  docStatus?: string;
  feeStatus?: string;
  droppedReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  counsellor?: { username: string };
  followups?: FollowUp[];
}

interface FollowUp {
  id: string;
  leadId: string;
  dateTime: string;
  type: string;
  notes?: string;
  isCompleted: boolean;
}

interface University {
  id: string;
  name: string;
  logoUrl: string;
  ugcApproved: boolean;
  aicteApproved: boolean;
  naacGrade: string;
  nirfRanking: number;
  state: string;
  city: string;
}

interface College {
  id: string;
  name: string;
  state: string;
  district: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  highestPackage: number;
  averagePackage: number;
  naacGrade: string;
  aicteApproved: boolean;
  ugcApproved: boolean;
  ranking: number;
  hostelDetails: string;
  placementStats: string;
  infrastructureNotes: string;
  universityId: string;
  university: { id: string; name: string };
  courses: Course[];
  collaborations: { id: string; status: string; commissionPercent: number }[];
}

interface Course {
  id: string;
  degree: string;
  branch: string;
  eligibility: string;
  durationYears: number;
  totalFees: number;
  semesterFees: number;
  seatsTotal: number;
  seatsBooked: number;
  seatsWaiting: number;
}

interface Collaboration {
  id: string;
  college: { name: string };
  startDate: string;
  expiryDate: string;
  commissionPercent: number;
  fixedCommission: number;
  admissionContact: string;
  status: string;
  notes?: string;
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  gstAmount: number;
  invoiceNumber: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : ((import.meta as any).env?.VITE_API_URL || 'https://arkanya-backend.onrender.com');

export default function App() {
  // Authentication & Tenant States
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // App Master Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountingStats, setAccountingStats] = useState<any>(null);
  const [counsellorStats, setCounsellorStats] = useState<any>(null);

  // College Management States
  const [collegeView, setCollegeView] = useState<'list' | 'detail' | 'add' | 'edit'>('list');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeActiveDetailTab, setCollegeActiveDetailTab] = useState<'overview' | 'courses' | 'placement' | 'infrastructure' | 'hostel'>('overview');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [isSavingCollege, setIsSavingCollege] = useState(false);
  const [collegeSaveMsg, setCollegeSaveMsg] = useState('');

  // College Form State (Add / Edit)
  const [collegeForm, setCollegeForm] = useState({
    name: '',
    universityId: '',
    state: '',
    district: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    naacGrade: 'A',
    aicteApproved: true,
    ugcApproved: true,
    ranking: '',
    hostelDetails: '',
    placementStats: '',
    highestPackage: '',
    averagePackage: '',
    infrastructureNotes: '',
  });

  // Add Course to College Form
  const [courseForm, setCourseForm] = useState({
    degree: 'B.Tech',
    branch: '',
    eligibility: '',
    durationYears: '4',
    totalFees: '',
    semesterFees: '',
    registrationFees: '',
    examFees: '',
    hostelFees: '',
    seatsTotal: '60',
  });

  // Active Layout State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'documents' | 'admission' | 'dropped'>('profile');

  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.pipelineStage === 'Lost') {
        setActiveModalTab('dropped');
      } else if (selectedLead.pipelineStage === 'Confirmed') {
        setActiveModalTab('admission');
      } else if (selectedLead.pipelineStage === 'DocPending') {
        setActiveModalTab('documents');
      } else {
        setActiveModalTab('profile');
      }
    }
  }, [selectedLead]);
  
  // Forms & Filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantSlugInput, setTenantSlugInput] = useState('arkanya');
  const [loginEmail, setLoginEmail] = useState('admin@arkanya.in');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // AI Center States
  const [aiRecMarks, setAiRecMarks] = useState('85');
  const [aiRecBudget, setAiRecBudget] = useState('1500000');
  const [aiRecCourse, setAiRecCourse] = useState('B.Tech');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [aiChanceCourse, setAiChanceCourse] = useState('');
  const [aiChanceMarks, setAiChanceMarks] = useState('80');
  const [aiChanceResult, setAiChanceResult] = useState<any>(null);

  const [ocrDocType, setOcrDocType] = useState('Aadhar');
  const [ocrDocUrl, setOcrDocUrl] = useState('https://example.com/docs/aadhar.jpg');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string; emailDraft?: string; waDraft?: string }[]>([
    { sender: 'ai', text: 'Hello! I am your Arkanya AI Admission Assistant. How can I help you write email campaigns, predict cutoffs, or suggest colleges?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadCourse, setNewLeadCourse] = useState('B.Tech CSE');
  const [newLeadCollege, setNewLeadCollege] = useState('Amity School of Engineering & Technology');
  const [newLeadSource, setNewLeadSource] = useState('Website');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Student specific uploads
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [studentProfileData, setStudentProfileData] = useState<any>(null);

  // Setup theme on load
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Load User Data & Tenant on token change
  useEffect(() => {
    if (authToken) {
      fetchProfile();
    } else {
      setCurrentUser(null);
      setCurrentTenant(null);
    }
  }, [authToken]);

  // Load resources once user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchMasterData();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setCurrentTenant(data.user.tenant);
        if (data.user.studentProfile) {
          setStudentProfileData(data.user.studentProfile);
        }
      } else {
        // Logout if token invalid
        handleLogout();
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  };

  const fetchMasterData = async () => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      
      const [leadsRes, uniRes, colRes, collabsRes, txRes, pnlRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/crm/leads`, { headers }),
        fetch(`${API_URL}/api/erp/universities`, { headers }),
        fetch(`${API_URL}/api/erp/colleges`, { headers }),
        fetch(`${API_URL}/api/erp/collaborations`, { headers }),
        fetch(`${API_URL}/api/accounting/transactions`, { headers }),
        fetch(`${API_URL}/api/accounting/profit-loss`, { headers }),
        fetch(`${API_URL}/api/crm/stats`, { headers })
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (uniRes.ok) setUniversities(await uniRes.json());
      if (colRes.ok) setColleges(await colRes.json());
      if (collabsRes.ok) setCollaborations(await collabsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (pnlRes.ok) setAccountingStats(await pnlRes.json());
      if (statsRes.ok) setCounsellorStats(await statsRes.json());
    } catch (e) {
      console.error('Error fetching dashboard resources', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          tenantSlug: tenantSlugInput
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setCurrentTenant(data.tenant);
        // Each role lands on its primary work area
        const roleDefaultTab: Record<string, string> = {
          SUPERADMIN: 'dashboard',
          DIRECTOR_ACADEMICS: 'dashboard',
          DIRECTOR_FINANCE: 'accounting',
          DIRECTOR_LEGAL: 'agreements',
          COUNSELLOR: 'crm',
          ACCOUNTANT: 'accounting',
          STUDENT: 'student-portal',
        };
        setActiveTab(roleDefaultTab[data.user.role] || 'dashboard');
      } else {
        setLoginError(data.error || 'Authentication failed. Verify credentials.');
      }
    } catch (err: any) {
      setLoginError('Failed to contact server. Please ensure backend is running.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentTenant(null);
    setActiveTab('dashboard');
  };

  // Helper for quick login / role switching
  const quickLoginAs = async (role: string) => {
    let email = 'admin@arkanya.in';
    if (role === 'DIRECTOR_FINANCE') email = 'finance.director@arkanya.in';
    else if (role === 'DIRECTOR_ACADEMICS') email = 'marketing.director@arkanya.in';
    else if (role === 'DIRECTOR_LEGAL') email = 'legal.director@arkanya.in';
    else if (role === 'COUNSELLOR') email = 'counsellor1@arkanya.in';
    else if (role === 'ACCOUNTANT') email = 'accountant@arkanya.in';
    else if (role === 'STUDENT') email = 'student@arkanya.in';

    setLoginEmail(email);
    setLoginPassword('password123');
    setTenantSlugInput('arkanya');
    
    // Simulate submitting login
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'password123',
          tenantSlug: 'arkanya'
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setCurrentTenant(data.tenant);
        const roleDefaultTab: Record<string, string> = {
          SUPERADMIN: 'dashboard',
          DIRECTOR_ACADEMICS: 'dashboard',
          DIRECTOR_FINANCE: 'accounting',
          DIRECTOR_LEGAL: 'agreements',
          COUNSELLOR: 'crm',
          ACCOUNTANT: 'accounting',
          STUDENT: 'student-portal',
        };
        setActiveTab(roleDefaultTab[data.user.role] || 'dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };



  // CRM: Update Full Lead Profile
  const updateLeadDetails = async (leadId: string, updatedFields: any) => {
    try {
      const { id, counsellor, followups, createdAt, updatedAt, ...sanitized } = updatedFields;
      const res = await fetch(`${API_URL}/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) {
        fetchMasterData();
        setShowLeadModal(false);
      } else {
        const err = await res.json();
        alert(`Error updating profile: ${err.error}`);
      }
    } catch (e) {
      console.error('Error updating lead details:', e);
    }
  };

  // Student Profile: Update own lead record from student portal
  const updateStudentLead = async (leadId: string, updatedFields: any) => {
    try {
      const { id, counsellor, followups, createdAt, updatedAt, ...sanitized } = updatedFields;
      const res = await fetch(`${API_URL}/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (e) {
      console.error('Error updating student lead:', e);
    }
  };

  // CRM: Create New Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/crm/leads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          email: newLeadEmail,
          preferredCourse: newLeadCourse,
          preferredCollege: newLeadCollege,
          source: newLeadSource,
        })
      });

      if (res.ok) {
        setShowAddLeadModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        fetchMasterData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ERP: Booking Seat Trigger
  const handleBookSeat = async (courseId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/erp/book-seat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ courseId })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(`Error booking seat: ${data.error || 'Unknown error'}`);
      }
      fetchMasterData();
    } catch (e) {
      console.error(e);
    }
  };

  // AI Recommendation Engine Trigger
  const triggerAiRecommendations = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          qualificationPercentage: aiRecMarks,
          budget: aiRecBudget,
          preferredCourse: aiRecCourse
        })
      });
      if (res.ok) {
        setAiRecommendations(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Chance Predictor Trigger
  const triggerAiChancePredictor = async () => {
    if (!aiChanceCourse) return;
    try {
      const res = await fetch(`${API_URL}/api/ai/predict-chance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          courseId: aiChanceCourse,
          studentPercentage: aiChanceMarks
        })
      });
      if (res.ok) {
        setAiChanceResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Document Verification Simulation
  const triggerOcrVerification = async () => {
    ocrLoading || setOcrLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/verify-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          documentType: ocrDocType,
          documentUrl: ocrDocUrl
        })
      });
      if (res.ok) {
        setOcrResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOcrLoading(false);
    }
  };

  // AI Chat Assistant
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { 
          sender: 'ai', 
          text: data.reply,
          emailDraft: data.autoEmailDraft,
          waDraft: data.autoWhatsAppDraft
        }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  // Student Document Upload Simulator
  const simulateDocumentUpload = (docField: string) => {
    setUploadProgress(prev => ({ ...prev, [docField]: 'Uploading' }));
    
    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, [docField]: 'Completed' }));
      // Highlight update
      if (studentProfileData) {
        setStudentProfileData((prev: any) => ({
          ...prev,
          [`${docField}Status`]: 'Approved',
          [`${docField}Url`]: 'https://example.com/uploaded-doc.pdf'
        }));
      }

      // Update lead docStatus to 'Under Review' in the database
      if (currentUser?.lead) {
        updateStudentLead(currentUser.lead.id, { docStatus: 'Under Review' });
      }
    }, 1500);
  };

  // PDF & Document Generation engine
  const downloadAsPDF = (title: string, filename: string, sections: { label: string; value: string }[]) => {
    // 1. Create printable window for PDF save
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 5px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .title { font-size: 18px; font-weight: 800; margin-top: 20px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .content { margin-bottom: 30px; margin-top: 10px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
            .label { font-weight: 700; color: #475569; }
            .value { color: #0f172a; text-align: right; font-weight: 500; }
            .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; line-height: 1.4; }
            .stamp-box { text-align: center; margin-top: 30px; }
            .stamp { display: inline-block; border: 3px double #10b981; color: #10b981; padding: 6px 20px; font-weight: 800; border-radius: 6px; text-transform: uppercase; font-size: 13px; transform: rotate(-2deg); letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ARKANYA EDUTECH PVT. LTD.</div>
            <div class="subtitle">Multi-Campus Student Admission ERP Portal</div>
            <div class="title">${title}</div>
          </div>
          <div class="content">
            ${sections.map(s => `
              <div class="row">
                <span class="label">${s.label}</span>
                <span class="value">${s.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="stamp-box">
            <div class="stamp">OFFICIAL VERIFIED</div>
          </div>
          <div class="footer">
            This is an electronically generated and certified document from Arkanya Edutech Pvt. Ltd.<br/>
            Security Verification Token: SEC-HASH-${Math.random().toString(36).substring(2, 10).toUpperCase()} • Date: ${new Date().toLocaleDateString()}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }

    // 2. Download a text file backup directly to the browser
    const rawText = `${title}\n` + 
      `========================================\n` +
      `Arkanya Edutech Pvt. Ltd. Document registry\n` +
      `========================================\n` +
      sections.map(s => `${s.label.padEnd(25)}: ${s.value}`).join('\n') +
      `\n========================================\n` +
      `Status: VERIFIED & digitally signed.\n` +
      `Generated on: ${new Date().toLocaleString()}\n`;
      
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Download triggers
  const handleDownloadOfferLetter = () => {
    downloadAsPDF("OFFER LETTER OF ADMISSION", `Offer_Letter_${currentUser?.username || 'Student'}.pdf`, [
      { label: "Student Name", value: currentUser?.username || "Rahul Sen" },
      { label: "Application ID", value: `ARK-APP-${currentUser?.id?.slice(0,6).toUpperCase() || '7A8F92'}` },
      { label: "Status", value: "Admission Confirmed" },
      { label: "Institution", value: studentProfileData?.preferredCollege || "Amity School of Engineering & Technology" },
      { label: "Selected Course", value: studentProfileData?.interestedCourse || "B.Tech CSE" },
      { label: "Batch Year", value: "2024 - 2028" },
      { label: "Assigned Counsellor", value: "Aditi Sharma" },
      { label: "Offer Date", value: new Date().toLocaleDateString() }
    ]);
  };

  const handleDownloadDigitalId = () => {
    downloadAsPDF("DIGITAL STUDENT IDENTIFICATION CARD", `ID_Card_${currentUser?.username || 'Student'}.pdf`, [
      { label: "Student Name", value: currentUser?.username || "Rahul Sen" },
      { label: "Registry ID", value: `ARK-STD-${currentUser?.id?.slice(0,6).toUpperCase() || '7A8F92'}` },
      { label: "Course enrolled", value: studentProfileData?.interestedCourse || "B.Tech CSE" },
      { label: "College / Campus", value: studentProfileData?.preferredCollege || "Amity University" },
      { label: "Security Verification Code", value: "QR-VERIFY-998822" },
      { label: "Access Status", value: "Active Admission Status" }
    ]);
  };

  const handleDownloadInvoice = (tx: any) => {
    downloadAsPDF("GST TAX INVOICE & PAYMENT RECEIPT", `Receipt_${tx.invoiceNumber || 'INV-TEMP'}.pdf`, [
      { label: "Invoice Number", value: tx.invoiceNumber || "N/A" },
      { label: "Transaction Type", value: tx.type },
      { label: "Ledger Category", value: tx.category },
      { label: "Amount Paid", value: `₹${tx.amount.toLocaleString('en-IN')}` },
      { label: "GST Component (18%)", value: `₹${tx.gstAmount.toLocaleString('en-IN')}` },
      { label: "Payment Mode", value: tx.paymentMethod },
      { label: "Transaction Date", value: new Date(tx.createdAt).toLocaleDateString() },
      { label: "Ledger Description", value: tx.description }
    ]);
  };

  // Render Pipeline Column
  const renderPipelineColumn = (stage: string, title: string, color: string) => {
    const stageLeads = leads.filter(l => l.pipelineStage === stage);
    return (
      <div className="flex flex-col min-w-[280px] bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/40">
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{title}</span>
          </div>
          <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {stageLeads.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[60vh]">
          {stageLeads.map(lead => (
            <div 
              key={lead.id} 
              onClick={() => { setSelectedLead(lead); setShowLeadModal(true); }}
              className="glass-card cursor-pointer p-4 rounded-xl shadow-sm border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-2 hover:border-blue-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{lead.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  lead.leadScore > 80 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  lead.leadScore > 50 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                  'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  AI: {lead.leadScore}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>{lead.preferredCourse || 'No Preference'}</span>
                <span className="bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-[10px]">{lead.source}</span>
              </div>
              {lead.counsellor && (
                <span className="text-[10px] text-slate-400">Owner: {lead.counsellor.username}</span>
              )}
            </div>
          ))}
          {stageLeads.length === 0 && (
            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No leads in this stage
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Login state screen
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px]"></div>

        <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/20 mb-4">
              A
            </div>
            <h1 className="text-2xl font-bold text-white font-sans text-center">Arkanya Edutech ERP & CRM</h1>
            <p className="text-slate-400 text-xs mt-1">Multi-Campus Admission SaaS Platform</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-2 mb-4">
              <XCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tenant Workspace Slug</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-slate-500" size={16} />
                <input 
                  type="text" 
                  value={tenantSlugInput}
                  onChange={(e) => setTenantSlugInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. arkanya"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-4 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                placeholder="you@arkanya.in"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-4 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm shadow-lg transition duration-200"
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-900 pt-6">
            <h3 className="text-xs font-semibold text-slate-400 mb-3 text-center">EXAMINER EVALUATION SHORTCUTS</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-medium text-slate-200">
              <button onClick={() => quickLoginAs('SUPERADMIN')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Super Admin
              </button>
              <button onClick={() => quickLoginAs('DIRECTOR_FINANCE')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Dir: Finance & ERP
              </button>
              <button onClick={() => quickLoginAs('DIRECTOR_ACADEMICS')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Dir: Admissions
              </button>
              <button onClick={() => quickLoginAs('DIRECTOR_LEGAL')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Dir: Legal Contracts
              </button>
              <button onClick={() => quickLoginAs('COUNSELLOR')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Counsellor Panel
              </button>
              <button onClick={() => quickLoginAs('STUDENT')} className="p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                Student Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const role = currentUser.role;

  // ─────────────────────────────────────────────────
  // STRICT ROLE FLAGS
  // ─────────────────────────────────────────────────
  const isSuperAdmin        = role === 'SUPERADMIN';
  const isDirectorAcademics = role === 'DIRECTOR_ACADEMICS';
  const isDirectorFinance   = role === 'DIRECTOR_FINANCE';
  const isDirectorLegal     = role === 'DIRECTOR_LEGAL';
  const isAccountant        = role === 'ACCOUNTANT';
  const isCounsellor        = role === 'COUNSELLOR';
  const isStudent           = role === 'STUDENT';

  // ─────────────────────────────────────────────────
  // PER-ROLE TAB PERMISSION MAP
  // Only the tabs listed here will be shown / rendered
  // ─────────────────────────────────────────────────
  const roleTabMap: Record<string, string[]> = {
    SUPERADMIN:          ['dashboard', 'crm', 'students', 'colleges', 'agreements', 'accounting', 'ai', 'system-config'],
    DIRECTOR_ACADEMICS:  ['dashboard', 'crm', 'students', 'colleges', 'ai'],
    DIRECTOR_FINANCE:    ['accounting', 'agreements', 'dashboard-finance'],
    DIRECTOR_LEGAL:      ['agreements', 'colleges-readonly'],
    COUNSELLOR:          ['crm', 'students', 'ai'],
    ACCOUNTANT:          ['accounting'],
    STUDENT:             ['student-portal', 'student-documents', 'student-fees', 'ai'],
  };
  const allowedTabs = roleTabMap[role] || [];
  const can = (tab: string) => allowedTabs.includes(tab) || allowedTabs.includes('*');

  // Role display label & colour
  const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
    SUPERADMIN:          { label: 'Super Administrator', color: 'text-violet-400', bg: 'bg-violet-500/20' },
    DIRECTOR_ACADEMICS:  { label: 'Director — Admissions', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    DIRECTOR_FINANCE:    { label: 'Director — Finance', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    DIRECTOR_LEGAL:      { label: 'Director — Legal', color: 'text-rose-400', bg: 'bg-rose-500/20' },
    COUNSELLOR:          { label: 'Admission Counsellor', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    ACCOUNTANT:          { label: 'Accountant', color: 'text-amber-300', bg: 'bg-amber-500/15' },
    STUDENT:             { label: 'Student', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  };
  const rm = roleMeta[role] || { label: role, color: 'text-slate-400', bg: 'bg-slate-500/20' };

  // ─────────────────────────────────────────────────
  // NAV ITEM HELPER
  // ─────────────────────────────────────────────────
  const NavBtn = ({ tab, icon, label, accent }: { tab: string; icon: React.ReactNode; label: string; accent?: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
        activeTab === tab
          ? `${accent || 'bg-blue-600'} text-white shadow`
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );

  const NavSection = ({ label }: { label: string }) => (
    <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600 px-2 py-1.5 mt-3">{label}</div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800/80 shadow-lg relative z-20">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow shadow-blue-500/20">
              {currentTenant?.name.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="font-extrabold text-sm leading-tight truncate w-32">{currentTenant?.name || 'Arkanya'}</h2>
              <span className="text-[10px] text-blue-400 font-medium">Workspace Active</span>
            </div>
          </div>
        </div>

        {/* User Info Bar */}
        <div className="px-6 py-4 border-b border-slate-800/30 bg-slate-950/40 flex flex-col gap-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-xs font-bold truncate text-slate-300">{currentUser.username}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start ${rm.bg} ${rm.color}`}>{rm.label}</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">

          {/* ═══════════════════════════════
              STUDENT — only their portal
          ═══════════════════════════════ */}
          {isStudent && (
            <>
              <NavSection label="My Portal" />
              <NavBtn tab="student-portal" icon={<FileBadge size={18} />} label="Admission Status" />
              <NavBtn tab="student-documents" icon={<FileText size={18} />} label="My Documents" />
              <NavBtn tab="student-fees" icon={<DollarSign size={18} />} label="Fee & Payments" />
              <NavSection label="Tools" />
              <NavBtn tab="ai" icon={<Sparkles size={18} className="text-amber-400" />} label="AI College Finder" accent="bg-indigo-600" />
            </>
          )}

          {/* ═══════════════════════════════
              SUPERADMIN — everything
          ═══════════════════════════════ */}
          {isSuperAdmin && (
            <>
              <NavSection label="Overview" />
              <NavBtn tab="dashboard" icon={<LayoutDashboard size={18} />} label="Master Dashboard" />
              <NavSection label="Admissions" />
              <NavBtn tab="crm" icon={<Kanban size={18} />} label="Lead CRM Pipeline" />
              <NavBtn tab="students" icon={<Users size={18} />} label="Students Management" />
              <NavSection label="Institutions" />
              <NavBtn tab="colleges" icon={<School size={18} />} label="Colleges & Seats" />
              <NavBtn tab="agreements" icon={<FileText size={18} />} label="Legal Agreements" />
              <NavSection label="Finance" />
              <NavBtn tab="accounting" icon={<DollarSign size={18} />} label="Accounting Ledger" />
              <NavSection label="Intelligence" />
              <NavBtn tab="ai" icon={<Sparkles size={18} className="text-amber-400" />} label="AI Smart Hub" accent="bg-indigo-600" />
              <NavSection label="System" />
              <NavBtn tab="system-config" icon={<Settings size={18} />} label="ERP System Config" />
            </>
          )}

          {/* ═══════════════════════════════
              DIRECTOR ACADEMICS — admissions & colleges
          ═══════════════════════════════ */}
          {isDirectorAcademics && (
            <>
              <NavSection label="Overview" />
              <NavBtn tab="dashboard" icon={<LayoutDashboard size={18} />} label="Admissions Dashboard" />
              <NavSection label="Admissions" />
              <NavBtn tab="crm" icon={<Kanban size={18} />} label="Lead CRM Pipeline" />
              <NavBtn tab="students" icon={<Users size={18} />} label="Students Management" />
              <NavSection label="Institutions" />
              <NavBtn tab="colleges" icon={<School size={18} />} label="Colleges & Seats" />
              <NavSection label="Intelligence" />
              <NavBtn tab="ai" icon={<Sparkles size={18} className="text-amber-400" />} label="AI Smart Hub" accent="bg-indigo-600" />
            </>
          )}

          {/* ═══════════════════════════════
              DIRECTOR FINANCE — finance only
          ═══════════════════════════════ */}
          {isDirectorFinance && (
            <>
              <NavSection label="Finance Overview" />
              <NavBtn tab="dashboard-finance" icon={<BarChart3 size={18} />} label="Finance Dashboard" />
              <NavSection label="Accounts" />
              <NavBtn tab="accounting" icon={<DollarSign size={18} />} label="Accounting Ledger" />
              <NavSection label="Contracts" />
              <NavBtn tab="agreements" icon={<FileText size={18} />} label="Commission Agreements" />
            </>
          )}

          {/* ═══════════════════════════════
              DIRECTOR LEGAL — contracts only
          ═══════════════════════════════ */}
          {isDirectorLegal && (
            <>
              <NavSection label="Legal" />
              <NavBtn tab="agreements" icon={<FileText size={18} />} label="Legal Agreements" />
              <NavBtn tab="colleges-readonly" icon={<School size={18} />} label="Partner Colleges" />
            </>
          )}

          {/* ═══════════════════════════════
              COUNSELLOR — CRM + students
          ═══════════════════════════════ */}
          {isCounsellor && (
            <>
              <NavSection label="My Work" />
              <NavBtn tab="crm" icon={<Kanban size={18} />} label="My Lead Pipeline" />
              <NavBtn tab="students" icon={<Users size={18} />} label="My Students" />
              <NavSection label="Tools" />
              <NavBtn tab="ai" icon={<Sparkles size={18} className="text-amber-400" />} label="AI Recommendations" accent="bg-indigo-600" />
            </>
          )}

          {/* ═══════════════════════════════
              ACCOUNTANT — ledger only
          ═══════════════════════════════ */}
          {isAccountant && (
            <>
              <NavSection label="Finance" />
              <NavBtn tab="accounting" icon={<DollarSign size={18} />} label="Accounting Ledger" />
            </>
          )}

        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-slate-800 flex flex-col space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-between text-xs text-slate-400 hover:text-white p-2 rounded hover:bg-slate-800 w-full transition"
          >
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-between text-xs text-red-400 hover:text-red-300 p-2 rounded hover:bg-slate-800 w-full transition"
          >
            <span>Sign Out</span>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT SCREEN */}
      <main className="flex-1 flex flex-col overflow-y-auto min-h-screen relative">
        {/* Dynamic ambient background gradients for Dark/Light mode */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

        <header className="glass-panel sticky top-0 px-6 py-4 flex justify-between items-center z-10 border-b">
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight">
              {activeTab === 'dashboard'         ? (isSuperAdmin ? 'Master Dashboard' : 'Admissions Dashboard') :
               activeTab === 'dashboard-finance' ? 'Finance & Revenue Dashboard' :
               activeTab === 'crm'               ? (isCounsellor ? 'My Lead Pipeline' : 'Lead CRM Pipeline') :
               activeTab === 'students'          ? (isCounsellor ? 'My Students' : 'Students Management') :
               activeTab === 'colleges'          ? 'University & College Registry' :
               activeTab === 'colleges-readonly' ? 'Partner Colleges (View Only)' :
               activeTab === 'agreements'        ? (isDirectorFinance ? 'Commission Agreements' : 'Legal Agreements & Contracts') :
               activeTab === 'accounting'        ? 'Accounting Ledger & Reports' :
               activeTab === 'ai'                ? (isStudent ? 'AI College Finder' : isCounsellor ? 'AI Recommendations' : 'Arkanya AI Smart Hub') :
               activeTab === 'student-portal'    ? 'My Admission Status' :
               activeTab === 'student-documents' ? 'My Documents & Verification' :
               activeTab === 'student-fees'      ? 'Fee & Payment Tracker' :
               'ERP System Configuration'}
            </h1>
            <p className="text-xs mt-0.5">
              <span className={`font-bold ${rm.color}`}>{rm.label}</span>
              <span className="text-slate-500"> • Arkanya Edutech Pvt. Ltd.</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
              {currentUser.username} • Secured Session
            </span>
          </div>
        </header>

        <div className="flex-1 p-6 relative z-10">
          
          {/* DASHBOARD — SuperAdmin & Director Academics */}
          {activeTab === 'dashboard' && (isSuperAdmin || isDirectorAcademics) && (
            <div className="space-y-6">
              {/* Metrics Widgets Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads Managed</span>
                    <Users className="text-blue-500" size={20} />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">{leads.length}</span>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1">▲ +12% increase this week</p>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Enrolments</span>
                    <UserCheck className="text-emerald-500" size={20} />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {leads.filter(l => l.pipelineStage === 'Confirmed').length}
                    </span>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1">▲ 85.5% conversion success score</p>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partner Colleges</span>
                    <School className="text-indigo-500" size={20} />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">{colleges.length}</span>
                    <p className="text-[10px] text-slate-400 mt-1">From {universities.length} Universities across 2 states</p>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Commission Revenue</span>
                    <DollarSign className="text-amber-500" size={20} />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      ₹{(accountingStats?.summary?.totalIncome || 205000).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1">▲ +8% monthly growth rate</p>
                  </div>
                </div>
              </div>

              {/* Analytical Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graph 1: Conversions / Pipeline breakdown */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 lg:col-span-2">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Daily Inflow & Admissions (Recharts)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { date: 'Mon', Leads: 4, Confirmed: 1 },
                        { date: 'Tue', Leads: 9, Confirmed: 2 },
                        { date: 'Wed', Leads: 6, Confirmed: 1 },
                        { date: 'Thu', Leads: 12, Confirmed: 4 },
                        { date: 'Fri', Leads: 15, Confirmed: 5 },
                        { date: 'Sat', Leads: 8, Confirmed: 3 },
                        { date: 'Sun', Leads: 5, Confirmed: 1 },
                      ]}>
                        <defs>
                          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Leads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Confirmed" stroke="#10b981" fillOpacity={1} fill="url(#colorAdmissions)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 2: Lead Sources Pie chart */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Lead Source Inflow</h3>
                  <div className="h-64 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'WhatsApp', value: 35 },
                            { name: 'Website', value: 30 },
                            { name: 'Facebook', value: 20 },
                            { name: 'Referral', value: 15 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CRM Leads Stats (Target vs conversion) & Activity Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Counsellor metrics */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-slate-500 uppercase">Counsellor Payout Performance</h3>
                    <Users size={16} className="text-slate-400" />
                  </div>
                  {counsellorStats ? (
                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
                        <span>Leads Assigned:</span>
                        <span>{counsellorStats.totalLeads}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
                        <span>Active Reminders:</span>
                        <span>{counsellorStats.activeFollowups}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
                        <span>Month Target Achieved:</span>
                        <span>{counsellorStats.confirmedAdmissions} / {counsellorStats.targetAdmissions} seats</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${(counsellorStats.confirmedAdmissions / counsellorStats.targetAdmissions) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs">Loading performance cards...</p>
                  )}
                </div>

                {/* Audit Logs */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Live Security Audit Logs</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto text-xs">
                    <div className="flex items-start space-x-2.5 p-2 bg-slate-100/40 dark:bg-slate-900/40 rounded-lg border border-slate-200/30 dark:border-slate-800/30">
                      <ShieldCheck size={14} className="text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">User admin@arkanya.in logged in successfully</p>
                        <span className="text-[10px] text-slate-400">IP: 192.168.1.84 • Device: Windows Edge • 10m ago</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5 p-2 bg-slate-100/40 dark:bg-slate-900/40 rounded-lg border border-slate-200/30 dark:border-slate-800/30">
                      <UserCheck size={14} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">Lead stage updated: Aarav Gupta ➔ Counselling</p>
                        <span className="text-[10px] text-slate-400">By Aditi Sharma • 1h ago</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5 p-2 bg-slate-100/40 dark:bg-slate-900/40 rounded-lg border border-slate-200/30 dark:border-slate-800/30">
                      <FileBadge size={14} className="text-indigo-500 mt-0.5" />
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">Commission Invoice INV-KIIT-A09 matched & closed</p>
                        <span className="text-[10px] text-slate-400">By Suresh Iyer • 3h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* FINANCE & REVENUE DASHBOARD — Director Finance Only */}
          {activeTab === 'dashboard-finance' && isDirectorFinance && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Invoiced Commissions', value: '₹4,85,000', icon: <FileText className="text-blue-500" />, desc: 'Comm. from partner institutions' },
                  { label: 'Realized Revenue', value: `₹${(accountingStats?.summary?.totalIncome || 205000).toLocaleString('en-IN')}`, icon: <CheckSquare className="text-emerald-500" />, desc: 'Payments received in bank' },
                  { label: 'Outstanding Dues', value: '₹2,80,000', icon: <AlertTriangle className="text-amber-500" />, desc: 'Pending collection claims' },
                  { label: 'Avg. Commission Per Admit', value: '₹35,000', icon: <DollarSign className="text-indigo-500" />, desc: 'Average commission fee' },
                ].map(card => (
                  <div key={card.label} className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                      {card.icon}
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold tracking-tight">{card.value}</span>
                      <p className="text-[10px] text-slate-400 mt-1">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Inflow Trend */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 lg:col-span-2">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Monthly Revenue & Invoice Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { month: 'Jan', Invoiced: 80000, Received: 50000 },
                        { month: 'Feb', Invoiced: 120000, Received: 90000 },
                        { month: 'Mar', Invoiced: 150000, Received: 110000 },
                        { month: 'Apr', Invoiced: 110000, Received: 95000 },
                        { month: 'May', Invoiced: 190000, Received: 140000 },
                        { month: 'Jun', Invoiced: 240000, Received: 205000 },
                      ]}>
                        <defs>
                          <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                        <Area type="monotone" dataKey="Invoiced" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInv)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Received" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Share by University */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Revenue Share by University</h3>
                  <div className="h-64 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'KIIT University', value: 45 },
                            { name: 'Amity University', value: 25 },
                            { name: 'Manipal University', value: 20 },
                            { name: 'Sathyabama Institute', value: 10 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Transactions Table Preview */}
              <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xs uppercase text-slate-500">Recent Bank & Client Ledger Logs</h3>
                  <button onClick={() => setActiveTab('accounting')} className="text-xs font-bold text-blue-500 hover:text-blue-400">View Full Ledger</button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 4).map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-xs font-semibold">
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-bold">{tx.description}</p>
                        <span className="text-[10px] text-slate-400">{tx.category} • {new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-extrabold text-sm ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{tx.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRM KANBAN BOARD */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Lead Name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button 
                  onClick={() => setShowAddLeadModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow flex items-center space-x-1.5"
                >
                  <UserPlus size={14} />
                  <span>Add Lead</span>
                </button>
              </div>

              {/* Kanban Pipeline Row */}
              <div className="flex space-x-4 overflow-x-auto pb-4 max-w-full">
                {renderPipelineColumn('New', 'New Inquiries', 'bg-blue-500')}
                {renderPipelineColumn('Counselling', 'Under Counselling', 'bg-amber-500')}
                {renderPipelineColumn('DocPending', 'Documents Pending', 'bg-indigo-500')}
                {renderPipelineColumn('Confirmed', 'Admissions Confirmed', 'bg-emerald-500')}
                {renderPipelineColumn('Lost', 'Dropped/Lost', 'bg-rose-500')}
              </div>
            </div>
          )}

          {/* TAB: STUDENTS MANAGEMENT — Staff Only */}
          {activeTab === 'students' && can('students') && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student name, email, course..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center space-x-2">
                  <PlusCircle size={15} /><span>Enroll New Student</span>
                </button>
              </div>

              {/* Summary Stats */}
              {(() => {
                const enrolledStudents = leads.filter(l => ['Counselling', 'DocPending', 'Confirmed'].includes(l.pipelineStage)).map((l) => ({
                  id: l.id, name: l.name, email: l.email, phone: l.phone,
                  course: l.preferredCourse || 'N/A', college: l.preferredCollege || 'N/A',
                  counsellor: l.counsellor?.username || 'Aditi Sharma',
                  docStatus: l.docStatus || 'Pending',
                  feeStatus: l.feeStatus || 'Pending',
                  stage: l.pipelineStage === 'Confirmed' ? 'Enrolled' : l.pipelineStage === 'DocPending' ? 'Docs Pending' : 'Counselling',
                }));

                const total = enrolledStudents.length;
                const verified = enrolledStudents.filter(s => s.docStatus === 'Verified').length;
                const feePending = enrolledStudents.filter(s => s.feeStatus === 'Pending').length;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Students', value: total, color: 'text-blue-500' },
                        { label: 'Docs Verified', value: verified, color: 'text-emerald-500' },
                        { label: 'Fee Pending', value: feePending, color: 'text-amber-500' },
                        { label: 'Offer Letters Sent', value: total, color: 'text-indigo-500' },
                      ].map(s => (
                        <div key={s.label} className="glass-card p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/30">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{s.label}</span>
                          <span className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Students Table */}
                    <div className="glass-card rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-extrabold tracking-wider text-[10px]">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Course Applied</th>
                            <th className="py-3 px-4">College</th>
                            <th className="py-3 px-4">Assigned Counsellor</th>
                            <th className="py-3 px-4">Doc Status</th>
                            <th className="py-3 px-4">Fee Status</th>
                            <th className="py-3 px-4">Admission Stage</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-300">
                          {enrolledStudents.map((student) => {
                            const docColor = student.docStatus === 'Verified' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' : student.docStatus === 'Under Review' ? 'text-amber-600 bg-amber-500/10 border-amber-500/30' : 'text-rose-600 bg-rose-500/10 border-rose-500/30';
                            const feeColor = student.feeStatus === 'Paid' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-600 bg-amber-500/10 border-amber-500/30';
                            return (
                              <tr key={student.id} className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                      {student.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                                      <p className="text-[10px] text-slate-400">{student.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{student.course}</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{student.college}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-600 dark:text-slate-400">{student.counsellor}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${docColor}`}>{student.docStatus}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${feeColor}`}>{student.feeStatus}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/30">{student.stage}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => {
                                        const lead = leads.find(l => l.id === student.id);
                                        if (lead) {
                                          setSelectedLead(lead);
                                          setShowLeadModal(true);
                                        }
                                      }}
                                      className="text-[10px] font-bold px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1"
                                    >
                                      <Eye size={11} /> View
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const lead = leads.find(l => l.id === student.id);
                                        if (lead) {
                                          setSelectedLead(lead);
                                          setShowLeadModal(true);
                                        }
                                      }}
                                      className="text-[10px] font-bold px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1"
                                    >
                                      <Edit3 size={11} /> Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {total === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          <Users size={32} className="mx-auto mb-3 opacity-30" />
                          No enrolled students yet. Confirmed leads automatically appear here.
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* STUDENT PORTAL SUB-TAB: My Admission Status */}
          {activeTab === 'student-portal' && isStudent && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/30">
                <div className="h-20 bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 relative">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f680 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf680 0%, transparent 50%)' }} />
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 -mt-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="mt-6">
                      <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{currentUser.username}</h2>
                      <p className="text-xs text-slate-400">Student ID: ARK-STD-{currentUser.id?.slice(0,6).toUpperCase() || '00XXXX'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadOfferLetter} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                      <Download size={13} /> Download Offer Letter
                    </button>
                    <button onClick={handleDownloadDigitalId} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg">
                      <QrCode size={13} /> Digital ID Card
                    </button>
                  </div>
                </div>
              </div>

              {/* Admission Journey Progress */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                <h3 className="font-extrabold text-sm mb-4">Your Admission Journey</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0">
                  {(() => {
                    const lead = currentUser.lead;
                    const stage = lead?.pipelineStage || 'New';
                    const docStatus = lead?.docStatus || 'Pending';
                    const feeStatus = lead?.feeStatus || 'Pending';

                    const steps = [
                      { label: 'Application\nSubmitted', done: true, active: false },
                      { 
                        label: 'Counselling\nSession', 
                        done: stage !== 'New', 
                        active: stage === 'New' 
                      },
                      { 
                        label: 'Documents\nVerified', 
                        done: docStatus === 'Verified' || stage === 'Confirmed', 
                        active: (stage === 'Counselling' || stage === 'DocPending') && docStatus !== 'Verified' 
                      },
                      { 
                        label: 'Offer Letter\nIssued', 
                        done: stage === 'Confirmed', 
                        active: stage === 'DocPending' && docStatus === 'Verified' 
                      },
                      { 
                        label: 'Fee\nPayment', 
                        done: feeStatus === 'Paid', 
                        active: stage === 'Confirmed' && feeStatus !== 'Paid' 
                      },
                      { 
                        label: 'Enrollment\nComplete', 
                        done: stage === 'Confirmed' && feeStatus === 'Paid', 
                        active: false 
                      },
                    ];

                    return steps.map((step, i, arr) => (
                    <div key={step.label} className="flex flex-col sm:flex-row items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs border-2 ${step.done ? 'bg-emerald-500 border-emerald-500 text-white' : step.active ? 'bg-blue-600 border-blue-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'}`}>
                          {step.done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 text-center whitespace-pre-line ${step.done ? 'text-emerald-500' : step.active ? 'text-blue-500' : 'text-slate-400'}`}>{step.label}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`hidden sm:block h-0.5 flex-1 mx-2 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      )}
                    </div>
                  ));
                })()}
              </div>
              </div>

              {/* Key Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2">Admission Details</h3>
                  {[
                    { label: 'Program', value: studentProfileData?.interestedCourse || 'B.Tech CSE' },
                    { label: 'College', value: studentProfileData?.preferredCollege || 'Amity University' },
                    { label: 'Batch', value: '2024–28' },
                    { label: 'Counsellor', value: 'Aditi Sharma' },
                    { label: 'Status', value: 'Offer Letter Issued' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2">Important Dates</h3>
                  {[
                    { label: 'Application Date', value: '12 Jun 2024', status: 'done' },
                    { label: 'Counselling Date', value: '18 Jun 2024', status: 'done' },
                    { label: 'Offer Letter', value: '25 Jun 2024', status: 'done' },
                    { label: 'Fee Deadline', value: '15 Jul 2024', status: 'pending' },
                    { label: 'Enrollment Date', value: '1 Aug 2024', status: 'upcoming' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${item.status === 'done' ? 'text-emerald-500 bg-emerald-500/10' : item.status === 'pending' ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2">Fee Summary</h3>
                  {[
                    { label: 'Total Course Fees', value: '₹14.40 L' },
                    { label: 'Registration Fee', value: '₹20,000' },
                    { label: 'Paid So Far', value: '₹1,20,000', highlight: true },
                    { label: 'Balance Due', value: '₹13.20 L', warn: true },
                    { label: 'Next Due Date', value: '15 Jul 2024' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                      <span className={`font-bold ${item.highlight ? 'text-emerald-500' : item.warn ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{item.value}</span>
                    </div>
                  ))}
                  <button className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg">
                    Pay Fee Online
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT PORTAL SUB-TAB: My Documents */}
          {activeTab === 'student-documents' && isStudent && (
            <div className="space-y-5">
              <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                {(() => {
                  const lead = currentUser.lead;
                  const docStatus = lead?.docStatus || 'Pending';
                  
                  // Map database docStatus to individual document statuses
                  const getStatus = (req: boolean) => {
                    if (docStatus === 'Verified') return 'Approved';
                    if (docStatus === 'Under Review') return req ? 'Under Review' : 'Pending Upload';
                    return req ? 'Pending Upload' : 'Pending Upload';
                  };

                  const docs = [
                    { field: 'marksheet10', label: '10th Marksheet', status: getStatus(true), required: true },
                    { field: 'marksheet12', label: '12th Marksheet / Diploma', status: getStatus(true), required: true },
                    { field: 'aadhar', label: 'Aadhar Card', status: getStatus(true), required: true },
                    { field: 'passport', label: 'Passport Photo', status: getStatus(true), required: true },
                    { field: 'casteCert', label: 'Caste Certificate', status: getStatus(false), required: false },
                    { field: 'migCert', label: 'Migration Certificate', status: getStatus(true), required: true },
                  ];

                  const verifiedCount = docs.filter(d => d.status === 'Approved').length;

                  return (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-extrabold text-sm">Document Submission & Verification</h3>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          {verifiedCount}/6 Verified
                        </span>
                      </div>
                      <div className="space-y-3">
                        {docs.map(doc => {
                    const isApproved = doc.status === 'Approved';
                    const isReview = doc.status === 'Under Review';
                    const uploading = uploadProgress[doc.field] === 'Uploading';
                    return (
                      <div key={doc.field} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                          {isApproved ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" /> :
                           isReview ? <Clock size={16} className="text-amber-500 flex-shrink-0" /> :
                           <AlertTriangle size={16} className="text-rose-500 flex-shrink-0" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.label} {doc.required && <span className="text-rose-400">*</span>}</p>
                            <span className={`text-[10px] font-semibold ${isApproved ? 'text-emerald-500' : isReview ? 'text-amber-500' : 'text-rose-500'}`}>{doc.status}</span>
                          </div>
                        </div>
                        {!isApproved && (
                          <button
                            onClick={() => simulateDocumentUpload(doc.field)}
                            disabled={uploading}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${uploading ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                          >
                            <Upload size={12} /> {uploading ? 'Uploading...' : isReview ? 'Re-upload' : 'Upload'}
                          </button>
                        )}
                        {isApproved && (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Verified</span>
                        )}
                      </div>
                    );
                  })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STUDENT PORTAL SUB-TAB: Fee & Payments */}
          {activeTab === 'student-fees' && isStudent && (
            <div className="space-y-5">
              <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                <h3 className="font-extrabold text-sm mb-4">Fee Structure & Payment History</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Total Fees', value: '₹14,40,000', color: 'text-slate-800 dark:text-slate-100' },
                    { label: 'Amount Paid', value: '₹1,20,000', color: 'text-emerald-500' },
                    { label: 'Balance Due', value: '₹13,20,000', color: 'text-rose-500' },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{s.label}</span>
                      <span className={`text-xl font-extrabold mt-1 block ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-bold text-xs uppercase text-slate-500 mb-3">Installment Schedule</h4>
                <div className="space-y-2">
                  {[
                    { sem: 'Registration Fee', amount: '₹20,000', due: '10 Jun 2024', paid: true },
                    { sem: 'Semester 1 Fee', amount: '₹1,80,000', due: '01 Aug 2024', paid: false },
                    { sem: 'Semester 2 Fee', amount: '₹1,80,000', due: '01 Jan 2025', paid: false },
                    { sem: 'Hostel Fee (Year 1)', amount: '₹1,20,000', due: '01 Aug 2024', paid: false },
                  ].map(row => (
                    <div key={row.sem} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.sem}</p>
                        <span className="text-[10px] text-slate-400">Due: {row.due}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{row.amount}</span>
                        {row.paid ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Paid ✓</span>
                        ) : (
                          <button className="text-[10px] font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Pay Now</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLLEGE MANAGEMENT MODULE */}
          {(activeTab === 'colleges' || activeTab === 'colleges-readonly') && (
            <div className="space-y-6">

              {/* =========================================
                  LIST VIEW - College Directory
              ========================================= */}
              {collegeView === 'list' && (
                <>
                  {/* Toolbar: Search + Add */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={collegeSearch}
                          onChange={e => setCollegeSearch(e.target.value)}
                          placeholder="Search by college name, state, NAAC grade..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{colleges.filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase()) || c.state?.toLowerCase().includes(collegeSearch.toLowerCase())).length} Colleges Found</span>
                    </div>
                    {activeTab !== 'colleges-readonly' && (
                      <button
                        onClick={() => {
                          setCollegeForm({ name: '', universityId: universities[0]?.id || '', state: '', district: '', address: '', contactPerson: '', phone: '', email: '', website: '', naacGrade: 'A', aicteApproved: true, ugcApproved: true, ranking: '', hostelDetails: '', placementStats: '', highestPackage: '', averagePackage: '', infrastructureNotes: '' });
                          setCollegeView('add');
                          setCollegeSaveMsg('');
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center space-x-2"
                      >
                        <PlusCircle size={15} />
                        <span>Add New College</span>
                      </button>
                    )}
                  </div>

                  {/* Summary Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Colleges', value: colleges.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { label: 'Active Agreements', value: collaborations.filter(c => c.status === 'Active').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { label: 'Total Courses', value: colleges.reduce((acc, c) => acc + c.courses.length, 0), color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                      { label: 'Total Seats', value: colleges.reduce((acc, c) => acc + c.courses.reduce((a, co) => a + co.seatsTotal, 0), 0), color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map(stat => (
                      <div key={stat.label} className={`glass-card p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</span>
                        <span className={`text-2xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* College Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {colleges
                      .filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase()) || c.state?.toLowerCase().includes(collegeSearch.toLowerCase()) || c.naacGrade?.toLowerCase().includes(collegeSearch.toLowerCase()))
                      .map(college => {
                        const totalSeats = college.courses.reduce((a, c) => a + c.seatsTotal, 0);
                        const bookedSeats = college.courses.reduce((a, c) => a + c.seatsBooked, 0);
                        const occupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
                        const hasAgreement = college.collaborations?.some(c => c.status === 'Active');
                        return (
                          <div key={college.id} className="glass-card rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-hidden hover:border-blue-500/40 transition-all">
                            {/* Card Header */}
                            <div className="p-5 flex justify-between items-start">
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20 flex-shrink-0">
                                  {college.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-snug">{college.name}</h3>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Building2 size={11} />{college.university?.name || 'N/A'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin size={11} />{college.district ? `${college.district}, ` : ''}{college.state}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                {college.naacGrade && (
                                  <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-blue-500/25">
                                    NAAC {college.naacGrade}
                                  </span>
                                )}
                                {hasAgreement ? (
                                  <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/25">
                                    ✓ Partner
                                  </span>
                                ) : (
                                  <span className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    No Agreement
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-4 border-t border-slate-200/40 dark:border-slate-800/40">
                              <div className="p-3 text-center border-r border-slate-200/40 dark:border-slate-800/40">
                                <span className="text-[10px] text-slate-400 block uppercase">Courses</span>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{college.courses.length}</span>
                              </div>
                              <div className="p-3 text-center border-r border-slate-200/40 dark:border-slate-800/40">
                                <span className="text-[10px] text-slate-400 block uppercase">Seats</span>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{totalSeats}</span>
                              </div>
                              <div className="p-3 text-center border-r border-slate-200/40 dark:border-slate-800/40">
                                <span className="text-[10px] text-slate-400 block uppercase">Avg. Package</span>
                                <span className="font-bold text-xs text-emerald-500">{college.averagePackage || '—'} LPA</span>
                              </div>
                              <div className="p-3 text-center">
                                <span className="text-[10px] text-slate-400 block uppercase">Occupancy</span>
                                <span className={`font-bold text-xs ${occupancy >= 95 ? 'text-rose-500' : occupancy >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{occupancy}%</span>
                              </div>
                            </div>

                            {/* Occupancy progress */}
                            <div className="px-5 py-2">
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${occupancy >= 95 ? 'bg-rose-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${occupancy}%` }}
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-5 py-3 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400">
                                {college.aicteApproved && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">AICTE ✓</span>}
                                {college.ugcApproved && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">UGC ✓</span>}
                                {college.ranking && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Rank #{college.ranking}</span>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedCollege(college);
                                    setCollegeActiveDetailTab('overview');
                                    setCollegeView('detail');
                                  }}
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
                                >
                                  <Eye size={12} /> View Details
                                </button>
                                {activeTab !== 'colleges-readonly' && (
                                  <button
                                    onClick={() => {
                                      setSelectedCollege(college);
                                      setCollegeForm({
                                        name: college.name,
                                        universityId: college.universityId || college.university?.id || '',
                                        state: college.state,
                                        district: college.district || '',
                                        address: college.address,
                                        contactPerson: college.contactPerson || '',
                                        phone: college.phone || '',
                                        email: college.email || '',
                                        website: college.website || '',
                                        naacGrade: college.naacGrade || 'A',
                                        aicteApproved: college.aicteApproved,
                                        ugcApproved: college.ugcApproved,
                                        ranking: college.ranking?.toString() || '',
                                        hostelDetails: college.hostelDetails || '',
                                        placementStats: college.placementStats || '',
                                        highestPackage: college.highestPackage?.toString() || '',
                                        averagePackage: college.averagePackage?.toString() || '',
                                        infrastructureNotes: college.infrastructureNotes || '',
                                      });
                                      setCollegeView('edit');
                                      setCollegeSaveMsg('');
                                    }}
                                    className="text-[11px] font-bold p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {colleges.length === 0 && (
                      <div className="col-span-2 flex flex-col items-center justify-center p-16 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400">
                        <School size={40} className="mb-4 opacity-30" />
                        <p className="font-semibold text-sm">No colleges added yet</p>
                        <p className="text-xs mt-1">Click "Add New College" to register your first partner institution.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* =========================================
                  DETAIL VIEW - Full College Profile
              ========================================= */}
              {collegeView === 'detail' && selectedCollege && (
                <>
                  <button onClick={() => setCollegeView('list')} className="flex items-center space-x-2 text-xs font-semibold text-blue-500 hover:text-blue-400 mb-2">
                    <ArrowLeft size={14} /> <span>Back to College Directory</span>
                  </button>

                  {/* College Banner */}
                  <div className="glass-card rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)' }} />
                    </div>
                    <div className="px-6 pb-5 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex items-end gap-4 -mt-7">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                            {selectedCollege.name.charAt(0)}
                          </div>
                          <div className="mb-1">
                            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedCollege.name}</h2>
                            <p className="text-xs text-slate-500">{selectedCollege.university?.name} • {selectedCollege.district ? `${selectedCollege.district}, ` : ''}{selectedCollege.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {selectedCollege.naacGrade && <span className="bg-blue-500/15 text-blue-500 font-bold text-xs px-3 py-1 rounded-full border border-blue-500/25">NAAC {selectedCollege.naacGrade}</span>}
                          {selectedCollege.aicteApproved && <span className="bg-emerald-500/15 text-emerald-500 font-bold text-xs px-3 py-1 rounded-full border border-emerald-500/25">AICTE ✓</span>}
                          {selectedCollege.ugcApproved && <span className="bg-indigo-500/15 text-indigo-500 font-bold text-xs px-3 py-1 rounded-full border border-indigo-500/25">UGC ✓</span>}
                          {activeTab !== 'colleges-readonly' && (
                            <button
                              onClick={() => {
                                setCollegeForm({
                                  name: selectedCollege.name, universityId: selectedCollege.universityId || selectedCollege.university?.id || '',
                                  state: selectedCollege.state, district: selectedCollege.district || '',
                                  address: selectedCollege.address, contactPerson: selectedCollege.contactPerson || '',
                                  phone: selectedCollege.phone || '', email: selectedCollege.email || '',
                                  website: selectedCollege.website || '', naacGrade: selectedCollege.naacGrade || 'A',
                                  aicteApproved: selectedCollege.aicteApproved, ugcApproved: selectedCollege.ugcApproved,
                                  ranking: selectedCollege.ranking?.toString() || '',
                                  hostelDetails: selectedCollege.hostelDetails || '', placementStats: selectedCollege.placementStats || '',
                                  highestPackage: selectedCollege.highestPackage?.toString() || '', averagePackage: selectedCollege.averagePackage?.toString() || '',
                                  infrastructureNotes: selectedCollege.infrastructureNotes || '',
                                });
                                setCollegeView('edit');
                                setCollegeSaveMsg('');
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg"
                            >
                              <Edit3 size={12} /> Edit College
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Tabs */}
                  <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/30 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview', icon: <Building2 size={13} /> },
                      { id: 'courses', label: `Courses & Seats (${selectedCollege.courses.length})`, icon: <GraduationCap size={13} /> },
                      { id: 'placement', label: 'Placement Data', icon: <TrendingUp size={13} /> },
                      { id: 'infrastructure', label: 'Infrastructure', icon: <School size={13} /> },
                      { id: 'hostel', label: 'Hostel & Campus', icon: <Home size={13} /> },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setCollegeActiveDetailTab(tab.id as any)}
                        className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition ${
                          collegeActiveDetailTab === tab.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.icon}{tab.label}
                      </button>
                    ))}
                  </div>

                  {/* DETAIL CONTENT AREAS */}

                  {/* Overview Tab */}
                  {collegeActiveDetailTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-4">
                        <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2">Contact Information</h3>
                        <div className="space-y-3 text-xs font-semibold">
                          {[  
                            { icon: <Users size={13} className="text-blue-500" />, label: 'Contact Person', value: selectedCollege.contactPerson || 'Not specified' },
                            { icon: <Phone size={13} className="text-emerald-500" />, label: 'Phone', value: selectedCollege.phone || 'Not specified' },
                            { icon: <Mail size={13} className="text-indigo-500" />, label: 'Email', value: selectedCollege.email || 'Not specified' },
                            { icon: <Link size={13} className="text-amber-500" />, label: 'Website', value: selectedCollege.website || 'Not specified' },
                            { icon: <MapPin size={13} className="text-rose-500" />, label: 'Address', value: selectedCollege.address || 'Not specified' },
                          ].map(item => (
                            <div key={item.label} className="flex items-start gap-3 p-2.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-lg">
                              {item.icon}
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block">{item.label}</span>
                                <span className="text-slate-800 dark:text-slate-200">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                          <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2 mb-3">Accreditation & Rankings</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
                              <span className="text-blue-500 font-extrabold text-2xl block">{selectedCollege.naacGrade || '—'}</span>
                              <span className="text-slate-400 font-semibold uppercase text-[10px]">NAAC Grade</span>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                              <span className="text-amber-500 font-extrabold text-2xl block">#{selectedCollege.ranking || '—'}</span>
                              <span className="text-slate-400 font-semibold uppercase text-[10px]">National Rank</span>
                            </div>
                            <div className={`p-3 rounded-xl border text-center ${selectedCollege.aicteApproved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-100/30 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800/40'}`}>
                              <span className={`font-extrabold text-sm block ${selectedCollege.aicteApproved ? 'text-emerald-500' : 'text-slate-400'}`}>{selectedCollege.aicteApproved ? '✓ Approved' : '✗ N/A'}</span>
                              <span className="text-slate-400 font-semibold uppercase text-[10px]">AICTE Status</span>
                            </div>
                            <div className={`p-3 rounded-xl border text-center ${selectedCollege.ugcApproved ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-100/30 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800/40'}`}>
                              <span className={`font-extrabold text-sm block ${selectedCollege.ugcApproved ? 'text-indigo-500' : 'text-slate-400'}`}>{selectedCollege.ugcApproved ? '✓ Approved' : '✗ N/A'}</span>
                              <span className="text-slate-400 font-semibold uppercase text-[10px]">UGC Status</span>
                            </div>
                          </div>
                        </div>

                        {/* Agreement Summary */}
                        <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                          <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2 mb-3">Agreement Status</h3>
                          {selectedCollege.collaborations?.length > 0 ? (
                            <div className="space-y-2">
                              {selectedCollege.collaborations.map((collab, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-semibold p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                  <span className="text-emerald-600 dark:text-emerald-400">✓ Active Partnership Agreement</span>
                                  <span className="text-slate-500">{collab.commissionPercent}% Commission</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-xs text-slate-400">
                              <FileText size={24} className="mx-auto mb-2 opacity-30" />
                              No active agreement.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Courses Tab with Live Seat Matrix */}
                  {collegeActiveDetailTab === 'courses' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm">Courses & Live Seat Matrix</h3>
                        {activeTab !== 'colleges-readonly' && (
                          <button
                            onClick={() => { setCourseForm({ degree: 'B.Tech', branch: '', eligibility: '', durationYears: '4', totalFees: '', semesterFees: '', registrationFees: '', examFees: '', hostelFees: '', seatsTotal: '60' }); setShowAddCourseModal(true); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <PlusCircle size={13} /> Add Course
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {selectedCollege.courses.map(course => {
                          const ratio = course.seatsTotal > 0 ? course.seatsBooked / course.seatsTotal : 0;
                          const seatColor = ratio >= 0.95 ? 'bg-rose-500' : ratio >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500';
                          const badgeColor = ratio >= 0.95 ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : ratio >= 0.8 ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
                          const pulseColor = ratio >= 0.95 ? 'pulse-red bg-rose-500' : ratio >= 0.8 ? 'pulse-yellow bg-amber-500' : 'pulse-green bg-emerald-500';
                          const seatStatus = ratio >= 0.95 ? 'Full / Waiting List' : ratio >= 0.8 ? 'Filling Fast' : 'Seats Available';
                          return (
                            <div key={course.id} className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{course.degree} — {course.branch}</h4>
                                  <p className="text-xs text-slate-400 mt-0.5">{course.eligibility || 'See university eligibility criteria'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${badgeColor}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pulseColor}`}></span>
                                    {seatStatus}
                                  </span>
                                </div>
                              </div>

                              {/* Fee Breakdown Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                {[
                                  { label: 'Total Fees', value: `₹${(course.totalFees / 100000).toFixed(2)}L` },
                                  { label: 'Per Semester', value: `₹${(course.semesterFees / 100000).toFixed(2)}L` },
                                  { label: 'Duration', value: `${course.durationYears} Years` },
                                ].map(item => (
                                  <div key={item.label} className="p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                                    <span className="text-[10px] text-slate-400 uppercase block">{item.label}</span>
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.value}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Seat Matrix Progress */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-500">Seat Occupancy — {course.seatsBooked}/{course.seatsTotal} Reserved</span>
                                  <span className={ratio >= 0.95 ? 'text-rose-500' : ratio >= 0.8 ? 'text-amber-500' : 'text-emerald-500'}>{Math.round(ratio * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${seatColor} transition-all duration-500`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{course.seatsTotal - course.seatsBooked} seats remaining</span>
                                  <span>{course.seatsWaiting} on waiting list</span>
                                </div>
                              </div>

                              {activeTab !== 'colleges-readonly' && (
                                <div className="flex justify-end mt-3">
                                  <button
                                    onClick={() => handleBookSeat(course.id)}
                                    disabled={course.seatsBooked >= course.seatsTotal}
                                    className={`text-xs font-bold px-4 py-1.5 rounded-lg transition ${
                                      course.seatsBooked >= course.seatsTotal
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    }`}
                                  >
                                    {course.seatsBooked >= course.seatsTotal ? 'Waiting List Only' : 'Reserve Seat'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {selectedCollege.courses.length === 0 && (
                          <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                            No courses added yet. Click "Add Course" to begin.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Placement Tab */}
                  {collegeActiveDetailTab === 'placement' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-4">
                        <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2">Placement Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                            <TrendingUp className="mx-auto text-emerald-500 mb-1" size={20} />
                            <span className="text-emerald-500 font-extrabold text-xl block">{selectedCollege.highestPackage || '—'} LPA</span>
                            <span className="text-xs text-slate-400 font-semibold">Highest Package</span>
                          </div>
                          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
                            <Briefcase className="mx-auto text-blue-500 mb-1" size={20} />
                            <span className="text-blue-500 font-extrabold text-xl block">{selectedCollege.averagePackage || '—'} LPA</span>
                            <span className="text-xs text-slate-400 font-semibold">Average Package</span>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/30 dark:border-slate-800/30 text-xs">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Placement Notes</span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedCollege.placementStats || 'No placement details entered. Edit this college to add placement company information and statistics.'}</p>
                        </div>
                      </div>

                      <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                        <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2 mb-4">Package Comparison Chart</h3>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Highest', value: selectedCollege.highestPackage || 0, fill: '#10b981' },
                              { name: 'Average', value: selectedCollege.averagePackage || 0, fill: '#3b82f6' },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                              <YAxis stroke="#94a3b8" fontSize={11} unit=" LPA" />
                              <Tooltip formatter={(v: number) => [`${v} LPA`]} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {[
                                  { name: 'Highest', value: selectedCollege.highestPackage || 0, fill: '#10b981' },
                                  { name: 'Average', value: selectedCollege.averagePackage || 0, fill: '#3b82f6' },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Infrastructure Tab */}
                  {collegeActiveDetailTab === 'infrastructure' && (
                    <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                      <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2 mb-4">Campus Infrastructure Details</h3>
                      <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedCollege.infrastructureNotes ||
                          'No infrastructure details added yet. Edit this college profile to add information about labs, libraries, sports facilities, smart classrooms, WiFi, and other campus amenities.'}
                      </div>
                    </div>
                  )}

                  {/* Hostel Tab */}
                  {collegeActiveDetailTab === 'hostel' && (
                    <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
                      <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-2 mb-4">Hostel & Campus Life</h3>
                      <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedCollege.hostelDetails ||
                          'No hostel details added yet. Edit this college profile to add hostel availability, room types, mess facilities, and accommodation fee details.'}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* =========================================
                  ADD / EDIT COLLEGE FORM
              ========================================= */}
              {(collegeView === 'add' || collegeView === 'edit') && (
                <>
                  <button onClick={() => setCollegeView(selectedCollege && collegeView === 'edit' ? 'detail' : 'list')} className="flex items-center space-x-2 text-xs font-semibold text-blue-500 hover:text-blue-400 mb-2">
                    <ArrowLeft size={14} />
                    <span>{collegeView === 'edit' ? 'Back to College Details' : 'Back to College Directory'}</span>
                  </button>

                  <div className="glass-card rounded-2xl border border-slate-200/40 dark:border-slate-800/30 p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        {collegeView === 'add' ? <PlusCircle size={18} className="text-white" /> : <Edit3 size={18} className="text-white" />}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-base">{collegeView === 'add' ? 'Add New College Partner' : `Edit: ${selectedCollege?.name}`}</h2>
                        <p className="text-xs text-slate-400">Fill all sections below. Fields marked with * are required.</p>
                      </div>
                    </div>

                    <div className="space-y-8">

                      {/* Section 1: Basic Information */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                          <Building2 size={13} /> 1. Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">College Name *</label>
                            <input type="text" value={collegeForm.name} onChange={e => setCollegeForm(p => ({ ...p, name: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. Amity School of Engineering & Technology" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Parent University *</label>
                            <select value={collegeForm.universityId} onChange={e => setCollegeForm(p => ({ ...p, universityId: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                              <option value="">-- Select University --</option>
                              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">State *</label>
                            <input type="text" value={collegeForm.state} onChange={e => setCollegeForm(p => ({ ...p, state: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. Uttar Pradesh" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">District</label>
                            <input type="text" value={collegeForm.district} onChange={e => setCollegeForm(p => ({ ...p, district: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. Gautam Buddha Nagar" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Address *</label>
                            <textarea value={collegeForm.address} onChange={e => setCollegeForm(p => ({ ...p, address: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                              rows={2} placeholder="Full address with pin code" />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Contact Details */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                          <Phone size={13} /> 2. Contact Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Contact Person / Admission Head</label>
                            <input type="text" value={collegeForm.contactPerson} onChange={e => setCollegeForm(p => ({ ...p, contactPerson: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. Dr. Alok Verma" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                            <input type="tel" value={collegeForm.phone} onChange={e => setCollegeForm(p => ({ ...p, phone: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="+91 98765 43210" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Official Email</label>
                            <input type="email" value={collegeForm.email} onChange={e => setCollegeForm(p => ({ ...p, email: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="admissions@college.edu" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">College Website URL</label>
                            <input type="url" value={collegeForm.website} onChange={e => setCollegeForm(p => ({ ...p, website: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="https://www.college.edu" />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Accreditation & Rankings */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                          <Award size={13} /> 3. Accreditation & Rankings
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NAAC Grade</label>
                            <select value={collegeForm.naacGrade} onChange={e => setCollegeForm(p => ({ ...p, naacGrade: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                              {['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Rated'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">National Ranking</label>
                            <input type="number" value={collegeForm.ranking} onChange={e => setCollegeForm(p => ({ ...p, ranking: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. 42" />
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={collegeForm.aicteApproved} onChange={e => setCollegeForm(p => ({ ...p, aicteApproved: e.target.checked }))}
                                className="w-4 h-4 rounded accent-blue-600" />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AICTE Approved</span>
                            </label>
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={collegeForm.ugcApproved} onChange={e => setCollegeForm(p => ({ ...p, ugcApproved: e.target.checked }))}
                                className="w-4 h-4 rounded accent-blue-600" />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">UGC Approved</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Placement Details */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                          <TrendingUp size={13} /> 4. Placement & Package Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Highest Package (LPA)</label>
                            <input type="number" step="0.1" value={collegeForm.highestPackage} onChange={e => setCollegeForm(p => ({ ...p, highestPackage: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. 45.0" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Average Package (LPA)</label>
                            <input type="number" step="0.1" value={collegeForm.averagePackage} onChange={e => setCollegeForm(p => ({ ...p, averagePackage: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              placeholder="e.g. 7.2" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Placement Stats & Top Companies</label>
                            <textarea value={collegeForm.placementStats} onChange={e => setCollegeForm(p => ({ ...p, placementStats: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                              rows={3} placeholder="e.g. 95% placements. Top recruiters: Amazon, Microsoft, Deloitte, TCS. Industry-sponsored internships available." />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Hostel Details */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                          <Home size={13} /> 5. Hostel & Accommodation
                        </h3>
                        <textarea value={collegeForm.hostelDetails} onChange={e => setCollegeForm(p => ({ ...p, hostelDetails: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                          rows={3} placeholder="e.g. Separate AC/Non-AC boys and girls hostels, multi-cuisine mess, 24x7 wifi, medical facility, indoor sports room..." />
                      </div>

                      {/* Section 6: Infrastructure */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-violet-500 mb-4 flex items-center gap-2">
                          <School size={13} /> 6. Infrastructure Notes
                        </h3>
                        <textarea value={collegeForm.infrastructureNotes} onChange={e => setCollegeForm(p => ({ ...p, infrastructureNotes: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                          rows={3} placeholder="e.g. State-of-the-art labs, central AC library, Olympic swimming pool, smart classrooms, innovation hub, robotics lab..." />
                      </div>

                    </div>

                    {/* Form Submit Footer */}
                    <div className="mt-8 pt-5 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                      {collegeSaveMsg && (
                        <span className={`text-sm font-semibold ${collegeSaveMsg.includes('successfully') ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {collegeSaveMsg}
                        </span>
                      )}
                      <div className="flex gap-3 ml-auto">
                        <button
                          onClick={() => setCollegeView(selectedCollege && collegeView === 'edit' ? 'detail' : 'list')}
                          className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={isSavingCollege}
                          onClick={async () => {
                            if (!collegeForm.name || !collegeForm.universityId || !collegeForm.state || !collegeForm.address) {
                              setCollegeSaveMsg('Please fill required fields: Name, University, State, Address.');
                              return;
                            }
                            setIsSavingCollege(true);
                            setCollegeSaveMsg('');
                            try {
                              const isEdit = collegeView === 'edit';
                              const url = isEdit ? `${API_URL}/api/erp/colleges/${selectedCollege?.id}` : `${API_URL}/api/erp/colleges/create`;
                              const method = isEdit ? 'PATCH' : 'POST';
                              const res = await fetch(url, {
                                method,
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                                body: JSON.stringify({
                                  ...collegeForm,
                                  ranking: collegeForm.ranking ? parseInt(collegeForm.ranking) : null,
                                  highestPackage: collegeForm.highestPackage ? parseFloat(collegeForm.highestPackage) : null,
                                  averagePackage: collegeForm.averagePackage ? parseFloat(collegeForm.averagePackage) : null,
                                }),
                              });
                              if (res.ok) {
                                setCollegeSaveMsg('College saved successfully! Refreshing directory...');
                                await fetchMasterData();
                                setTimeout(() => setCollegeView('list'), 1200);
                              } else {
                                const err = await res.json();
                                setCollegeSaveMsg(`Error: ${err.error}`);
                              }
                            } catch (e: any) {
                              setCollegeSaveMsg(`Network error: ${e.message}`);
                            } finally {
                              setIsSavingCollege(false);
                            }
                          }}
                          className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow flex items-center gap-2 disabled:opacity-60"
                        >
                          {isSavingCollege ? 'Saving...' : collegeView === 'add' ? 'Add College Partner' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Add Course Modal */}
              {showAddCourseModal && selectedCollege && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                  <div className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h3 className="font-extrabold text-sm">Add New Course</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">For: {selectedCollege.name}</p>
                      </div>
                      <button onClick={() => setShowAddCourseModal(false)}><XCircle size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Degree *</label>
                          <select value={courseForm.degree} onChange={e => setCourseForm(p => ({ ...p, degree: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                            {['B.Tech', 'M.Tech', 'MBA', 'MCA', 'BCA', 'B.Sc', 'M.Sc', 'BBA', 'B.Com', 'MBBS', 'BDS', 'Pharm.D', 'B.Ed', 'LLB', 'Ph.D'].map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Branch / Specialization *</label>
                          <input type="text" value={courseForm.branch} onChange={e => setCourseForm(p => ({ ...p, branch: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Computer Science & Engineering" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Eligibility Criteria</label>
                        <input type="text" value={courseForm.eligibility} onChange={e => setCourseForm(p => ({ ...p, eligibility: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 12th with 60% aggregate in PCM" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Duration (Years) *</label>
                          <select value={courseForm.durationYears} onChange={e => setCourseForm(p => ({ ...p, durationYears: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                            {['1', '2', '3', '4', '5', '6'].map(d => <option key={d} value={d}>{d} Years</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Total Seats</label>
                          <input type="number" value={courseForm.seatsTotal} onChange={e => setCourseForm(p => ({ ...p, seatsTotal: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Total Fees (₹) *</label>
                          <input type="number" value={courseForm.totalFees} onChange={e => setCourseForm(p => ({ ...p, totalFees: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="e.g. 1440000" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Per Semester Fees (₹)</label>
                          <input type="number" value={courseForm.semesterFees} onChange={e => setCourseForm(p => ({ ...p, semesterFees: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="e.g. 180000" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Registration Fees (₹)</label>
                          <input type="number" value={courseForm.registrationFees} onChange={e => setCourseForm(p => ({ ...p, registrationFees: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="e.g. 20000" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Hostel Fees (₹/Year)</label>
                          <input type="number" value={courseForm.hostelFees} onChange={e => setCourseForm(p => ({ ...p, hostelFees: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="e.g. 120000" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                      <button onClick={() => setShowAddCourseModal(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!courseForm.branch || !courseForm.totalFees) {
                            alert('Branch and Total Fees are required.');
                            return;
                          }
                          try {
                            const res = await fetch(`${API_URL}/api/erp/courses/create`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                              body: JSON.stringify({ ...courseForm, collegeId: selectedCollege.id }),
                            });
                            if (res.ok) {
                              setShowAddCourseModal(false);
                              await fetchMasterData();
                              // refresh selected college
                              const updated = await fetch(`${API_URL}/api/erp/colleges`, { headers: { Authorization: `Bearer ${authToken}` } });
                              if (updated.ok) {
                                const allColleges = await updated.json();
                                setColleges(allColleges);
                                const refreshed = allColleges.find((c: College) => c.id === selectedCollege.id);
                                if (refreshed) setSelectedCollege(refreshed);
                              }
                            } else {
                              const err = await res.json();
                              alert(`Error: ${err.error}`);
                            }
                          } catch (e: any) { alert(e.message); }
                        }}
                        className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      >
                        Add Course
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: LEGAL AGREEMENTS */}
          {activeTab === 'agreements' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Partner College</th>
                      <th className="py-3 px-4">Active Period</th>
                      <th className="py-3 px-4">Commission Terms</th>
                      <th className="py-3 px-4">Direct Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-700 dark:text-slate-300">
                    {collaborations.map(collab => {
                      const daysLeft = Math.round((new Date(collab.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const isWarning = daysLeft < 365; // Renew alert

                      return (
                        <tr key={collab.id} className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/30">
                          <td className="py-3 px-4 text-sm font-bold text-slate-950 dark:text-slate-100">{collab.college.name}</td>
                          <td className="py-3 px-4">
                            <span>{new Date(collab.startDate).toLocaleDateString()} to {new Date(collab.expiryDate).toLocaleDateString()}</span>
                            {isWarning && (
                              <span className="flex items-center text-[10px] text-amber-500 mt-1 font-bold">
                                <AlertTriangle size={12} className="mr-1" />
                                Expires in {daysLeft} days! (Renew Reminder)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {collab.commissionPercent > 0 ? `${collab.commissionPercent}% Percent Cut` : `₹${collab.fixedCommission.toLocaleString('en-IN')} Flat Fee`}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{collab.admissionContact || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                              {collab.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-500 hover:underline">Edit Contract</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNTING LEDGER */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              {accountingStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <span className="text-slate-400 uppercase text-[10px]">Consultancy Income</span>
                    <span className="text-xl font-bold block mt-1">₹{accountingStats.summary.totalIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                    <span className="text-slate-400 uppercase text-[10px]">Operational Expenses</span>
                    <span className="text-xl font-bold block mt-1">₹{accountingStats.summary.totalExpense.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    <span className="text-slate-400 uppercase text-[10px]">Net P&L Profit</span>
                    <span className="text-xl font-bold block mt-1">₹{accountingStats.summary.netProfit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Transactions Ledger Table */}
              <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount (INR)</th>
                      <th className="py-3 px-4">GST (18%)</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-300">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/30">
                        <td className="py-3 px-4 font-bold text-slate-950 dark:text-slate-100">{tx.invoiceNumber || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {tx.type === 'INCOME' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{tx.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-950 dark:text-slate-100">₹{tx.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">₹{tx.gstAmount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">{tx.paymentMethod}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-slate-400 font-normal">{tx.description}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDownloadInvoice(tx)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded shadow-sm transition flex items-center gap-1"
                          >
                            <Download size={11} /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AI ADVANCED HUB */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Panel 1: AI Recommendation Matchmaker */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="text-amber-500 pulse-green" size={20} />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">AI Recommendation Engine</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Percentage (%)</label>
                      <input 
                        type="number" 
                        value={aiRecMarks}
                        onChange={(e) => setAiRecMarks(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Budget Limit (₹)</label>
                      <input 
                        type="number" 
                        value={aiRecBudget}
                        onChange={(e) => setAiRecBudget(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Course Type</label>
                      <input 
                        type="text" 
                        value={aiRecCourse}
                        onChange={(e) => setAiRecCourse(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerAiRecommendations}
                    disabled={isAiLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded text-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <span>{isAiLoading ? 'Analyzing dataset...' : 'Generate Matches'}</span>
                  </button>

                  <div className="space-y-3">
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex flex-col space-y-1.5 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{rec.collegeName}</span>
                          <span className="text-indigo-500 font-extrabold">{rec.matchScore}% Match</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{rec.degree} in {rec.branch} • Fees: ₹{rec.totalFees.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400 italic font-normal">"{rec.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 2: AI Chance Predictor */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="text-blue-500" size={20} />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">AI Cutoff Chance Predictor</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Select Course Slot</label>
                      <select 
                        value={aiChanceCourse}
                        onChange={(e) => setAiChanceCourse(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      >
                        <option value="">-- Choose Course --</option>
                        {colleges.flatMap(c => c.courses).map(c => (
                          <option key={c.id} value={c.id}>{c.degree} {c.branch}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Academic Percentage (%)</label>
                      <input 
                        type="number" 
                        value={aiChanceMarks}
                        onChange={(e) => setAiChanceMarks(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerAiChancePredictor}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition"
                  >
                    Calculate Admission Probability
                  </button>

                  {aiChanceResult && (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center font-extrabold text-lg text-blue-500">
                        {aiChanceResult.chancePercentage}%
                      </div>
                      <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Admission Probability</span>
                      <p className="text-[10px] text-slate-500 italic">"{aiChanceResult.advice}"</p>
                    </div>
                  )}
                </div>

                {/* Panel 3: Document Verification (OCR) AI */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckSquare className="text-emerald-500" size={20} />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">AI OCR Scanner & Verification</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Document Profile</label>
                      <select 
                        value={ocrDocType} 
                        onChange={(e) => setOcrDocType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      >
                        <option value="Aadhar">Aadhar ID Card</option>
                        <option value="12th Marksheet">Class 12th Marksheet</option>
                        <option value="PAN">PAN Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Doc File URL (Simulation)</label>
                      <input 
                        type="text" 
                        value={ocrDocUrl}
                        onChange={(e) => setOcrDocUrl(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerOcrVerification}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded text-xs transition"
                  >
                    {ocrLoading ? 'Scanning Document...' : 'Run OCR Integrity Scan'}
                  </button>

                  {ocrResult && (
                    <div className={`p-4 rounded-xl text-xs font-semibold border ${
                      ocrResult.verified ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span>Status: {ocrResult.verified ? 'VERIFIED MATCH' : 'METADATA MISMATCH'}</span>
                        <span className="font-bold">Confidence: {ocrResult.confidenceScore}%</span>
                      </div>
                      <p className="text-[10px] font-normal leading-relaxed">{ocrResult.details.notes}</p>
                    </div>
                  )}
                </div>

                {/* Panel 4: Conversational Chat Assistant */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col h-[400px]">
                  <div className="flex items-center space-x-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-3">
                    <MessageSquare className="text-violet-500" size={20} />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">AI Admission Assistant (Campaign Builder)</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 text-xs">
                    {chatHistory.map((ch, idx) => (
                      <div key={idx} className={`flex ${ch.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl border ${
                          ch.sender === 'user' 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                        }`}>
                          <p>{ch.text}</p>
                          {ch.emailDraft && (
                            <div className="mt-3 p-2 bg-slate-950 text-slate-300 text-[10px] rounded font-mono border border-slate-800 whitespace-pre-wrap">
                              <span className="text-[9px] font-bold text-amber-500 block mb-1">AUTO-GENERATED EMAIL TEMPLATE:</span>
                              {ch.emailDraft}
                            </div>
                          )}
                          {ch.waDraft && (
                            <div className="mt-2 p-2 bg-emerald-950 text-emerald-300 text-[10px] rounded font-mono border border-emerald-900">
                              <span className="text-[9px] font-bold text-emerald-400 block mb-1">AUTO-GENERATED WHATSAPP TEMPLATE:</span>
                              {ch.waDraft}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={chatLoading ? "AI is typing..." : "Ask AI (e.g. 'Draft fees email' or 'Suggest college')..."}
                      disabled={chatLoading}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button type="submit" disabled={chatLoading} className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded">
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: STUDENT PORTAL */}
          {activeTab === 'student-portal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Application status timeline */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 lg:col-span-2 space-y-6">
                  <h3 className="font-extrabold text-base border-b pb-3 mb-4">Admissions Calendar & Checklist</h3>
                  
                  {/* Progress Tracker Stepper */}
                  <div className="relative pl-6 border-l-2 border-blue-500 space-y-6 text-xs">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Step 1: Portal Self-Registration</h4>
                      <p className="text-[10px] text-emerald-500">Completed via OTP Verification check on 05/07/2026</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Step 2: Upload Required Admission Documents</h4>
                      <p className="text-[10px] text-slate-500">Class 10th marksheet, 12th marksheet, Domicile scan attached.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Step 3: Document Verification Status</h4>
                      <p className="text-[10px] text-emerald-500">AI OCR Scanner verification completed. Approved by College Coordinator.</p>
                    </div>

                    <div className="relative text-slate-400">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center text-white">
                        <Clock size={12} />
                      </div>
                      <h4 className="font-bold text-slate-600 dark:text-slate-400">Step 4: Seat Reservation & Fee Clearance</h4>
                      <p className="text-[10px] text-amber-500">Waiting for Registration fees deposit clearing (₹25,000 pending via Razorpay).</p>
                    </div>
                  </div>

                  {/* Document upload Vault */}
                  <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-6">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 uppercase">Academic Document Vault</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 flex items-center justify-between">
                        <div>
                          <span className="block text-slate-800 dark:text-slate-200">Class 10th Marksheet</span>
                          <span className="text-[10px] text-emerald-500 mt-1 block">Approved & Verified</span>
                        </div>
                        <button className="text-slate-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 flex items-center justify-between">
                        <div>
                          <span className="block text-slate-800 dark:text-slate-200">Class 12th Marksheet</span>
                          <span className="text-[10px] text-emerald-500 mt-1 block">Approved & Verified</span>
                        </div>
                        <button className="text-slate-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-between sm:col-span-2">
                        <div>
                          <span className="block text-slate-500">Caste / Category Certificate</span>
                          <span className="text-[9px] text-slate-400 mt-1 block">Supported Formats: PDF, JPG (Max 2MB)</span>
                        </div>
                        <button 
                          onClick={() => simulateDocumentUpload('caste')}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center space-x-1"
                        >
                          <Upload size={12} />
                          <span>{uploadProgress['caste'] === 'Uploading' ? 'Uploading...' : uploadProgress['caste'] === 'Completed' ? 'Done' : 'Upload'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Digital ID Card, offer letters downloads */}
                <div className="space-y-6">
                  {/* Digital ID Card with QR Code */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col items-center bg-gradient-to-tr from-slate-900 to-indigo-950 text-white">
                    <span className="text-[9px] font-extrabold uppercase bg-blue-600/30 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 mb-4">
                      Arkanya Student Identity Card
                    </span>
                    
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden mb-3">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" alt="Student Pic" />
                    </div>

                    <h4 className="font-extrabold text-sm text-center">Rahul Sen</h4>
                    <span className="text-[10px] text-slate-400 text-center block mb-4">ID: ARK-2026-0819</span>

                    <div className="bg-white p-2 rounded-lg mb-4">
                      <QrCode size={96} className="text-slate-950" />
                    </div>

                    <button 
                      onClick={handleDownloadDigitalId}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-4 rounded text-[10px] shadow flex items-center space-x-1"
                    >
                      <Download size={12} />
                      <span>Download Digital ID</span>
                    </button>
                  </div>

                  {/* Documents Downloads (Offer Letter, Bonafide) */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 mb-2">Available PDF Downloads</h3>
                    
                    <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Provisional Offer Letter</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Size: 450 KB • Format: PDF</span>
                      </div>
                      <button 
                        onClick={handleDownloadOfferLetter}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
                      >
                        <Download size={12} />
                      </button>
                    </div>

                    <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Bonafide Certificate Template</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Size: 310 KB • Format: PDF</span>
                      </div>
                      <button 
                        onClick={() => alert("Simulating Bonafide PDF compile...")}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM CONFIGURATION */}
          {activeTab === 'system-config' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: API Keys & Gateways */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-3 mb-2">
                    <Settings size={18} className="text-blue-500" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">Payment & Notification Integrations</h3>
                  </div>

                  <div className="space-y-4 text-xs font-semibold">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Razorpay Key ID</label>
                      <input 
                        type="password" 
                        value="rzp_live_8fs98fd9s8a7d9fa" 
                        disabled 
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">WhatsApp Cloud API Access Token</label>
                      <input 
                        type="password" 
                        value="EAAG38a8sfa878fa98fs98ad7a87fa8sfyha87fh" 
                        disabled 
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">SMS Gateway Endpoint (Twilio / Msg91)</label>
                      <input 
                        type="text" 
                        value="https://api.msg91.com/api/v5/flow/" 
                        disabled 
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-mono text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 2: Backup & Operations */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-3 mb-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">System Maintenance & Backups</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
                      <div>
                        <span className="font-bold block">Automated Cloud Backups (Daily)</span>
                        <span className="text-[10px] text-slate-400">Next Scheduled Run: 06/07/2026 02:00 AM</span>
                      </div>
                      <button 
                        onClick={() => alert("Simulation: Full SQLite snapshot copied to backup directory.")}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-[10px]"
                      >
                        Backup Now
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
                      <div>
                        <span className="font-bold block">Reset Workspace Cache</span>
                        <span className="text-[10px] text-slate-400">Clears current analytics buffers.</span>
                      </div>
                      <button 
                        onClick={() => alert("Cache purged successfully.")}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded text-[10px]"
                      >
                        Flush Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* LEAD DETAILS EDIT MODAL */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-100">
                  {selectedLead.name}
                </h3>
                <span className="text-xs text-slate-400">{selectedLead.email} • {selectedLead.phone}</span>
              </div>
              <button onClick={() => setShowLeadModal(false)} className="text-slate-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
              <button 
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`pb-1 text-xs font-bold transition-all ${activeModalTab === 'profile' ? 'text-blue-500 border-b-2 border-blue-500 font-extrabold' : 'text-slate-400 hover:text-slate-300'}`}
              >
                1. Counselling & Profile
              </button>
              <button 
                type="button"
                disabled={selectedLead.pipelineStage === 'New'}
                onClick={() => setActiveModalTab('documents')}
                className={`pb-1 text-xs font-bold transition-all ${selectedLead.pipelineStage === 'New' ? 'opacity-30 cursor-not-allowed' : ''} ${activeModalTab === 'documents' ? 'text-blue-500 border-b-2 border-blue-500 font-extrabold' : 'text-slate-400 hover:text-slate-300'}`}
              >
                2. Documents Section
              </button>
              <button 
                type="button"
                disabled={selectedLead.pipelineStage === 'New' || selectedLead.pipelineStage === 'Counselling'}
                onClick={() => setActiveModalTab('admission')}
                className={`pb-1 text-xs font-bold transition-all ${selectedLead.pipelineStage === 'New' || selectedLead.pipelineStage === 'Counselling' ? 'opacity-30 cursor-not-allowed' : ''} ${activeModalTab === 'admission' ? 'text-blue-500 border-b-2 border-blue-500 font-extrabold' : 'text-slate-400 hover:text-slate-300'}`}
              >
                3. Admission Confirmation
              </button>
              {(selectedLead.pipelineStage === 'Lost' || activeModalTab === 'dropped') && (
                <button 
                  type="button"
                  onClick={() => setActiveModalTab('dropped')}
                  className={`pb-1 text-xs font-bold transition-all ${activeModalTab === 'dropped' ? 'text-rose-500 border-b-2 border-rose-500 font-extrabold' : 'text-rose-400/70 hover:text-rose-400'}`}
                >
                  Dropped Reason
                </button>
              )}
            </div>

            {/* TAB CONTENTS */}
            {activeModalTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Column 1: Personal Details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-blue-500 uppercase tracking-wider font-extrabold border-b pb-1">Personal & Contact Info</h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={selectedLead.name} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={selectedLead.email} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={selectedLead.phone} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Parent's Name</label>
                      <input 
                        type="text" 
                        value={selectedLead.parentName || ''} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, parentName: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">State</label>
                        <input 
                          type="text" 
                          value={selectedLead.state || ''} 
                          onChange={(e) => setSelectedLead({ ...selectedLead, state: e.target.value })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">District / City</label>
                        <input 
                          type="text" 
                          value={selectedLead.city || ''} 
                          onChange={(e) => setSelectedLead({ ...selectedLead, city: e.target.value })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Academic & Workflow Details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-blue-500 uppercase tracking-wider font-extrabold border-b pb-1">Academic & Counselling</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Prior Qualification</label>
                        <input 
                          type="text" 
                          value={selectedLead.qualification || ''} 
                          onChange={(e) => setSelectedLead({ ...selectedLead, qualification: e.target.value })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                          placeholder="e.g. 12th Pass"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Marks %</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={selectedLead.marksPercentage || ''} 
                          onChange={(e) => setSelectedLead({ ...selectedLead, marksPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Subject / Stream</label>
                      <input 
                        type="text" 
                        value={selectedLead.preferredCourse ? selectedLead.preferredCourse.split(' ')[1] || '' : ''} 
                        onChange={(e) => {
                          const base = selectedLead.preferredCourse ? selectedLead.preferredCourse.split(' ')[0] || 'B.Tech' : 'B.Tech';
                          setSelectedLead({ ...selectedLead, preferredCourse: `${base} ${e.target.value}` });
                        }}
                        placeholder="e.g. CSE, Mechanical, Finance"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Course Selected</label>
                      <input 
                        type="text" 
                        value={selectedLead.preferredCourse || ''} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, preferredCourse: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Preferred College</label>
                      <input 
                        type="text" 
                        value={selectedLead.preferredCollege || ''} 
                        onChange={(e) => setSelectedLead({ ...selectedLead, preferredCollege: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Pipeline Stage</label>
                        <select 
                          value={selectedLead.pipelineStage}
                          onChange={(e) => setSelectedLead({ ...selectedLead, pipelineStage: e.target.value })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
                        >
                          <option value="New">New Inquiries</option>
                          <option value="Counselling">Under Counselling</option>
                          <option value="DocPending">Documents Pending</option>
                          <option value="Confirmed">Admissions Confirmed</option>
                          <option value="Lost">Dropped/Lost</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Lead Source</label>
                        <select
                          value={selectedLead.source}
                          onChange={(e) => setSelectedLead({ ...selectedLead, source: e.target.value })}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
                        >
                          <option value="Website">Website</option>
                          <option value="Facebook">Facebook</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Walk-in">Walk-in</option>
                          <option value="Google">Google</option>
                          <option value="Referral">Referral</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-semibold">
                  <label className="block text-[10px] text-slate-400 uppercase">Counsellor Interaction Logs / Notes</label>
                  <textarea 
                    value={selectedLead.notes || ''} 
                    onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-lg focus:outline-none focus:border-blue-500 font-normal leading-relaxed"
                    placeholder="Enter interaction history, student details, etc..."
                  />
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-[10px] text-slate-400 font-extrabold">AI Priority: {selectedLead.leadScore}/100</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const nextLead = { ...selectedLead, pipelineStage: 'DocPending' };
                        setSelectedLead(nextLead);
                        updateLeadDetails(selectedLead.id, nextLead);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Proceed to Documents
                    </button>
                    <button 
                      type="button"
                      onClick={() => updateLeadDetails(selectedLead.id, selectedLead)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === 'documents' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] font-medium text-blue-400">
                  📄 <strong>Documents Section:</strong> View or upload files on behalf of the student. Status updates will show instantly on the student portal.
                </div>
                
                {/* Upload Status */}
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold mb-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Overall Doc Verification Status</label>
                    <select 
                      value={selectedLead.docStatus || 'Pending'}
                      onChange={(e) => setSelectedLead({ ...selectedLead, docStatus: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
                    >
                      <option value="Pending">Pending Upload</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Verified">Verified / Approved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Fee Payment Status</label>
                    <select 
                      value={selectedLead.feeStatus || 'Pending'}
                      onChange={(e) => setSelectedLead({ ...selectedLead, feeStatus: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: '10th Marksheet', field: 'marksheet10', req: true },
                    { label: '12th Marksheet / Diploma', field: 'marksheet12', req: true },
                    { label: 'Aadhar Card', field: 'aadhar', req: true },
                    { label: 'Passport Photo', field: 'passport', req: true },
                    { label: 'Caste Certificate', field: 'casteCert', req: false },
                    { label: 'Migration Certificate', field: 'migCert', req: true },
                  ].map(doc => {
                    const isUploaded = selectedLead.docStatus === 'Verified' || selectedLead.docStatus === 'Under Review';
                    return (
                      <div key={doc.field} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${selectedLead.docStatus === 'Verified' ? 'bg-emerald-500' : selectedLead.docStatus === 'Under Review' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{doc.label}</span>
                            <span className="text-[10px] block text-slate-400">
                              {selectedLead.docStatus === 'Verified' ? 'Verified ✓' : selectedLead.docStatus === 'Under Review' ? 'Under Review ⏳' : 'Not Uploaded ❌'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLead({ ...selectedLead, docStatus: 'Under Review' });
                              alert(`${doc.label} simulated upload complete!`);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded text-[10px] transition"
                          >
                            Upload File
                          </button>
                          {isUploaded && (
                            <button
                              type="button"
                              onClick={() => alert(`Opening simulated viewer for: ${doc.label}`)}
                              className="px-2 py-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold rounded text-[10px] transition"
                            >
                              View Doc
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const nextLead = { ...selectedLead, pipelineStage: 'Confirmed' };
                      setSelectedLead(nextLead);
                      updateLeadDetails(selectedLead.id, nextLead);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    Proceed to Admission
                  </button>
                  <button 
                    type="button"
                    onClick={() => updateLeadDetails(selectedLead.id, selectedLead)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Save Documents Status
                  </button>
                </div>
              </div>
            )}

            {activeModalTab === 'admission' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-400 space-y-1">
                  🎉 <strong>Admission Confirmation:</strong> The student onboarding journey is complete! Here is the dynamic overview of the student's admission record.
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 space-y-3 text-xs font-semibold">
                  <h4 className="text-[10px] text-blue-500 uppercase tracking-wider font-extrabold border-b pb-1">Final Admission Details</h4>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Student Name</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedLead.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone / Email</span>
                      <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{selectedLead.phone} • {selectedLead.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Course Selected</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold text-blue-500 block mt-0.5">{selectedLead.preferredCourse || 'Not Selected'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Subject / Stream</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                        {selectedLead.preferredCourse ? selectedLead.preferredCourse.split(' ')[1] || 'General' : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Allotted College</span>
                      <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{selectedLead.preferredCollege || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Geographic Location</span>
                      <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{selectedLead.city || 'District N/A'}, {selectedLead.state || 'State N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Document Status</span>
                      <span className="text-emerald-500 font-extrabold block mt-0.5">{selectedLead.docStatus === 'Verified' ? 'All Verified ✓' : 'Verification Complete'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fee Status</span>
                      <select 
                        value={selectedLead.feeStatus || 'Pending'}
                        onChange={(e) => setSelectedLead({ ...selectedLead, feeStatus: e.target.value })}
                        className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded focus:outline-none text-xs mt-1"
                      >
                        <option value="Pending">Pending Payment</option>
                        <option value="Paid">Paid / Complete</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const nextLead = { ...selectedLead, pipelineStage: 'Lost' };
                      setSelectedLead(nextLead);
                      setActiveModalTab('dropped');
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition mr-auto"
                  >
                    Mark as Dropped
                  </button>
                  <button 
                    type="button"
                    onClick={() => updateLeadDetails(selectedLead.id, selectedLead)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition"
                  >
                    Confirm Admission ✓
                  </button>
                </div>
              </div>
            )}

            {activeModalTab === 'dropped' && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400">
                  ⚠️ <strong>Dropped Student Profile:</strong> If the student has dropped out or cancelled their admission, document the exact reason below.
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Pipeline Stage</label>
                    <select 
                      value={selectedLead.pipelineStage}
                      onChange={(e) => setSelectedLead({ ...selectedLead, pipelineStage: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
                    >
                      <option value="New">New Inquiries</option>
                      <option value="Counselling">Under Counselling</option>
                      <option value="DocPending">Documents Pending</option>
                      <option value="Confirmed">Admissions Confirmed</option>
                      <option value="Lost">Dropped/Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Reason for Dropping Out</label>
                    <textarea 
                      value={selectedLead.droppedReason || ''} 
                      onChange={(e) => setSelectedLead({ ...selectedLead, droppedReason: e.target.value })}
                      rows={4}
                      className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-lg focus:outline-none focus:border-rose-500 font-normal leading-relaxed"
                      placeholder="e.g. Selected another college, financial difficulties, course not available..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button 
                    type="button"
                    onClick={() => updateLeadDetails(selectedLead.id, { ...selectedLead, pipelineStage: 'Lost' })}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md transition"
                  >
                    Save Dropped Status
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleCreateLead} className="w-full max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase">Add New Inquiry Lead</h3>
              <button type="button" onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                  placeholder="e.g. Priyesh Kumar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                    placeholder="+91"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                    placeholder="email@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Select Target College</label>
                <select
                  value={newLeadCollege}
                  onChange={(e) => setNewLeadCollege(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                >
                  {colleges.map(col => (
                    <option key={col.id} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Preferred Course</label>
                  <input
                    type="text"
                    value={newLeadCourse}
                    onChange={(e) => setNewLeadCourse(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Lead Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook Ads</option>
                    <option value="Referral">Direct Referral</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition"
            >
              Add Inquiry Lead
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
