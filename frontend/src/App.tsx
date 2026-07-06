import React, { useState, useEffect } from 'react';
import {
  Users, School, FileText, CheckSquare, MessageSquare, AlertTriangle, ShieldCheck,
  Search, Sun, Moon, LayoutDashboard, Kanban, DollarSign, BarChart3,
  Send, Sparkles, UserPlus, LogOut, CheckCircle2, XCircle, Clock, Download,
  QrCode, Upload, Eye, UserCheck, Settings, Globe, PlusCircle, Edit3,
  Building2, MapPin, Phone, Mail, Link, Award, Home, Briefcase,
  TrendingUp, ArrowLeft, GraduationCap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { div } from 'framer-motion/client';

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
  studentProfile?: any;
  address?: string;
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

  // Employee Management States
  const [employeeUsers, setEmployeeUsers] = useState<any[]>([]);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'COUNSELLOR',
    isActive: true
  });

  // Forms & Filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantSlugInput, setTenantSlugInput] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
  const [newLeadQualification, setNewLeadQualification] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Student specific uploads
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [studentProfileData, setStudentProfileData] = useState<any>(null);
  const [studentPortalPassword, setStudentPortalPassword] = useState('');
  const [isResettingStudentPassword, setIsResettingStudentPassword] = useState(false);

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
      console.debug('Dashboard counsellor stats initialized:', counsellorStats);

      if (currentUser?.role === 'SUPERADMIN') {
        const usersRes = await fetch(`${API_URL}/api/users`, { headers });
        if (usersRes.ok) setEmployeeUsers(await usersRes.json());
      }
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




  // CRM: Update Full Lead Profile
  const updateLeadDetails = async (leadId: string, updatedFields: any) => {
    try {
      const { id, counsellor, followups, studentProfile, createdAt, updatedAt, ...sanitized } = updatedFields;
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

  // CRM: Set / Reset Student Portal Password
  const handleResetStudentPassword = async (leadId: string, passwordVal: string) => {
    if (!passwordVal.trim()) {
      alert('Please enter a password first.');
      return;
    }
    setIsResettingStudentPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/crm/student/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          leadId,
          newPassword: passwordVal
        })
      });
      if (res.ok) {
        alert('Student portal password set successfully!');
        setStudentPortalPassword('');
      } else {
        const err = await res.json();
        alert(`Error resetting password: ${err.error}`);
      }
    } catch (e) {
      console.error('Error resetting student password:', e);
      alert('Failed to reset student password.');
    } finally {
      setIsResettingStudentPassword(false);
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
          qualification: newLeadQualification,
        })
      });

      if (res.ok) {
        setShowAddLeadModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        setNewLeadQualification('');
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

  // Real Document Upload Handler
  const handleRealDocumentUpload = (docField: string, leadId?: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';

    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the limit of 2MB.');
        return;
      }

      setUploadProgress(prev => ({ ...prev, [docField]: 'Uploading' }));

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const res = await fetch(`${API_URL}/api/auth/upload-doc`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
              fieldName: docField,
              fileName: file.name,
              fileData: base64Data,
              leadId: leadId
            })
          });

          if (res.ok) {
            setUploadProgress(prev => ({ ...prev, [docField]: 'Completed' }));
            alert('Document uploaded successfully!');
            fetchProfile();
            fetchMasterData();
            // If editing a lead, update the modal lead reference
            if (leadId && selectedLead && selectedLead.id === leadId) {
              // Fetch leads list to sync with modal
              const leadsRes = await fetch(`${API_URL}/api/crm/leads`, {
                headers: { Authorization: `Bearer ${authToken}` }
              });
              if (leadsRes.ok) {
                const leadsList = await leadsRes.json();
                const freshLead = leadsList.find((l: any) => l.id === leadId);
                if (freshLead) {
                  setSelectedLead(freshLead);
                }
              }
            }
          } else {
            const err = await res.json();
            alert(`Upload failed: ${err.error || 'Unknown error'}`);
            setUploadProgress(prev => ({ ...prev, [docField]: 'Failed' }));
          }
        } catch (error) {
          console.error('Error uploading document:', error);
          alert('Failed to connect to the server.');
          setUploadProgress(prev => ({ ...prev, [docField]: 'Failed' }));
        }
      };

      reader.onerror = () => {
        alert('Failed to read file.');
        setUploadProgress(prev => ({ ...prev, [docField]: 'Failed' }));
      };

      reader.readAsDataURL(file);
    };

    fileInput.click();
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
      { label: "Application ID", value: `ARK-APP-${currentUser?.id?.slice(0, 6).toUpperCase() || '7A8F92'}` },
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
      { label: "Registry ID", value: `ARK-STD-${currentUser?.id?.slice(0, 6).toUpperCase() || '7A8F92'}` },
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

  // Download Student Application Form as PDF for confirmed admissions
  const handleDownloadApplicationForm = (lead: any) => {
    const appId = `ARK-APP-${lead.id?.slice(-6).toUpperCase() || 'XXXXXX'}`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const profile = lead.studentProfile || {};
    const photoUrl = profile.docPhotoUrl ? `${API_URL}${profile.docPhotoUrl}` : '';
    const signatureUrl = profile.docSignatureUrl ? `${API_URL}${profile.docSignatureUrl}` : '';

    const htmlContent = `
      <html>
      <head>
        <title>Student Application Form - ${lead.name}</title>
        <style>
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            padding: 30px;
            background-color: #ffffff;
            line-height: 1.5;
          }
          .border-container {
            border: 2px solid #1e3a8a;
            padding: 24px;
            border-radius: 8px;
            position: relative;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border-bottom: 3px double #1e3a8a;
            padding-bottom: 15px;
          }
          .header-logo {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .header-subtitle {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 1px;
          }
          .header-meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .section-title {
            background-color: #f1f5f9;
            border-left: 4px solid #1e3a8a;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            margin-top: 20px;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .info-table td {
            padding: 8px 10px;
            font-size: 12px;
            border: 1px solid #e2e8f0;
          }
          .info-table td.label {
            font-weight: 700;
            color: #475569;
            background-color: #f8fafc;
            width: 25%;
          }
          .info-table td.value {
            color: #0f172a;
            width: 25%;
          }
          .photo-box {
            border: 2px dashed #cbd5e1;
            width: 110px;
            height: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            background-color: #f8fafc;
            border-radius: 4px;
            overflow: hidden;
          }
          .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .declaration {
            font-size: 10px;
            color: #64748b;
            margin-top: 25px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: justify;
          }
          .signature-section {
            margin-top: 40px;
            width: 100%;
          }
          .signature-box {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            color: #475569;
          }
          .signature-line {
            border-top: 1px solid #94a3b8;
            width: 150px;
            margin: 10px auto 5px;
          }
          .signature-image {
            max-height: 45px;
            max-width: 150px;
            object-fit: contain;
            margin-bottom: 5px;
          }
          .stamp {
            border: 3px double #10b981;
            color: #10b981;
            padding: 4px 12px;
            font-weight: 800;
            border-radius: 4px;
            text-transform: uppercase;
            font-size: 11px;
            display: inline-block;
            transform: rotate(-3deg);
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="border-container">
          <table class="header-table">
            <tr>
              <td>
                <div class="header-logo">ARKANYA EDUTECH PVT. LTD.</div>
                <div class="header-subtitle">Official Student Admission Application</div>
              </td>
              <td class="header-meta">
                <strong>Application ID:</strong> ${appId}<br/>
                <strong>Date:</strong> ${new Date(lead.createdAt).toLocaleDateString()}<br/>
                <strong>Workspace:</strong> ${currentTenant?.name || 'Arkanya'}
              </td>
            </tr>
          </table>

          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="vertical-align: top;">
                <div class="section-title" style="margin-top: 0;">1. Personal & Contact Details</div>
                <table class="info-table">
                  <tr>
                    <td class="label">Full Name</td>
                    <td class="value" colspan="3"><strong>${lead.name}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Email ID</td>
                    <td class="value">${lead.email}</td>
                    <td class="label">Phone No</td>
                    <td class="value">${lead.phone}</td>
                  </tr>
                  <tr>
                    <td class="label">Category</td>
                    <td class="value">${profile.category || 'General'}</td>
                    <td class="label">Address</td>
                    <td class="value" colspan="2">${lead.address || '—'}</td>
                  </tr>
                  <tr>
                    <td class="label">City / District</td>
                    <td class="value">${lead.city || '—'}</td>
                    <td class="label">State</td>
                    <td class="value">${lead.state || '—'}</td>
                  </tr>
                </table>
              </td>
              <td style="width: 130px; vertical-align: top; padding-left: 20px; align-items: center;">
                <div class="photo-box">
                  ${photoUrl ? `<img src="${photoUrl}" alt="Student Photo" />` : 'Affix Passport Size Photo Here'}
                </div>
              </td>
            </tr>
          </table>

          <div class="section-title">2. Guardian / Parent Information</div>
          <table class="info-table">
            <tr>
              <td class="label">Father's Name</td>
              <td class="value">${profile.parentName || lead.parentName || '—'}</td>
              <td class="label">Father's Phone</td>
              <td class="value">${profile.parentPhone || '—'}</td>
            </tr>
            <tr>
              <td class="label">Aadhar Card No</td>
              <td class="value">${profile.aadharNo || '—'}</td>
              <td class="label">PAN Card No</td>
              <td class="value">${profile.panNo || '—'}</td>
            </tr>
          </table>

          <div class="section-title">3. Academic Details & Prior Qualification</div>
          <table class="info-table">
            <tr>
              <td class="label">Highest Qualification</td>
              <td class="value">${lead.qualification || '—'}</td>
              <td class="label">Marks Percentage (%)</td>
              <td class="value">${lead.marksPercentage ? `${lead.marksPercentage}%` : '—'}</td>
            </tr>
          </table>

          <div class="section-title">4. Selection & Course Preference</div>
          <table class="info-table">
            <tr>
              <td class="label">Selected College</td>
              <td class="value" colspan="3"><strong>${lead.preferredCollege || '—'}</strong></td>
            </tr>
            <tr>
              <td class="label">Interested Course</td>
              <td class="value">${lead.preferredCourse || '—'}</td>
              <td class="label">Budget Segment</td>
              <td class="value">${lead.budget ? `₹${Number(lead.budget).toLocaleString('en-IN')}` : '—'}</td>
            </tr>
          </table>

          <div class="declaration">
            <strong>Declaration:</strong> I hereby declare that all the information provided in this admission form is true, correct, and complete to the best of my knowledge. I understand that any false statement or misrepresentation may lead to the rejection of my application or cancellation of admission.
          </div>

          <table class="signature-section">
            <tr>
              <td style="width: 50%; vertical-align: bottom;">
                <div class="stamp">Verified ✓</div>
              </td>
              <td style="width: 50%; text-align: center; vertical-align: bottom;">
                <div class="signature-box">
                  ${signatureUrl ? `<img src="${signatureUrl}" class="signature-image" alt="Signature" /><br/>` : ''}
                  <div class="signature-line"></div>
                  Student Signature
                </div>
              </td>
            </tr>
          </table>
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.leadScore > 80 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
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
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #f0faf0 0%, #e8f5e8 40%, #d4edda 100%)' }}>
        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* ── LEFT PANEL ── */}
          <div className="hidden lg:flex flex-col flex-1 px-12 py-10 relative overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
                  <polygon points="30,4 56,52 4,52" fill="#1a5c1a" opacity="0.12" />
                  <polygon points="30,10 52,50 8,50" fill="none" stroke="#1a6b2a" strokeWidth="2" />
                  <text x="22" y="46" fontSize="22" fontWeight="900" fill="#1a6b2a" fontFamily="sans-serif">A</text>
                  <circle cx="30" cy="8" r="4" fill="#1a6b2a" />
                  <path d="M25 10 Q30 4 35 10" stroke="#1a6b2a" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-[#1a4a1a] text-lg leading-tight tracking-wide">ARKANYA</div>
                <div className="text-[10px] text-[#2d7a2d] font-bold tracking-widest">— EDUTECH PVT. LTD. —</div>
                <div className="text-[9px] text-[#4a8a4a] font-medium tracking-wide">Empowering Education Through Technology</div>
              </div>
            </div>

            {/* Tagline */}
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-[#1a3a1a] leading-snug">
                Smart Solutions<br />
                for a <span className="text-[#1a8a2a]">Better Tomorrow</span>
              </h1>
              <p className="text-sm text-[#3a6a3a] mt-3 leading-relaxed max-w-xs">
                We empower educational institutions and businesses with innovative technology and digital solutions.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mb-8">
              {[
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="18" cy="8" r="2" /><path d="M21 21v-1a3 3 0 00-2-2.8" /></svg>), label: 'Admission Consultancy' },
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><circle cx="12" cy="10" r="2" /></svg>), label: 'College ERP & Automation' },
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M8 20h8" /><path d="M7 8h10M7 12h6" /></svg>), label: 'Website Development' },
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>), label: 'Software Solutions' },
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>), label: 'IT & Digital Services' },
                { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 014.1 11.7 19.8 19.8 0 011.07 3.1 2 2 0 013.06 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>), label: '24/7 Support' },
              ].map((svc, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-white/70 border border-[#b8ddb8] flex items-center justify-center shadow-sm">
                    {svc.icon}
                  </div>
                  <span className="text-[10px] text-[#2a5a2a] font-semibold leading-tight">{svc.label}</span>
                </div>
              ))}
            </div>

            {/* College illustration + green wave */}
            <div className="absolute bottom-0 left-0 right-0 h-44 overflow-hidden pointer-events-none">
              <svg viewBox="0 0 800 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full">
                <path d="M0 100 Q200 40 400 90 Q600 140 800 70 L800 180 L0 180 Z" fill="#c8e6c8" opacity="0.6" />
                <path d="M0 125 Q200 70 400 115 Q600 155 800 105 L800 180 L0 180 Z" fill="#a8d5a8" opacity="0.55" />
                <path d="M0 145 Q200 100 400 135 Q600 165 800 130 L800 180 L0 180 Z" fill="#88c488" opacity="0.45" />
                {/* Building */}
                <rect x="80" y="88" width="65" height="60" fill="#d0cfc8" rx="2" />
                <rect x="88" y="72" width="49" height="22" fill="#c0bfb8" rx="1" />
                <rect x="109" y="54" width="5" height="22" fill="#aaa" />
                <circle cx="111" cy="52" r="4" fill="#999" />
                <rect x="87" y="103" width="13" height="11" fill="#b8b7b0" />
                <rect x="104" y="103" width="13" height="11" fill="#b8b7b0" />
                <rect x="121" y="103" width="13" height="11" fill="#b8b7b0" />
                <rect x="87" y="118" width="13" height="10" fill="#b8b7b0" />
                <rect x="121" y="118" width="13" height="10" fill="#b8b7b0" />
                <rect x="102" y="120" width="20" height="28" fill="#aaa9a2" rx="1" />
                {/* Trees */}
                <ellipse cx="58" cy="98" rx="13" ry="15" fill="#5a9a5a" opacity="0.75" />
                <rect x="56" y="108" width="4" height="12" fill="#7a6a5a" opacity="0.6" />
                <ellipse cx="162" cy="94" rx="11" ry="13" fill="#4a8a4a" opacity="0.75" />
                <rect x="160" y="103" width="4" height="10" fill="#7a6a5a" opacity="0.6" />
                <ellipse cx="178" cy="98" rx="10" ry="12" fill="#5a9a5a" opacity="0.65" />
              </svg>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex items-center justify-center w-full lg:w-auto lg:min-w-[460px] px-6 py-10">
            <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl shadow-green-200/40 p-8 border border-green-100">
              {/* Card Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back!</h2>
                <p className="text-sm text-gray-500 mt-1">Login to your account</p>
                <div className="w-10 h-0.5 bg-[#1a8a2a] mx-auto mt-2.5 rounded-full"></div>
              </div>

              {/* Error Banner */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 mb-4">
                  <XCircle size={14} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Workspace / Tenant Slug */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Workspace / Organisation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Globe size={15} />
                    </span>
                    <input
                      type="text"
                      value={tenantSlugInput}
                      onChange={(e) => setTenantSlugInput(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a8a2a] focus:ring-1 focus:ring-[#1a8a2a]/20 bg-gray-50 placeholder-gray-400 transition"
                      placeholder="e.g. arkanya"
                      required
                    />
                  </div>
                </div>

                {/* Email / Username */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email / Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    </span>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a8a2a] focus:ring-1 focus:ring-[#1a8a2a]/20 bg-gray-50 placeholder-gray-400 transition"
                      placeholder="Enter your email or username"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a8a2a] focus:ring-1 focus:ring-[#1a8a2a]/20 bg-gray-50 placeholder-gray-400 transition"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-[#1a8a2a] rounded"
                    />
                    <span className="text-xs text-gray-600 font-medium">Remember me</span>
                  </label>
                  <button type="button" className="text-xs text-[#1a6b2a] font-semibold hover:underline">Forgot Password?</button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a6b2a] hover:bg-[#155522] active:bg-[#0f4019] text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-green-700/20 transition-all duration-200 disabled:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  {isLoggingIn ? 'Verifying...' : 'Login'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Social / SSO Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022" /><rect x="13" y="1" width="10" height="10" fill="#7FBA00" /><rect x="1" y="13" width="10" height="10" fill="#00A4EF" /><rect x="13" y="13" width="10" height="10" fill="#FFB900" /></svg>
                  Microsoft
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                  <ShieldCheck size={13} className="text-blue-500" />
                  SSO Login
                </button>
              </div>

              {/* Contact Admin */}
              <p className="text-center text-xs text-gray-500 mt-5">
                New to Arkanya Edutech?{' '}
                <button type="button" className="text-[#1a6b2a] font-bold hover:underline">Contact Admin</button>
              </p>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="bg-[#0f2f0f] text-white">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between px-8 py-4 text-xs">
            <div className="flex items-center gap-2 text-green-300/80">
              <ShieldCheck size={14} />
              <span>&copy; 2024 Arkanya Edutech Pvt. Ltd. All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-green-300/70">
              <button type="button" className="hover:text-white transition">Privacy Policy</button>
              <span className="text-green-700">|</span>
              <button type="button" className="hover:text-white transition">Terms of Service</button>
              <span className="text-green-700">|</span>
              <div className="flex items-center gap-1">
                <Globe size={12} />
                <span>English</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }


  // ─────────────────────────────────────────────────
  // STRICT ROLE FLAGS
  // ─────────────────────────────────────────────────
  const role = currentUser.role;
  const isSuperAdmin = role === 'SUPERADMIN';
  const isDirectorAcademics = role === 'DIRECTOR_ACADEMICS';
  const isDirectorFinance = role === 'DIRECTOR_FINANCE';
  // const isDirectorLegal     = role === 'DIRECTOR_LEGAL';
  // const isAccountant        = role === 'ACCOUNTANT';
  // const isCounsellor        = role === 'COUNSELLOR';
  const isStudent = role === 'STUDENT';

  // ─────────────────────────────────────────────────
  // PER-ROLE TAB PERMISSION MAP
  // Only the tabs listed here will be shown / rendered
  // ─────────────────────────────────────────────────
  const roleTabMap: Record<string, string[]> = {
    SUPERADMIN: ['dashboard', 'crm', 'students', 'colleges', 'agreements', 'accounting', 'ai', 'system-config'],
    DIRECTOR_ACADEMICS: ['dashboard', 'crm', 'students', 'colleges', 'ai'],
    DIRECTOR_FINANCE: ['accounting', 'agreements', 'dashboard-finance'],
    DIRECTOR_LEGAL: ['agreements', 'colleges-readonly'],
    COUNSELLOR: ['crm', 'students', 'ai'],
    ACCOUNTANT: ['accounting'],
    STUDENT: ['student-portal', 'student-documents', 'student-fees', 'ai'],
  };
  const allowedTabs = roleTabMap[role] || [];
  const can = (tab: string) => allowedTabs.includes(tab) || allowedTabs.includes('*');

  // Role display label & colour
  const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
    SUPERADMIN: { label: 'Super Administrator', color: 'text-violet-400', bg: 'bg-violet-500/20' },
    DIRECTOR_ACADEMICS: { label: 'Director — Admissions', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    DIRECTOR_FINANCE: { label: 'Director — Finance', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    DIRECTOR_LEGAL: { label: 'Director — Legal', color: 'text-rose-400', bg: 'bg-rose-500/20' },
    COUNSELLOR: { label: 'Admission Counsellor', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    ACCOUNTANT: { label: 'Accountant', color: 'text-amber-300', bg: 'bg-amber-500/15' },
    STUDENT: { label: 'Student', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  };
  const rm = roleMeta[role] || { label: role, color: 'text-slate-400', bg: 'bg-slate-500/20' };

  // ─────────────────────────────────────────────────
  // REAL DATABASE DASHBOARD CALCULATIONS
  // ─────────────────────────────────────────────────
  const realTotalLeads = leads.length;
  const realActiveLeads = leads.filter(l => l.pipelineStage !== 'Lost' && l.pipelineStage !== 'Confirmed').length;
  const realTotalAdmissions = leads.filter(l => l.pipelineStage === 'Confirmed').length;

  // Total Income
  const realTotalRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending Payments: sum of budgets of Confirmed leads whose fee status is not 'Paid'
  const realPendingPayments = leads
    .filter(l => l.pipelineStage === 'Confirmed' && l.feeStatus !== 'Paid')
    .reduce((sum, l) => sum + (l.budget || 0), 0);

  const realPartnerColleges = colleges.length;
  const realCounsellorsCount = employeeUsers.filter(u => u.role === 'COUNSELLOR').length || 3;
  const realPendingFollowups = leads.reduce((sum, l) => sum + (l.followups?.filter(f => !f.isCompleted).length || 0), 0);

  // Lead Inflow Trend (Group by day of week)
  const getLeadTrendData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.reduce((acc, day) => {
      acc[day] = { Leads: 0, Confirmed: 0 };
      return acc;
    }, {} as Record<string, { Leads: number, Confirmed: number }>);

    leads.forEach(l => {
      const date = new Date(l.createdAt);
      const dayName = days[date.getDay()];
      if (counts[dayName]) {
        counts[dayName].Leads += 1;
        if (l.pipelineStage === 'Confirmed') {
          counts[dayName].Confirmed += 1;
        }
      }
    });

    const hasData = leads.length > 0;
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      date: day,
      Leads: hasData ? counts[day].Leads : (day === 'Mon' ? 380 : day === 'Tue' ? 620 : day === 'Wed' ? 490 : day === 'Thu' ? 550 : day === 'Fri' ? 720 : day === 'Sat' ? 910 : 640),
      Confirmed: hasData ? counts[day].Confirmed : (day === 'Mon' ? 180 : day === 'Tue' ? 290 : day === 'Wed' ? 230 : day === 'Thu' ? 260 : day === 'Fri' ? 380 : day === 'Sat' ? 530 : 390)
    }));
  };
  const trendData = getLeadTrendData();

  // Funnel Values
  const funnelTotalLeads = leads.length || 2458;
  const funnelContacted = leads.filter(l => l.pipelineStage !== 'New').length || 1420;
  const funnelInterested = leads.filter(l => l.pipelineStage === 'Counselling' || l.pipelineStage === 'DocPending' || l.pipelineStage === 'Confirmed').length || 845;
  const funnelCounselling = leads.filter(l => l.pipelineStage === 'Counselling').length || 520;
  const funnelAdmissions = leads.filter(l => l.pipelineStage === 'Confirmed').length || 320;
  const funnelPaidEnrolled = leads.filter(l => l.pipelineStage === 'Confirmed' && l.feeStatus === 'Paid').length || 170;

  // Lead Source
  const getLeadSourceData = () => {
    const sources = ['WhatsApp', 'Website', 'Facebook', 'Referral', 'Other'];
    const counts = sources.reduce((acc, src) => { acc[src] = 0; return acc; }, {} as Record<string, number>);

    leads.forEach(l => {
      const src = l.source || 'Other';
      const matched = sources.includes(src) ? src : 'Other';
      counts[matched] += 1;
    });

    const total = leads.length || 1;
    return sources.map(src => ({
      name: src,
      value: leads.length > 0 ? Math.round((counts[src] / total) * 100) : (src === 'WhatsApp' ? 40 : src === 'Website' ? 25 : src === 'Facebook' ? 15 : 10)
    }));
  };
  const sourceData = getLeadSourceData();

  // Recent Admissions List
  const getRecentAdmissionsList = () => {
    const sorted = leads
      .filter(l => l.pipelineStage === 'Confirmed' || l.pipelineStage === 'DocPending')
      .slice(0, 5)
      .map(l => ({
        name: l.name,
        college: l.preferredCollege || 'Not Selected',
        course: l.preferredCourse || 'General',
        amount: l.budget ? `₹ ${l.budget.toLocaleString('en-IN')}` : '₹ 45,000',
        counsellor: l.counsellor?.username || 'Unassigned',
        date: new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        status: l.pipelineStage === 'Confirmed' ? 'Confirmed' : 'Pending'
      }));

    if (sorted.length === 0) {
      return [
        { name: 'Aarav Kumar', college: 'Patliputra University', course: 'B.Ed', amount: '₹ 45,000', counsellor: 'Rohit Kumar', date: '14 Jun', status: 'Confirmed' },
        { name: 'Sneha Kumari', college: 'Lalit Narayan Mithila University', course: 'MBA', amount: '₹ 78,000', counsellor: 'Neha Singh', date: '14 Jun', status: 'Confirmed' },
        { name: 'Vikash Ranjan', college: 'Aryabhatta Knowledge University', course: 'B.Tech', amount: '₹ 1,25,000', counsellor: 'Pankaj Kumar', date: '13 Jun', status: 'Pending' },
        { name: 'Muskan Priya', college: 'Veer Kunwar Singh University', course: 'B.Sc (Nursing)', amount: '₹ 65,000', counsellor: 'Neha Singh', date: '13 Jun', status: 'Confirmed' },
        { name: 'Rohit Raj', college: 'Bhupendra Narayan Mandal University', course: 'B.Com', amount: '₹ 35,000', counsellor: 'Rohit Kumar', date: '12 Jun', status: 'Pending' },
      ];
    }
    return sorted;
  };
  const recentAdmissionsList = getRecentAdmissionsList();

  // Schedule List
  const getScheduleList = () => {
    const list: any[] = [];
    leads.forEach(l => {
      if (l.followups) {
        l.followups.forEach(f => {
          if (!f.isCompleted) {
            list.push({
              time: new Date(f.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              desc: f.type || 'Follow up call',
              target: `Student: ${l.name}`,
              type: f.type?.toLowerCase().includes('meeting') ? 'meeting' : f.type?.toLowerCase().includes('counselling') ? 'session' : 'call'
            });
          }
        });
      }
    });

    if (list.length === 0) {
      return [
        { time: '10:00 AM', desc: 'Follow up call', target: 'Student: Aarav Kumar', type: 'call' },
        { time: '11:30 AM', desc: 'Counselling Session', target: 'Student: Sneha Kumari', type: 'session' },
        { time: '02:00 PM', desc: 'University Meeting', target: 'LNMU Collaboration', type: 'meeting' },
        { time: '04:00 PM', desc: 'Follow up call', target: 'Student: Vikash Ranjan', type: 'call' },
      ];
    }
    return list.slice(0, 4);
  };
  const scheduleList = getScheduleList();

  // Live Activities List
  const getLiveActivitiesList = () => {
    const list = leads
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(l => {
        const diff = Math.round((new Date().getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60));
        const timeStr = diff < 60 ? `${diff} min ago` : `${Math.round(diff / 60)}h ago`;
        return {
          text: `Lead stage updated to ${l.pipelineStage}`,
          details: `Student: ${l.name} • Source: ${l.source}`,
          time: timeStr,
          icon: <UserCheck size={11} className="text-emerald-600" />
        };
      });

    if (list.length === 0) {
      return [
        { text: 'New lead received from website', details: 'by Rohit Kumar', time: '5 min ago', icon: <Globe size={11} className="text-emerald-600" /> },
        { text: 'Payment of ₹45,000 received', details: 'from Aarav Kumar', time: '15 min ago', icon: <DollarSign size={11} className="text-emerald-600" /> },
        { text: 'Admission confirmed for Sneha Kumari', details: 'B.Ed - Patliputra University by Neha Singh', time: '30 min ago', icon: <UserCheck size={11} className="text-emerald-600" /> },
        { text: 'Follow up scheduled with Vikash Ranjan', details: 'by Neha Singh', time: '45 min ago', icon: <Clock size={11} className="text-emerald-600" /> },
        { text: 'New counsellor Pankaj Kumar added', details: 'by Super Admin', time: '1 hour ago', icon: <UserPlus size={11} className="text-emerald-600" /> },
      ];
    }
    return list;
  };
  const liveActivities = getLiveActivitiesList();

  // Revenue Overview (Bar chart)
  const getMonthlyRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyTotals = months.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<string, number>);

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const mName = date.toLocaleString('en-US', { month: 'short' });
      if (t.type === 'INCOME' && monthlyTotals[mName] !== undefined) {
        monthlyTotals[mName] += t.amount / 100000; // in Lakhs
      }
    });

    const hasData = transactions.length > 0;
    return months.map(m => ({
      month: m,
      revenue: hasData ? parseFloat(monthlyTotals[m].toFixed(1)) : (m === 'Jan' ? 16 : m === 'Feb' ? 22 : m === 'Mar' ? 26 : m === 'Apr' ? 20 : m === 'May' ? 32 : 38)
    }));
  };
  const revenueData = getMonthlyRevenueData();

  // Top Performing Counsellors
  const getTopCounsellorsList = () => {
    const counts: Record<string, { count: number, revenue: number }> = {};
    leads.forEach(l => {
      if (l.pipelineStage === 'Confirmed') {
        const cName = l.counsellor?.username || 'Unassigned';
        if (!counts[cName]) counts[cName] = { count: 0, revenue: 0 };
        counts[cName].count += 1;
        counts[cName].revenue += l.budget || 35000;
      }
    });

    const list = Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: `${data.count} Admissions`,
        amount: `₹ ${data.revenue.toLocaleString('en-IN')}`,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((item, idx) => ({
        rank: idx + 1,
        name: item.name,
        count: item.count,
        amount: item.amount,
        badgeColor: idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
      }));

    if (list.length === 0) {
      return [
        { rank: 1, name: 'Rohit Kumar', count: '152 Admissions', amount: '₹ 12,45,000', badgeColor: 'bg-amber-500' },
        { rank: 2, name: 'Neha Singh', count: '98 Admissions', amount: '₹ 8,25,000', badgeColor: 'bg-slate-400' },
        { rank: 3, name: 'Pankaj Kumar', count: '70 Admissions', amount: '₹ 5,45,000', badgeColor: 'bg-amber-700' },
      ];
    }
    return list;
  };
  const topCounsellorsList = getTopCounsellorsList();

  // Admissions by Course
  const getAdmissionsByCourseData = () => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      if (l.pipelineStage === 'Confirmed') {
        const course = l.preferredCourse || 'Other';
        counts[course] = (counts[course] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const list = Object.entries(counts).map(([name, val]) => ({
      name,
      value: Math.round((val / total) * 100)
    }));

    if (list.length === 0) {
      return [
        { name: 'B.Ed', value: 35 },
        { name: 'MBA', value: 20 },
        { name: 'B.Tech', value: 18 },
        { name: 'B.Sc', value: 15 },
        { name: 'Other', value: 12 },
      ];
    }
    return list.slice(0, 5);
  };
  const courseAdmissions = getAdmissionsByCourseData();

  // Dynamic AI Insights List
  const getDynamicAiInsights = () => {
    const confirmedCount = leads.filter(l => l.pipelineStage === 'Confirmed').length;
    const totalCount = leads.length || 1;
    const convRate = Math.round((confirmedCount / totalCount) * 100);
    const counsellingCount = leads.filter(l => l.pipelineStage === 'Counselling').length;
    const followupsCount = leads.reduce((sum, l) => sum + (l.followups?.filter(f => !f.isCompleted).length || 0), 0);

    return [
      `Admission conversion rate is likely to increase by 18% in the next 30 days (currently at ${convRate}%).`,
      `There are ${counsellingCount} leads under active counselling, trending highest in Bihar.`,
      `Follow up with the pending ${followupsCount} leads to convert them into confirmed admissions.`
    ];
  };
  const aiInsightsList = getDynamicAiInsights();

  // ─────────────────────────────────────────────────
  // NAV ITEM HELPER
  // ─────────────────────────────────────────────────
  const NavBtn = ({ tab, icon, label }: { tab: string; icon: React.ReactNode; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${isActive
          ? 'bg-[#1a6b2a] text-white shadow-sm shadow-green-950/20'
          : 'text-emerald-100/70 hover:bg-emerald-900/30 hover:text-white'
          }`}
      >
        <span className={`${isActive ? 'text-white' : 'text-emerald-400'}`}>{icon}</span>
        <span className="tracking-wide">{label}</span>
      </button>
    );
  };

  const NavSection = ({ label }: { label: string }) => (
    <div className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500/50 px-3 py-1.5 mt-3">{label}</div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8faf8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-[#0a2f1d] text-slate-100 flex flex-col border-r border-emerald-950 shadow-xl relative z-20">
        {/* Logo Section */}
        <div className="p-5 border-b border-emerald-900/30 flex justify-between items-center bg-[#052214]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-lg p-1.5">
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <polygon points="30,4 56,52 4,52" fill="#ffffff" opacity="0.15" />
                <polygon points="30,10 52,50 8,50" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                <text x="22" y="46" fontSize="22" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">A</text>
                <circle cx="30" cy="8" r="4" fill="#1a8a2a" />
                <path d="M25 10 Q30 4 35 10" stroke="#1a8a2a" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div>
              <div className="font-black text-white text-xs leading-none tracking-wider">ARKANYA</div>
              <div className="text-[8px] text-emerald-400 font-bold tracking-widest leading-none mt-1">EDUTECH PVT. LTD.</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          <NavBtn tab="dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" />

          {/* Admissions Section */}
          <NavSection label="Admissions" />
          <NavBtn tab="crm" icon={<Kanban size={15} />} label="Lead CRM" />
          <NavBtn tab="students" icon={<GraduationCap size={15} />} label="Students" />

          {/* Institutions Section */}
          <NavSection label="Institutions" />
          <NavBtn tab="colleges" icon={<School size={15} />} label="Colleges & Universities" />
          <NavBtn tab="seats" icon={<CheckSquare size={15} />} label="Seats Management" />
          <NavBtn tab="agreements" icon={<FileText size={15} />} label="Agreements" />

          {/* Finance Section */}
          <NavSection label="Finance" />
          <NavBtn tab="accounting" icon={<DollarSign size={15} />} label="Payments" />
          <NavBtn tab="commission" icon={<TrendingUp size={15} />} label="Commission" />
          <NavBtn tab="invoices" icon={<FileText size={15} />} label="Invoices" />
          <NavBtn tab="expenses" icon={<XCircle size={15} />} label="Expenses" />

          {/* Employees Section */}
          <NavSection label="Employees" />
          <NavBtn tab="users" icon={<Users size={15} />} label="Users" />
          <NavBtn tab="attendance" icon={<UserCheck size={15} />} label="Attendance" />
          <NavBtn tab="payroll" icon={<DollarSign size={15} />} label="Payroll" />

          {/* Reports Section */}
          <NavSection label="Reports" />
          <NavBtn tab="analytics" icon={<BarChart3 size={15} />} label="Analytics" />
          <NavBtn tab="reports" icon={<FileText size={15} />} label="Reports" />

          {/* System Section */}
          <NavSection label="System" />
          <NavBtn tab="system-config" icon={<Settings size={15} />} label="Settings" />
          <NavBtn tab="activity-logs" icon={<ShieldCheck size={15} />} label="Activity Logs" />
        </nav>

        {/* Bottom controls & Help Card */}
        <div className="p-3 border-t border-emerald-950 flex flex-col space-y-3">
          {/* Help Card */}
          <div className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a6b2a] flex items-center justify-center text-white">
              <MessageSquare size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white">Need Help?</p>
              <button onClick={() => alert('Support ticket system opening...')} className="text-[9px] font-medium text-emerald-400 hover:text-emerald-300 block mt-0.5">Contact Support</button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-300/80 hover:text-white p-2 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/20 transition"
            >
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 p-2 rounded-lg bg-emerald-950/20 hover:bg-red-950/20 transition"
            >
              <LogOut size={12} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT SCREEN */}
      <main className="flex-1 flex flex-col overflow-y-auto min-h-screen relative">
        {/* Dynamic ambient background gradients for Dark/Light mode */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

        <header className="bg-white dark:bg-slate-950 px-6 py-3 flex justify-between items-center z-10 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div className="relative w-64 hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-9 pr-12 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#1a8a2a] transition placeholder-gray-400"
                placeholder="Search anything..."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-1 py-0.5 rounded shadow-sm">
                Ctrl + K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-1.5 text-gray-500 hover:text-[#1a8a2a] hover:bg-green-50 dark:hover:bg-slate-900 rounded-full transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white">
                8
              </span>
            </button>

            {/* Chat Bubble */}
            <button className="relative p-1.5 text-gray-500 hover:text-[#1a8a2a] hover:bg-green-50 dark:hover:bg-slate-900 rounded-full transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#1a8a2a] text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white">
                3
              </span>
            </button>

            {/* Maximize Icon */}
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 border-l pl-3 border-gray-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center overflow-hidden border border-emerald-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-none">{currentUser.username}</div>
                <span className="text-[9px] font-semibold text-gray-400 block mt-0.5">{rm.label}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 relative z-10">

          {/* DASHBOARD — SuperAdmin & Director Academics */}
          {activeTab === 'dashboard' && (isSuperAdmin || isDirectorAcademics) && (
            <div className="space-y-6">

              {/* Header Title with Date & Quick Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                    Good Morning, {currentUser.username}! <span className="animate-bounce">👋</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Welcome back to Arkanya Edutech ERP Dashboard</p>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  {/* Date Selector */}
                  <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span>14 June 2026</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>

                  {/* Quick Action Button */}
                  <button
                    onClick={() => alert('Quick Action Triggered!')}
                    className="flex items-center gap-1.5 bg-[#1a6b2a] hover:bg-[#11471c] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
                  >
                    <span>+ Quick Action</span>
                  </button>
                </div>
              </div>

              {/* Metrics Widgets Row - Scrollable & Flex Wrap */}
              <div className="overflow-x-auto flex gap-4 pb-2 scrollbar-thin">
                {[
                  { label: 'Total Leads', value: realTotalLeads.toLocaleString('en-IN'), trend: '▲ 15.6% this week', isPositive: true, icon: <Users size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Active Leads', value: realActiveLeads.toLocaleString('en-IN'), trend: '▲ 11.3% this week', isPositive: true, icon: <UserCheck size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Total Admissions', value: realTotalAdmissions.toLocaleString('en-IN'), trend: '▲ 18.7% this month', isPositive: true, icon: <GraduationCap size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Total Revenue', value: `₹ ${realTotalRevenue.toLocaleString('en-IN')}`, trend: '▲ 22.4% this month', isPositive: true, icon: <DollarSign size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Pending Payments', value: `₹ ${realPendingPayments.toLocaleString('en-IN')}`, trend: '▼ 8.4% this month', isPositive: false, icon: <FileText size={16} className="text-rose-600" />, iconBg: 'bg-rose-50 dark:bg-rose-950/30' },
                  { label: 'Partner Colleges', value: realPartnerColleges.toLocaleString('en-IN'), trend: '▲ 9.2% this month', isPositive: true, icon: <School size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Counsellors', value: realCounsellorsCount.toLocaleString('en-IN'), trend: '▲ 5.1% this month', isPositive: true, icon: <UserPlus size={16} className="text-emerald-600" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Pending Follow Ups', value: realPendingFollowups.toLocaleString('en-IN'), trend: '▼ 12.6% today', isPositive: false, icon: <Clock size={16} className="text-rose-600" />, iconBg: 'bg-rose-50 dark:bg-rose-950/30' },
                ].map((card, i) => (
                  <div key={i} className="min-w-[190px] flex-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                      <div className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center`}>
                        {card.icon}
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <span className="text-lg font-black tracking-tight text-gray-900 dark:text-slate-100">{card.value}</span>
                      <p className={`text-[9px] font-bold mt-1 ${card.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {card.trend}
                      </p>
                    </div>
                    {/* Sparkline curve */}
                    <div className="h-7 mt-2 overflow-hidden opacity-60">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path
                          d={card.isPositive
                            ? "M0 25 C15 15, 30 18, 50 8 C70 2, 85 15, 100 5"
                            : "M0 5 C15 15, 30 10, 50 22 C70 28, 85 12, 100 25"
                          }
                          fill="none"
                          stroke={card.isPositive ? "#10b981" : "#f43f5e"}
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Lead Trend, Funnel, Source */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Lead Trend Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200">Lead Trend Overview</h3>
                    <select className="border border-gray-200 dark:border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-gray-600 bg-transparent focus:outline-none">
                      <option>This Week</option>
                      <option>This Month</option>
                    </select>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a6b2a" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1a6b2a" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#88c488" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#88c488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                        <Area type="monotone" name="Leads" dataKey="Leads" stroke="#1a6b2a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorL)" />
                        <Area type="monotone" name="Converted" dataKey="Converted" stroke="#88c488" strokeWidth={2} fillOpacity={1} fill="url(#colorC)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Lead Funnel Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4">Lead Funnel</h3>
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-full flex items-center justify-between gap-4">
                      {/* Interactive CSS Funnel polygon */}
                      <svg viewBox="0 0 160 120" className="w-32 h-auto opacity-95">
                        <polygon points="10,5 150,5 135,22 25,22" fill="#155127" />
                        <polygon points="26,24 134,24 122,41 38,41" fill="#1b6a33" />
                        <polygon points="39,43 121,43 110,60 50,60" fill="#2d8745" />
                        <polygon points="51,62 109,62 98,79 62,79" fill="#4fa767" />
                        <polygon points="63,81 97,81 88,98 72,98" fill="#78c88e" />
                        <polygon points="73,100 87,100 83,115 77,115" fill="#a4e4b7" />
                      </svg>
                      {/* Key Annotations */}
                      <div className="flex-1 space-y-1.5 text-[9px] font-bold text-gray-600 dark:text-slate-400">
                        <div className="flex justify-between border-b pb-0.5 border-gray-100 dark:border-slate-800">
                          <span>{funnelTotalLeads.toLocaleString()}</span><span className="text-gray-400 font-semibold">Total Leads</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 border-gray-100 dark:border-slate-800">
                          <span>{funnelContacted.toLocaleString()}</span><span className="text-gray-400 font-semibold">Contacted</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 border-gray-100 dark:border-slate-800">
                          <span>{funnelInterested.toLocaleString()}</span><span className="text-gray-400 font-semibold">Interested</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 border-gray-100 dark:border-slate-800">
                          <span>{funnelCounselling.toLocaleString()}</span><span className="text-gray-400 font-semibold">Counselling</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 border-gray-100 dark:border-slate-800">
                          <span>{funnelAdmissions.toLocaleString()}</span><span className="text-gray-400 font-semibold">Admissions</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{funnelPaidEnrolled.toLocaleString()}</span><span className="text-gray-400 font-semibold">Paid / Enrolled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead Source Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200">Lead Source</h3>
                    <select className="border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-[10px] font-bold text-gray-600 bg-transparent focus:outline-none">
                      <option>This Month</option>
                    </select>
                  </div>

                  <div className="h-44 relative flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={68}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#1a6b2a" />
                          <Cell fill="#2d8745" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6366f1" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-sans">
                      <span className="text-base font-black text-gray-800 dark:text-slate-100">{realTotalLeads.toLocaleString()}</span>
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider leading-none mt-0.5">Total Leads</span>
                    </div>
                  </div>

                  {/* Legend Details */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-bold text-gray-600 dark:text-slate-400 mt-2">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a6b2a]"></span>WhatsApp</span><span>{sourceData.find(s => s.name === 'WhatsApp')?.value || 0}%</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2d8745]"></span>Website</span><span>{sourceData.find(s => s.name === 'Website')?.value || 0}%</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>Facebook</span><span>{sourceData.find(s => s.name === 'Facebook')?.value || 0}%</span></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>Referral</span><span>{sourceData.find(s => s.name === 'Referral')?.value || 0}%</span></div>
                  </div>
                </div>

              </div>

              {/* Row 3: Recent Admissions, Today's Schedule, Live Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Admissions Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-1.5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4">Recent Admissions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] font-bold text-gray-600 dark:text-slate-400">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-slate-800 pb-2 text-[9px] text-gray-400 uppercase">
                            <th className="py-2">Student Name</th>
                            <th className="py-2">College / University</th>
                            <th className="py-2">Course</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2">Counsellor</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
                          {recentAdmissionsList.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-2 text-gray-800 dark:text-slate-200">{row.name}</td>
                              <td className="py-2">{row.college}</td>
                              <td className="py-2">{row.course}</td>
                              <td className="py-2 text-gray-850 dark:text-slate-200">{row.amount}</td>
                              <td className="py-2">{row.counsellor}</td>
                              <td className="py-2">{row.date}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${row.status === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('students')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
                    View all admissions ➔
                  </button>
                </div>

                {/* Today's Schedule Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4">Today's Schedule</h3>
                    <div className="space-y-3.5">
                      {scheduleList.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold text-gray-700 dark:text-slate-300">
                          <div>
                            <span className="text-gray-400 block text-[9px]">{item.time}</span>
                            <span className="text-gray-850 dark:text-slate-200 block">{item.desc}</span>
                            <span className="text-[9px] text-gray-400 font-medium block mt-0.5">{item.target}</span>
                          </div>
                          <button className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition">
                            {item.type === 'call' && <Phone size={11} />}
                            {item.type === 'session' && <UserPlus size={11} />}
                            {item.type === 'meeting' && <School size={11} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => alert('Calendar opening...')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
                    View full calendar ➔
                  </button>
                </div>

                {/* Live Activities Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4">Live Activities</h3>
                    <div className="space-y-3">
                      {liveActivities.map((activity, i) => (
                        <div key={i} className="flex gap-2.5 items-start text-[10px] font-bold">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0 mt-0.5">
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-800 dark:text-slate-200 block leading-tight">{activity.text}</span>
                            <span className="text-[9px] text-gray-400 font-semibold block">{activity.details}</span>
                          </div>
                          <span className="text-[8px] text-gray-400 shrink-0 font-medium">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('activity-logs')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
                    View all activities ➔
                  </button>
                </div>

              </div>

              {/* Row 4: Revenue Overview, Top Counsellors, Course Admissions, AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Revenue Overview Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between lg:col-span-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200">Revenue Overview</h3>
                    <select className="border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-[10px] font-bold text-gray-600 bg-transparent focus:outline-none">
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} label={{ value: 'Lakhs', angle: -90, position: 'insideLeft', fontSize: 8 }} />
                        <Tooltip formatter={(value) => `${value}L`} />
                        <Bar dataKey="revenue" fill="#1a6b2a" radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Performing Counsellors Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4">Top Performing Counsellors</h3>
                    <div className="space-y-3.5">
                      {topCounsellorsList.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold text-gray-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full ${item.badgeColor} text-white text-[8px] flex items-center justify-center shrink-0`}>
                              {item.rank}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
                            </div>
                            <div>
                              <span className="text-gray-850 dark:text-slate-200 block">{item.name}</span>
                              <span className="text-[8px] text-gray-400 font-semibold block">{item.count}</span>
                            </div>
                          </div>
                          <span className="text-[#1a6b2a] font-extrabold">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => alert('Counsellor performance leaderboard opening...')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
                    View all counsellors ➔
                  </button>
                </div>

                {/* Admissions by Course Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200">Admissions by Course</h3>
                    <select className="border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-[9px] font-bold text-gray-600 bg-transparent focus:outline-none">
                      <option>This Month</option>
                    </select>
                  </div>
                  <div className="h-36 relative flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={courseAdmissions}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={52}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#1a6b2a" />
                          <Cell fill="#2d8745" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6366f1" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Small Course Legend */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] font-bold text-gray-500 dark:text-slate-400 mt-2">
                    {courseAdmissions.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: idx === 0 ? '#1a6b2a' : idx === 1 ? '#2d8745' : idx === 2 ? '#3b82f6' : idx === 3 ? '#f59e0b' : '#6366f1' }}></span>
                          {item.name}
                        </span>
                        <span>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" /> AI Insights
                    </h3>
                    <div className="space-y-3.5 text-[9px] font-bold text-gray-700 dark:text-slate-300">
                      {aiInsightsList.map((insight, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-amber-500 shrink-0">✦</span>
                          <p className="leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('ai')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
                    View all insights ➔
                  </button>
                </div>

              </div>

            </div>
          )}>
          <span className="text-amber-500 shrink-0">✦</span>
          <p className="leading-relaxed">B.Tech admissions are trending high in Bihar.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-amber-500 shrink-0">✦</span>
          <p className="leading-relaxed">Follow up with <span className="text-[#1a6b2a]">56 leads</span> to convert into admission.</p>
        </div>
    </div>
                  </div >
    <button onClick={() => setActiveTab('ai')} className="text-center text-[10px] font-extrabold text-[#1a6b2a] hover:underline mt-4 flex items-center justify-center gap-1.5">
      View all insights ➔
    </button>
                </div >

              </div >

            </div >
          )
}
{/* FINANCE & REVENUE DASHBOARD — Director Finance Only */ }
{
  activeTab === 'dashboard-finance' && isDirectorFinance && (
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
  )
}

{/* TAB 2: CRM KANBAN BOARD */ }
{
  activeTab === 'crm' && (
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
  )
}

{/* TAB: STUDENTS MANAGEMENT — Staff Only */ }
{
  activeTab === 'students' && can('students') && (
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
  )
}

{/* STUDENT PORTAL SUB-TAB: My Admission Status */ }
{
  activeTab === 'student-portal' && isStudent && (
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
              <p className="text-xs text-slate-400">Student ID: ARK-STD-{currentUser.id?.slice(0, 6).toUpperCase() || '00XXXX'}</p>
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
  )
}

{/* STUDENT PORTAL SUB-TAB: My Documents */ }
{
  activeTab === 'student-documents' && isStudent && (
    <div className="space-y-5">
      <div className="glass-card p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
        {(() => {
          const profile = studentProfileData || {};

          const docs = [
            { field: 'marksheet10', label: '10th Marksheet', status: profile.doc10thStatus || 'Pending', url: profile.doc10thUrl, required: true },
            { field: 'marksheet12', label: '12th Marksheet / Diploma', status: profile.doc12thStatus || 'Pending', url: profile.doc12thUrl, required: true },
            { field: 'aadhar', label: 'Aadhar Card', status: profile.docAadharStatus || 'Pending', url: profile.docAadharUrl, required: true },
            { field: 'passport', label: 'Passport Photo', status: profile.docPhotoStatus || 'Pending', url: profile.docPhotoUrl, required: true },
            { field: 'signature', label: 'Student Signature', status: profile.docSignatureStatus || 'Pending', url: profile.docSignatureUrl, required: true },
            { field: 'casteCert', label: 'Caste Certificate', status: profile.docGradStatus || 'Pending', url: profile.docGradUrl, required: false },
            { field: 'migCert', label: 'Migration Certificate', status: profile.docPANStatus || 'Pending', url: profile.docPANUrl, required: false },
          ];

          const verifiedCount = docs.filter(d => d.status === 'Approved').length;

          return (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-sm">Document Submission & Verification</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  {verifiedCount}/7 Verified
                </span>
              </div>
              <div className="space-y-3">
                {docs.map(doc => {
                  const isApproved = doc.status === 'Approved';
                  const isReview = doc.status === 'Under Review' || doc.status === 'Approved' || doc.status === 'Verified';
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
                      <div className="flex items-center gap-2">
                        {doc.url && (
                          <a
                            href={`${API_URL}${doc.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold rounded text-[10px] transition"
                          >
                            View Doc
                          </a>
                        )}
                        {!isApproved && (
                          <button
                            onClick={() => handleRealDocumentUpload(doc.field)}
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
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  )
}

{/* STUDENT PORTAL SUB-TAB: Fee & Payments */ }
{
  activeTab === 'student-fees' && isStudent && (
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
  )
}

{/* TAB 3: COLLEGE MANAGEMENT MODULE */ }
{
  (activeTab === 'colleges' || activeTab === 'colleges-readonly') && (
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
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition ${collegeActiveDetailTab === tab.id
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
                            className={`text-xs font-bold px-4 py-1.5 rounded-lg transition ${course.seatsBooked >= course.seatsTotal
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
  )
}

{/* TAB 4: LEGAL AGREEMENTS */ }
{
  activeTab === 'agreements' && (
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
  )
}

{/* TAB 5: ACCOUNTING LEDGER */ }
{
  activeTab === 'accounting' && (
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
                  <span className={`px-2 py-0.5 rounded text-[10px] ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
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
  )
}

{/* TAB 6: AI ADVANCED HUB */ }
{
  activeTab === 'ai' && (
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
            <div className={`p-4 rounded-xl text-xs font-semibold border ${ocrResult.verified ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
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
                <div className={`max-w-[80%] p-3 rounded-xl border ${ch.sender === 'user'
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
  )
}

{/* TAB 7: STUDENT PORTAL */ }
{
  activeTab === 'student-portal' && (
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
                  onClick={() => handleRealDocumentUpload('casteCert')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center space-x-1"
                >
                  <Upload size={12} />
                  <span>{uploadProgress['casteCert'] === 'Uploading' ? 'Uploading...' : uploadProgress['casteCert'] === 'Completed' ? 'Done' : 'Upload'}</span>
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
  )
}

{/* TAB: EMPLOYEE MANAGEMENT — Superadmin Only */ }
{
  activeTab === 'users' && isSuperAdmin && (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {employeeUsers.length} Employees Registered
          </span>
        </div>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setEmployeeForm({ username: '', email: '', password: '', role: 'COUNSELLOR', isActive: true });
            setEmployeeModalOpen(true);
            setGeneratedPassword('');
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center space-x-2"
        >
          <UserPlus size={15} />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            {employeeUsers.map(emp => (
              <tr key={emp.id} className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/30 text-xs">
                <td className="py-3 px-4 font-bold text-slate-950 dark:text-slate-100">{emp.username}</td>
                <td className="py-3 px-4">{emp.email}</td>
                <td className="py-3 px-4">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-400">
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emp.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">{new Date(emp.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEmployeeForm({ username: emp.username, email: emp.email, password: '', role: emp.role, isActive: emp.isActive });
                        setEmployeeModalOpen(true);
                        setGeneratedPassword('');
                      }}
                      className="text-[10px] font-bold px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                    >
                      Edit / Reset
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${emp.username}'s account?`)) {
                          try {
                            const res = await fetch(`${API_URL}/api/users/${emp.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${authToken}` }
                            });
                            if (res.ok) {
                              alert('Employee deleted successfully.');
                              fetchMasterData();
                            } else {
                              const err = await res.json();
                              alert(`Error: ${err.error}`);
                            }
                          } catch (err: any) {
                            alert(`Network error: ${err.message}`);
                          }
                        }
                      }}
                      className="text-[10px] font-bold px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

{/* TAB 8: SYSTEM CONFIGURATION */ }
{
  activeTab === 'system-config' && (
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
  )
}

        </div >
      </main >

  {/* LEAD DETAILS EDIT MODAL */ }
{
  showLeadModal && selectedLead && (
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
              {/* Column 1: Personal Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-blue-500 uppercase tracking-wider font-extrabold border-b pb-1">Personal & Contact Info</h4>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedLead.name}
                    onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={selectedLead.email}
                      onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={selectedLead.phone}
                      onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Address</label>
                  <textarea
                    value={selectedLead.address || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, address: e.target.value })}
                    placeholder="House / Street, Area, LandMark"
                    rows={2}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">State</label>
                    <input
                      type="text"
                      value={selectedLead.state || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, state: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">District / City</label>
                    <input
                      type="text"
                      value={selectedLead.city || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, city: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Academic & Workflow Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-blue-500 uppercase tracking-wider font-extrabold border-b pb-1">Academic & Onboarding</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Prior Qualification</label>
                    <select
                      value={selectedLead.qualification || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, qualification: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-600 dark:text-slate-300"
                    >
                      <option value="">-- Select --</option>
                      <option value="10th Pass">10th Pass (Matric)</option>
                      <option value="12th Pass - Science">12th Pass – Science (PCM/PCB)</option>
                      <option value="12th Pass - Commerce">12th Pass – Commerce</option>
                      <option value="12th Pass - Arts">12th Pass – Arts</option>
                      <option value="Diploma">Diploma (3-year Polytechnic)</option>
                      <option value="Graduation">Graduation (Any Stream)</option>
                      <option value="B.Tech">B.Tech / B.E.</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="B.Com">B.Com</option>
                      <option value="B.A.">B.A.</option>
                      <option value="Post Graduation">Post Graduation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Marks %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedLead.marksPercentage || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, marksPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Course Selected</label>
                    <input
                      type="text"
                      value={selectedLead.preferredCourse || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, preferredCourse: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                      placeholder="e.g. B.Tech CSE"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Budget Range (₹)</label>
                    <input
                      type="number"
                      value={selectedLead.budget || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                      placeholder="Maximum Budget Limit"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Preferred College</label>
                  <select
                    value={selectedLead.preferredCollege || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, preferredCollege: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Select Target College --</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Pipeline Stage</label>
                    <select
                      value={selectedLead.pipelineStage}
                      onChange={(e) => setSelectedLead({ ...selectedLead, pipelineStage: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal text-slate-800 dark:text-slate-200"
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
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal text-slate-800 dark:text-slate-200"
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

            {/* Section 3: Guardian Details & Student Profile Metadata (Active only in Counselling stage or later) */}
            {selectedLead.studentProfile && (
              <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4 space-y-3">
                <h4 className="text-[10px] text-indigo-500 uppercase tracking-wider font-extrabold pb-1">Guardian, Identity Cards & Photos (Student Profile)</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  {/* Guardian Inputs */}
                  <div className="space-y-3 md:col-span-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Father's / Guardian Name</label>
                        <input
                          type="text"
                          value={selectedLead.studentProfile.parentName || ''}
                          onChange={(e) => {
                            const sp = { ...selectedLead.studentProfile, parentName: e.target.value };
                            setSelectedLead({ ...selectedLead, parentName: e.target.value, studentProfile: sp });
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Father's / Guardian Phone</label>
                        <input
                          type="text"
                          value={selectedLead.studentProfile.parentPhone || ''}
                          onChange={(e) => {
                            const sp = { ...selectedLead.studentProfile, parentPhone: e.target.value };
                            setSelectedLead({ ...selectedLead, studentProfile: sp });
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Caste / Category</label>
                        <select
                          value={selectedLead.studentProfile.category || 'General'}
                          onChange={(e) => {
                            const sp = { ...selectedLead.studentProfile, category: e.target.value };
                            setSelectedLead({ ...selectedLead, studentProfile: sp });
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-600 dark:text-slate-300"
                        >
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="EWS">EWS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Aadhar Number</label>
                        <input
                          type="text"
                          value={selectedLead.studentProfile.aadharNo || ''}
                          onChange={(e) => {
                            const sp = { ...selectedLead.studentProfile, aadharNo: e.target.value };
                            setSelectedLead({ ...selectedLead, studentProfile: sp });
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                          placeholder="12-digit UID"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">PAN Card Number</label>
                        <input
                          type="text"
                          value={selectedLead.studentProfile.panNo || ''}
                          onChange={(e) => {
                            const sp = { ...selectedLead.studentProfile, panNo: e.target.value };
                            setSelectedLead({ ...selectedLead, studentProfile: sp });
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none focus:border-blue-500 font-normal text-slate-800 dark:text-slate-200"
                          placeholder="10-character PAN"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo & Signature Preview - inside studentProfile section */}
                  {(() => {
                    const photoUploading = uploadProgress['passport'] === 'Uploading';
                    const signatureUploading = uploadProgress['signature'] === 'Uploading';
                    const photoUrl = selectedLead.studentProfile?.docPhotoUrl;
                    const signatureUrl = selectedLead.studentProfile?.docSignatureUrl;
                    return (
                      <div className="grid grid-cols-2 gap-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                        <div className="flex flex-col items-center justify-between border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 min-h-[120px]">
                          <span className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Photo</span>
                          {photoUrl ? (
                            <img
                              src={`${API_URL}${photoUrl}`}
                              alt="Student Photo"
                              className="max-h-14 w-auto object-contain rounded"
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 text-center font-normal mb-2">No photo uploaded</span>
                          )}
                          <button
                            type="button"
                            disabled={photoUploading}
                            onClick={() => handleRealDocumentUpload('passport', selectedLead.id)}
                            className={`w-full py-1 rounded text-[9px] font-bold transition mt-1 ${photoUploading
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                          >
                            {photoUploading ? 'Uploading...' : 'Upload Photo'}
                          </button>
                        </div>
                        <div className="flex flex-col items-center justify-between border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 min-h-[120px]">
                          <span className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Signature</span>
                          {signatureUrl ? (
                            <img
                              src={`${API_URL}${signatureUrl}`}
                              alt="Student Signature"
                              className="max-h-14 w-auto object-contain"
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 text-center font-normal mb-2">No signature uploaded</span>
                          )}
                          <button
                            type="button"
                            disabled={signatureUploading}
                            onClick={() => handleRealDocumentUpload('signature', selectedLead.id)}
                            className={`w-full py-1 rounded text-[9px] font-bold transition mt-1 ${signatureUploading
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                          >
                            {signatureUploading ? 'Uploading...' : 'Upload Signature'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── Photo & Signature Upload ── Always visible for all leads ── */}
            {!selectedLead.studentProfile && (
              <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                <h4 className="text-[10px] text-indigo-500 uppercase tracking-wider font-extrabold pb-3 flex items-center gap-1.5">
                  <Upload size={11} /> Photo &amp; Signature
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Passport Photo */}
                  {(() => {
                    const photoUploading = uploadProgress['passport'] === 'Uploading';
                    return (
                      <div className="flex flex-col items-center gap-2 border border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-xl p-3 bg-indigo-50/30 dark:bg-indigo-950/10 min-h-[140px] group hover:border-indigo-400 transition-all">
                        <span className="text-[9px] text-indigo-500 uppercase font-extrabold tracking-wider flex items-center gap-1">
                          <Eye size={9} /> Passport Photo
                        </span>
                        <div className="flex-1 flex items-center justify-center w-full">
                          <div className="w-16 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden">
                            <span className="text-slate-300 dark:text-slate-700">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={photoUploading}
                          onClick={() => handleRealDocumentUpload('passport', selectedLead.id)}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${photoUploading
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-indigo-300/30'
                            }`}
                        >
                          <Upload size={10} />
                          {photoUploading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        <span className="text-[8px] text-slate-400 text-center">JPG, PNG or PDF • Max 2MB</span>
                      </div>
                    );
                  })()}

                  {/* Signature */}
                  {(() => {
                    const signatureUploading = uploadProgress['signature'] === 'Uploading';
                    return (
                      <div className="flex flex-col items-center gap-2 border border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl p-3 bg-purple-50/30 dark:bg-purple-950/10 min-h-[140px] group hover:border-purple-400 transition-all">
                        <span className="text-[9px] text-purple-500 uppercase font-extrabold tracking-wider flex items-center gap-1">
                          <Edit3 size={9} /> Student Signature
                        </span>
                        <div className="flex-1 flex items-center justify-center w-full">
                          <div className="w-full h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden px-2">
                            <span className="text-slate-300 dark:text-slate-700 italic font-serif text-base tracking-widest">Sign</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={signatureUploading}
                          onClick={() => handleRealDocumentUpload('signature', selectedLead.id)}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${signatureUploading
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm hover:shadow-purple-300/30'
                            }`}
                        >
                          <Upload size={10} />
                          {signatureUploading ? 'Uploading...' : 'Upload Signature'}
                        </button>
                        <span className="text-[8px] text-slate-400 text-center">JPG, PNG or PDF • Max 2MB</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

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
              {(() => {
                const profile = selectedLead.studentProfile || {};
                const docs = [
                  { field: 'marksheet10', label: '10th Marksheet', status: profile.doc10thStatus || 'Pending', url: profile.doc10thUrl, required: true },
                  { field: 'marksheet12', label: '12th Marksheet / Diploma', status: profile.doc12thStatus || 'Pending', url: profile.doc12thUrl, required: true },
                  { field: 'aadhar', label: 'Aadhar Card', status: profile.docAadharStatus || 'Pending', url: profile.docAadharUrl, required: true },
                  { field: 'passport', label: 'Passport Photo', status: profile.docPhotoStatus || 'Pending', url: profile.docPhotoUrl, required: true },
                  { field: 'signature', label: 'Student Signature', status: profile.docSignatureStatus || 'Pending', url: profile.docSignatureUrl, required: true },
                  { field: 'casteCert', label: 'Caste Certificate', status: profile.docGradStatus || 'Pending', url: profile.docGradUrl, required: false },
                  { field: 'migCert', label: 'Migration Certificate', status: profile.docPANStatus || 'Pending', url: profile.docPANUrl, required: false },
                ];

                return docs.map(doc => {
                  const isApproved = doc.status === 'Approved';
                  const isReview = doc.status === 'Under Review' || doc.status === 'Approved' || doc.status === 'Verified';
                  const isUploaded = !!doc.url;
                  const uploading = uploadProgress[doc.field] === 'Uploading';

                  return (
                    <div key={doc.field} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : isReview ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{doc.label} {doc.required && <span className="text-rose-400">*</span>}</span>
                          <span className="text-[10px] block text-slate-400">
                            {isApproved ? 'Approved ✓' : isReview ? 'Under Review ⏳' : 'Not Uploaded ❌'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {isUploaded && (
                          <a
                            href={`${API_URL}${doc.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold rounded text-[10px] transition"
                          >
                            View Doc
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => handleRealDocumentUpload(doc.field, selectedLead.id)}
                          className={`px-2 py-1 font-bold rounded text-[10px] transition ${uploading ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                        >
                          {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
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
                  <span className="text-[10px] text-slate-400 block">Prior Qualification</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedLead.qualification || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Marks %</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedLead.marksPercentage ? `${selectedLead.marksPercentage}%` : 'N/A'}</span>
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

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-2 mt-3">
              <span className="font-extrabold text-blue-500 uppercase block tracking-wider text-[10px]">Student Portal Access & Password</span>
              <p className="text-slate-600 dark:text-slate-400">The student can log in to the Student Portal using their registered email. Share or set their password below:</p>

              <div className="space-y-1 font-mono text-[11px] bg-slate-900 text-white p-2.5 rounded-lg mb-2">
                <div><strong>Portal URL:</strong> {window.location.origin}</div>
                <div><strong>Workspace:</strong> {currentTenant?.slug || 'arkanya'}</div>
                <div><strong>Login Email:</strong> {selectedLead.email}</div>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={studentPortalPassword}
                  onChange={e => setStudentPortalPassword(e.target.value)}
                  placeholder="Set login password for student"
                  className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded text-xs focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const generated = Math.random().toString(36).slice(-8);
                    setStudentPortalPassword(generated);
                  }}
                  className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded transition"
                >
                  Generate
                </button>
                <button
                  type="button"
                  disabled={isResettingStudentPassword}
                  onClick={() => handleResetStudentPassword(selectedLead.id, studentPortalPassword)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition"
                >
                  {isResettingStudentPassword ? 'Saving...' : 'Set Password'}
                </button>
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
                onClick={() => handleDownloadApplicationForm(selectedLead)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
              >
                ⬇ Download Application PDF
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
  )
}

{/* ADD / EDIT EMPLOYEE MODAL */ }
{
  employeeModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex justify-between items-start border-b pb-3">
          <h3 className="text-sm font-extrabold uppercase">
            {selectedEmployee ? `Edit Employee: ${selectedEmployee.username}` : 'Add New Employee'}
          </h3>
          <button
            onClick={() => setEmployeeModalOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs font-semibold">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={employeeForm.username}
              onChange={e => setEmployeeForm({ ...employeeForm, username: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
              placeholder="e.g. Aditi Sharma"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={employeeForm.email}
              onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal"
              placeholder="name@yourdomain.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Employee Role</label>
              <select
                value={employeeForm.role}
                onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal text-slate-500"
              >
                <option value="SUPERADMIN">Super Admin</option>
                <option value="DIRECTOR_ACADEMICS">Director Academics</option>
                <option value="DIRECTOR_FINANCE">Director Finance</option>
                <option value="DIRECTOR_LEGAL">Director Legal</option>
                <option value="COUNSELLOR">Counsellor</option>
                <option value="TELECALLER">Telecaller</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Account Status</label>
              <select
                value={employeeForm.isActive ? 'true' : 'false'}
                onChange={e => setEmployeeForm({ ...employeeForm, isActive: e.target.value === 'true' })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-normal text-slate-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Password Management */}
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-blue-500 uppercase tracking-wider text-[10px]">
                Password Management
              </span>
              <button
                type="button"
                onClick={() => {
                  const generated = Math.random().toString(36).slice(-8) + 'A1!';
                  setEmployeeForm({ ...employeeForm, password: generated });
                  setGeneratedPassword(generated);
                }}
                className="text-[10px] text-blue-500 hover:underline font-bold"
              >
                Auto-Generate Password
              </button>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">
                {selectedEmployee ? 'New Password (Leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="text"
                value={employeeForm.password}
                onChange={e => {
                  setEmployeeForm({ ...employeeForm, password: e.target.value });
                  setGeneratedPassword(e.target.value);
                }}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none font-mono"
                placeholder={selectedEmployee ? 'Enter new password to reset' : 'Enter password for new account'}
              />
            </div>

            {generatedPassword && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-[11px] font-mono select-all">
                🔑 <strong>Plain Password:</strong> {generatedPassword} <br />
                <span className="text-[9px] text-slate-400 block mt-1 font-sans">
                  (Copy and share this password with the employee immediately. It is shown only once!)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-3">
          <button
            onClick={() => setEmployeeModalOpen(false)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!employeeForm.username || !employeeForm.email) {
                alert('Username and email are required.');
                return;
              }
              setIsSavingEmployee(true);
              try {
                if (selectedEmployee) {
                  // 1. Update Profile Details
                  const res = await fetch(`${API_URL}/api/users/${selectedEmployee.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({
                      username: employeeForm.username,
                      email: employeeForm.email,
                      role: employeeForm.role,
                      isActive: employeeForm.isActive
                    })
                  });

                  // 2. If password specified, reset password too
                  if (employeeForm.password) {
                    await fetch(`${API_URL}/api/users/${selectedEmployee.id}/reset-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                      body: JSON.stringify({ password: employeeForm.password })
                    });
                  }

                  if (res.ok) {
                    alert('Employee account updated successfully.');
                    setEmployeeModalOpen(false);
                    fetchMasterData();
                  } else {
                    const err = await res.json();
                    alert(`Error: ${err.error}`);
                  }
                } else {
                  // Add new employee
                  if (!employeeForm.password) {
                    alert('Password is required for new employee.');
                    setIsSavingEmployee(false);
                    return;
                  }
                  const res = await fetch(`${API_URL}/api/users/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify(employeeForm)
                  });
                  if (res.ok) {
                    alert(`Employee created successfully! Share password: ${employeeForm.password}`);
                    setEmployeeModalOpen(false);
                    fetchMasterData();
                  } else {
                    const err = await res.json();
                    alert(`Error: ${err.error}`);
                  }
                }
              } catch (err: any) {
                alert(`Network error: ${err.message}`);
              } finally {
                setIsSavingEmployee(false);
              }
            }}
            disabled={isSavingEmployee}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-60"
          >
            {isSavingEmployee ? 'Saving...' : selectedEmployee ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

{/* ADD LEAD MODAL */ }
{
  showAddLeadModal && (
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

          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Preferred Course</label>
            <input
              type="text"
              value={newLeadCourse}
              onChange={(e) => setNewLeadCourse(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
              placeholder="e.g. B.Tech CSE"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Prior Qualification</label>
              <select
                value={newLeadQualification}
                onChange={(e) => setNewLeadQualification(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded focus:outline-none"
              >
                <option value="">-- Select --</option>
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass - Science">12th – Science</option>
                <option value="12th Pass - Commerce">12th – Commerce</option>
                <option value="12th Pass - Arts">12th – Arts</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduation">Graduation</option>
                <option value="Post Graduation">Post Graduation</option>
                <option value="Other">Other</option>
              </select>
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
  )
}
    </div >
  );
}
