
import React, { useState } from 'react';
import { User as UserType, Job, Application, DbState, Role, Feedback, EmergencyInfo, CustomContact, Guide } from '../types';
import TabBar from '../components/TabBar';
import { GoogleGenAI } from "@google/genai";
import { 
  MapPin, CheckCircle2, Search, Loader2, 
  ChevronRight, LogOut, Star, Trash2, 
  Users, Edit2, Save, X, XCircle,
  Smartphone, ShieldCheck, Building2, User, Video, PlayCircle, Clock,
  Filter, Download, Phone, ShieldAlert, MessageSquare, Calendar,
  ClipboardList, Briefcase, Plus, BookOpen, FileText,
  Image as ImageIcon, Upload, Link as LinkIcon, Home as HomeIcon, CalendarDays,
  Plane, Cloud, Sun
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Brand Name Constants ---
const BRAND_NAME_EN = "Blueprint Global";
const BRAND_NAME_CN = "蓝途启航";

// --- 品牌水印组件 (页脚小水印) ---
const BrandingWatermark = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center justify-center opacity-40 pointer-events-none py-6 select-none ${className}`}>
     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center">
        <Plane size={12} className="mr-2 text-blue-400" />
        {BRAND_NAME_EN} | {BRAND_NAME_CN}
     </span>
  </div>
);

// --- 模拟数据 (MOCK DATA) ---
const INITIAL_JOBS: Job[] = [
  { 
    id: 'j1', 
    title: 'Resort Lifeguard (度假村救生员)', 
    company: 'Wisconsin Dells Resort', 
    location: 'Wisconsin Dells, WI', 
    salary: '$16.00/hr', 
    minScore: 7, 
    description: 'Provide safety and hospitality to guests at our water park. Certification training provided. Housing available nearby.', 
    tags: ['Lifeguard', 'Theme Park'],
    image: 'https://images.unsplash.com/photo-1575263629043-f93335501dc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: 10,
    publishDate: '2023-11-01T10:00:00Z',
    housing: '$100/week',
    startDateRange: 'Jun 10 - Jun 25',
    endDate: 'Sept 15',
    programYear: '2024'
  },
  { 
    id: 'j2', 
    title: 'Line Cook (西餐厅帮厨)', 
    company: 'Ocean View Restaurant', 
    location: 'Myrtle Beach, SC', 
    salary: '$18.50/hr', 
    minScore: 6, 
    description: 'Assist in preparing delicious seafood dishes. Great team environment right on the beach.', 
    tags: ['Restaurant', 'Cooking'],
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: 5,
    publishDate: '2023-11-05T14:00:00Z',
    housing: 'Provided (Free)',
    startDateRange: 'May 20 - Jun 10',
    endDate: 'Sept 15',
    programYear: '2024'
  },
  { 
    id: 'j3', 
    title: 'Housekeeping (客房服务)', 
    company: 'Grand Teton Lodge', 
    location: 'Jackson Hole, WY', 
    salary: '$15.00/hr + Tips', 
    minScore: 8, 
    description: 'Work in one of the most beautiful national parks. Employee housing and meal plan included. **This is a 2025 Program Job.**', 
    tags: ['Hospitality', 'National Park'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: 20,
    publishDate: '2023-10-25T09:00:00Z',
    housing: '$75/week',
    startDateRange: 'Jun 01 - Jun 15',
    endDate: 'Sept 15',
    programYear: '2025'
  },
];

const INITIAL_USERS: UserType[] = [
  { id: 'u1', name: 'Admin', role: 'admin', score: 10, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin' },
  { id: 'u2', name: '李明', role: 'student', score: 7.5, school: '上海交通大学', phone: '13800138000', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LiMing', emergencyInfo: { contactName: '李父', contactPhone: '13900000000', managerName: 'John Doe', managerPhone: '+1 555-0199', managerEmail: 'john@example.com', others: [] }, programYear: '2024' },
];

const INITIAL_GUIDES: Guide[] = [
    { id: 'g1', title: 'Visa Interview Tips', content: '### J-1 Visa Interview Guide\n\n1. **Be Confident**: Speak clearly and confidently.\n2. **Know Your Job**: Be ready to explain what you will be doing.\n3. **Intent to Return**: Clearly state your plan to return to China after the program.', updateDate: '2023-10-01' },
    { id: 'g2', title: 'Packing List', content: '### Essential Packing List\n\n- Passport & DS-2019\n- Power Adapter (US Type)\n- Personal Medicine\n- Comfortable Shoes for work\n- Warm jacket (even for summer nights)', updateDate: '2023-10-05' },
    { id: 'g3', title: 'Insurance Overview', content: '### Medical Insurance\n\nYour program includes basic medical insurance. \n\n**Deductible**: $100 per visit.\n**Coverage**: Emergency situations.\n\n*Note: Dental and vision are usually not covered.*', updateDate: '2023-09-20' }
];

const App: React.FC = () => {
  // --- State ---
  const [db, setDb] = useState<DbState>({
    users: INITIAL_USERS,
    jobs: INITIAL_JOBS,
    applications: [],
    feedbacks: [],
    guides: INITIAL_GUIDES,
    currentUser: null,
  });

  const [activeTab, setActiveTab] = useState<string>('login'); 
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [adminDetailJobId, setAdminDetailJobId] = useState<string | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'applicants' | 'feedback'>('applicants');
  const [viewingStudent, setViewingStudent] = useState<UserType | null>(null);
  
  const [editingGuide, setEditingGuide] = useState<Partial<Guide> | null>(null);
  const [viewingGuide, setViewingGuide] = useState<Guide | null>(null);

  const [searchQuery, setSearchQuery] = useState(''); 
  const [adminSortBy, setAdminSortBy] = useState<'applicants' | 'score' | 'date'>('date');
  
  // Registration Form State including programYear
  const [regForm, setRegForm] = useState({ name: '', phone: '', code: '', school: '', score: '6.0', programYear: '2024' });
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [newJob, setNewJob] = useState<Partial<Job>>({ 
    title: '', minScore: 6, location: 'USA', salary: '', tags: [], capacity: 5,
    housing: '', startDateRange: '', endDate: 'Sept 15', programYear: new Date().getFullYear().toString()
  });
  
  const [editingProfile, setEditingProfile] = useState<Partial<UserType> | null>(null);
  
  const [editingEmergency, setEditingEmergency] = useState<boolean>(false);
  const [emergencyForm, setEmergencyForm] = useState<EmergencyInfo>({ contactName: '', contactPhone: '', managerName: '', managerPhone: '', managerEmail: '', others: [] });

  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<string>('');

  // --- Handlers ---

  const handleLogin = (role: Role) => {
    if (role === 'admin') {
      const admin = db.users.find(u => u.role === 'admin');
      if (admin) {
          setDb(prev => ({ ...prev, currentUser: admin }));
          setActiveTab('admin-home');
      }
    } else {
      const student = db.users.find(u => u.role === 'student'); 
      if (student) {
          setDb(prev => ({ ...prev, currentUser: student }));
          setEmergencyForm(student.emergencyInfo || { contactName: '', contactPhone: '', managerName: '', managerPhone: '', managerEmail: '', others: [] });
          setActiveTab('jobs');
      }
    }
  };

  const handleSendCode = () => {
      if(regForm.phone.length !== 11) { alert("请输入正确的11位手机号"); return; }
      setIsCodeSent(true);
      alert("模拟验证码已发送: 1234");
  };

  const handleRegister = () => {
    if (!regForm.name || !regForm.school || !regForm.score) { alert("请完善所有信息"); return; }
    if (regForm.code !== '1234') { alert("验证码错误 (请输入 1234)"); return; }
    const newStudent: UserType = {
      id: `u${Date.now()}`,
      name: regForm.name,
      school: regForm.school,
      phone: regForm.phone,
      role: 'student',
      score: parseFloat(regForm.score),
      programYear: regForm.programYear, // Save the selected year
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${regForm.name}`
    };
    setDb(prev => ({ ...prev, users: [...prev.users, newStudent], currentUser: newStudent }));
    setRegForm({ name: '', phone: '', code: '', school: '', score: '6.0', programYear: '2024' });
    setIsCodeSent(false);
    setActiveTab('jobs');
  };

  const handleApply = (jobId: string) => {
    if (!db.currentUser) return;
    const activeApp = db.applications.find(a => a.studentId === db.currentUser?.id && (a.status === 'pending' || a.status === 'approved'));
    if (activeApp) {
        const appliedJob = db.jobs.find(j => j.id === activeApp.jobId);
        alert(`提交失败：您当前已申请了 "${appliedJob?.title || '其他岗位'}"。\n\n规则：每位同学同一时间只能申请一个岗位。如果需要更换，请联系管理员取消原申请。`);
        return;
    }
    const newApp: Application = { id: `app${Date.now()}`, jobId, studentId: db.currentUser.id, status: 'pending', timestamp: new Date().toISOString() };
    setDb(prev => ({ ...prev, applications: [...prev.applications, newApp] }));
    alert('✅ 申请提交成功！请等待蓝途顾问审核。');
    setSelectedJobId(null);
  };

  const handleAdminAction = (appId: string, action: 'approved' | 'rejected') => {
    setDb(prev => ({ ...prev, applications: prev.applications.map(app => app.id === appId ? { ...app, status: action } : app) }));
  };

  const handleStatusChange = (appId: string, newStatus: string) => {
      setDb(prev => ({ ...prev, applications: prev.applications.map(app => app.id === appId ? { ...app, status: newStatus as any } : app) }));
  };

  const handleBatchAction = (jobId: string, action: 'approved' | 'rejected') => {
      if (!window.confirm(`Confirm to batch ${action} all pending applications?`)) return;
      setDb(prev => ({ ...prev, applications: prev.applications.map(app => (app.jobId === jobId && app.status === 'pending') ? { ...app, status: action } : app) }));
  };

  const handlePostJob = () => {
    if (!newJob.title || !newJob.description || !newJob.housing || !newJob.startDateRange) { alert("请填写完整岗位信息 (包括住宿、开始时间)"); return; }
    const job: Job = {
      id: `j${Date.now()}`,
      title: newJob.title!,
      company: 'SWT Partner Employer',
      location: newJob.location || 'USA',
      salary: newJob.salary || '$12/hr',
      minScore: newJob.minScore || 6,
      description: newJob.description!,
      tags: newJob.tags?.length ? newJob.tags : ['Summer Job'],
      image: newJob.image || 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      capacity: newJob.capacity || 5,
      publishDate: new Date().toISOString(),
      housing: newJob.housing || 'Provided',
      startDateRange: newJob.startDateRange || 'June 1 - June 15',
      endDate: 'Sept 15',
      programYear: newJob.programYear || '2024'
    };
    setDb(prev => ({ ...prev, jobs: [job, ...prev.jobs] }));
    setActiveTab('admin-home');
    setNewJob({ title: '', minScore: 6, location: 'USA', salary: '', tags: [], capacity: 5, housing: '', startDateRange: '', endDate: 'Sept 15', programYear: new Date().getFullYear().toString() });
  };

  const handleGeneratePromoVideo = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !await aistudio.hasSelectedApiKey()) { await aistudio.openSelectKey(); }
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: 'Cinematic promotional video for student travel, upbeat, sunny, diverse students.',
          config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '9:16' }
        });
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            setGeneratedVideoUrl(URL.createObjectURL(blob));
        }
    } catch (e) { console.error("Video Gen Error", e); alert("视频生成失败"); } finally { setIsVideoGenerating(false); }
  };

  const handleDeleteJob = (id: string) => {
    setDb(prev => ({ ...prev, jobs: prev.jobs.filter(j => j.id !== id), applications: prev.applications.filter(a => a.jobId !== id) }));
  };

  const handleSaveProfile = () => {
      if (!editingProfile || !db.currentUser) return;
      const updatedUser = { ...db.currentUser, ...editingProfile };
      setDb(prev => ({ ...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u), currentUser: updatedUser }));
      setEditingProfile(null);
  };

  const handleSaveEmergency = () => {
      if (!db.currentUser) return;
      const updatedUser = { ...db.currentUser, emergencyInfo: emergencyForm };
      setDb(prev => ({ ...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u), currentUser: updatedUser }));
      setEditingEmergency(false);
      alert("Emergency info saved.");
  };

  const handleAddCustomContact = () => {
    setEmergencyForm(prev => ({ ...prev, others: [...(prev.others || []), { id: Date.now().toString(), name: '', phone: '', role: '' }] }));
  };

  const handleRemoveCustomContact = (id: string) => {
    setEmergencyForm(prev => ({ ...prev, others: (prev.others || []).filter(c => c.id !== id) }));
  };

  const handleUpdateCustomContact = (id: string, field: keyof CustomContact, value: string) => {
    setEmergencyForm(prev => ({ ...prev, others: (prev.others || []).map(c => c.id === id ? { ...c, [field]: value } : c) }));
  };

  const handleSubmitFeedback = (e: React.MouseEvent, jobId: string, option: string) => {
      e.stopPropagation();
      if(!db.currentUser) return;
      const fb: Feedback = { id: `fb${Date.now()}`, jobId, studentId: db.currentUser.id, option, timestamp: new Date().toISOString() };
      setDb(prev => ({ ...prev, feedbacks: [fb, ...prev.feedbacks] }));
      alert("Feedback submitted.");
  };

  const exportJobData = (jobId: string, jobTitle: string) => {
     const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
     const apps = db.applications.filter(a => a.jobId === jobId && new Date(a.timestamp) > threeMonthsAgo);
     let csvContent = "data:text/csv;charset=utf-8,Name,Phone,School,Score,ApplyTime,Status\n";
     apps.forEach(app => {
         const student = db.users.find(u => u.id === app.studentId);
         if(student) csvContent += `${student.name},${student.phone || ''},${student.school},${student.score},${new Date(app.timestamp).toLocaleDateString()},${app.status}\n`;
     });
     const link = document.createElement("a");
     link.setAttribute("href", encodeURI(csvContent));
     link.setAttribute("download", `${jobTitle}_Report.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };
  
  const handleDeleteStudent = (userId: string) => {
    if(!window.confirm("Are you sure you want to delete this student?")) return;
    setDb(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId), applications: prev.applications.filter(a => a.studentId !== userId), feedbacks: prev.feedbacks.filter(f => f.studentId !== userId) }));
    setViewingStudent(null);
  };

  const handleUpdateStudentScore = (userId: string) => {
    const newScore = parseFloat(editingScore);
    if(isNaN(newScore) || newScore < 0 || newScore > 10) { alert("Please enter a valid score (0-10)"); return; }
    setDb(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, score: newScore } : u) }));
    if (viewingStudent && viewingStudent.id === userId) setViewingStudent({ ...viewingStudent, score: newScore });
    setEditingScore('');
    alert("Score updated.");
  };

  const handleSaveGuide = () => {
      if (!editingGuide || !editingGuide.title || !editingGuide.content) { alert("Please enter title and content"); return; }
      const newGuide: Guide = { id: editingGuide.id || `g${Date.now()}`, title: editingGuide.title, content: editingGuide.content, updateDate: new Date().toISOString().split('T')[0] };
      setDb(prev => ({ ...prev, guides: editingGuide.id ? prev.guides.map(g => g.id === newGuide.id ? newGuide : g) : [...prev.guides, newGuide] }));
      setEditingGuide(null);
  };

  const handleDeleteGuide = (id: string) => {
      if(!window.confirm("Delete this guide?")) return;
      setDb(prev => ({ ...prev, guides: prev.guides.filter(g => g.id !== id) }));
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setNewJob(prev => ({...prev, image: event.target!.result as string})); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getJobStats = (jobId: string) => {
      const apps = db.applications.filter(a => a.jobId === jobId);
      const studentIds = apps.map(a => a.studentId);
      const students = db.users.filter(u => studentIds.includes(u.id));
      const scores = students.map(s => s.score);
      return { count: apps.length, max: scores.length ? Math.max(...scores) : 0, min: scores.length ? Math.min(...scores) : 0, remaining: db.jobs.find(j => j.id === jobId)?.capacity! - apps.filter(a => a.status === 'approved').length };
  };

  // --- Render Functions ---

  const renderAdminHome = () => {
    let sortedJobs = [...db.jobs];
    if (adminSortBy === 'applicants') sortedJobs.sort((a, b) => getJobStats(b.id).count - getJobStats(a.id).count);
    else if (adminSortBy === 'score') sortedJobs.sort((a, b) => b.minScore - a.minScore);
    else sortedJobs.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return (
    <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full bg-slate-50">
        <header className="px-1 pt-2 flex justify-between items-center">
            <div><div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin</div><h2 className="text-2xl font-bold text-slate-900">Dashboard</h2></div>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                <button onClick={() => setAdminSortBy('date')} className={`p-2 rounded-md ${adminSortBy === 'date' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}><Calendar size={16}/></button>
                <button onClick={() => setAdminSortBy('applicants')} className={`p-2 rounded-md ${adminSortBy === 'applicants' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}><Users size={16}/></button>
                <button onClick={() => setAdminSortBy('score')} className={`p-2 rounded-md ${adminSortBy === 'score' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}><Star size={16}/></button>
            </div>
        </header>
        <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => setActiveTab('admin-guides')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center space-x-2"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><BookOpen size={20} /></div><div className="text-left"><div className="text-xs text-slate-400 font-bold uppercase">Manage</div><div className="text-sm font-bold text-slate-800">Guides</div></div></button>
             <button onClick={() => setActiveTab('post-job')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center space-x-2"><div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Plus size={20} /></div><div className="text-left"><div className="text-xs text-slate-400 font-bold uppercase">Post</div><div className="text-sm font-bold text-slate-800">New Job</div></div></button>
        </div>
        <div className="space-y-4">
            {sortedJobs.map((job, idx) => {
                const stats = getJobStats(job.id);
                return (
                    <div key={job.id} onClick={() => { setAdminDetailJobId(job.id); setActiveTab('admin-job-detail'); }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 relative cursor-pointer active:scale-[0.99] transition-transform">
                        <div className="flex gap-4 mb-3">
                            <img src={job.image} className="w-16 h-16 rounded-xl object-cover bg-slate-100" alt={job.title} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 truncate pr-6">{job.title}</h3>
                                <div className="text-xs font-mono text-blue-500 bg-blue-50 inline-block px-1.5 py-0.5 rounded mt-1 mb-1">#{job.id.toUpperCase()}</div>
                                <div className="flex justify-between items-center"><p className="text-xs text-slate-500 truncate max-w-[120px]">{job.company}</p><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{job.programYear}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3">
                            <div className="text-center"><div className="text-[10px] text-slate-400 uppercase font-bold">Applicants</div><div className="text-sm font-bold text-slate-700">{stats.count}</div></div>
                            <div className="text-center border-l border-slate-50"><div className="text-[10px] text-slate-400 uppercase font-bold">Score Rng</div><div className="text-sm font-bold text-slate-700">{stats.min}-{stats.max}</div></div>
                            <div className="text-center border-l border-slate-50"><div className="text-[10px] text-slate-400 uppercase font-bold">Remains</div><div className={`text-sm font-bold ${stats.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>{stats.remaining}</div></div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Delete "${job.title}"?`)) handleDeleteJob(job.id); }} className="absolute top-5 right-5 text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    </div>
                );
            })}
        </div>
    </div>
    );
  };

  const renderAdminGuides = () => {
      return (
          <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full bg-slate-50">
              <header className="px-1 pt-2 flex justify-between items-end">
                  <div><div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin</div><h2 className="text-2xl font-bold text-slate-900">Guides</h2></div>
                  <button onClick={() => setEditingGuide({ title: '', content: '' })} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-200"><Plus size={16} className="mr-1"/> New</button>
              </header>
              <div className="space-y-3">
                  {db.guides.map(guide => (
                      <div key={guide.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                          <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mr-3"><FileText size={20} /></div><div><div className="font-bold text-slate-800">{guide.title}</div><div className="text-xs text-slate-400">Updated: {guide.updateDate}</div></div></div>
                          <div className="flex space-x-2"><button onClick={() => setEditingGuide(guide)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button><button onClick={() => handleDeleteGuide(guide.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></div>
                      </div>
                  ))}
                  {db.guides.length === 0 && <div className="text-center py-10 text-slate-400">No guides found.</div>}
              </div>
          </div>
      );
  };

  const renderGuideEditor = () => {
      if (!editingGuide) return null;
      return (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full h-[85%] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white"><h3 className="font-bold text-slate-900">{editingGuide.id ? 'Edit Guide' : 'New Guide'}</h3><button onClick={() => setEditingGuide(null)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button></div>
                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                      <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Title</label><input className="w-full text-lg font-bold border-b border-slate-200 py-2 outline-none focus:border-blue-500" placeholder="e.g. Visa Checklist" value={editingGuide.title} onChange={e => setEditingGuide({...editingGuide, title: e.target.value})}/></div>
                      <div className="h-full flex flex-col"><label className="text-xs font-bold text-slate-400 uppercase block mb-2">Content (Markdown)</label><textarea className="w-full flex-1 bg-slate-50 rounded-xl p-4 text-sm leading-relaxed outline-none border border-transparent focus:bg-white focus:border-blue-200 resize-none" placeholder="Write guide content here..." value={editingGuide.content} onChange={e => setEditingGuide({...editingGuide, content: e.target.value})}/></div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={handleSaveGuide} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Save Guide</button></div>
              </div>
          </div>
      );
  };

  const renderGuideDetail = () => {
      if (!viewingGuide) return null;
      return (
          <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
              <div className="h-16 flex items-center px-4 border-b border-slate-100 sticky top-0 bg-white z-10"><button onClick={() => setViewingGuide(null)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors"><ChevronRight className="rotate-180 text-slate-600" size={24}/></button><span className="font-bold text-slate-900 ml-2">Guide Details</span></div>
              <div className="flex-1 overflow-y-auto p-6"><h1 className="text-2xl font-bold text-slate-900 mb-2">{viewingGuide.title}</h1><div className="text-xs text-slate-400 mb-8">Last Updated: {viewingGuide.updateDate}</div><div className="prose prose-slate prose-sm max-w-none"><ReactMarkdown>{viewingGuide.content}</ReactMarkdown></div></div>
          </div>
      );
  };
  
  const renderAdminStudents = () => {
    const students = db.users.filter(u => u.role === 'student');
    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.school?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full bg-slate-50">
        <header className="px-1 pt-2">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin</div>
            <h2 className="text-2xl font-bold text-slate-900">Student Registry</h2>
        </header>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center text-slate-400 mb-2"><Search size={20} className="mr-3 ml-1"/><input className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400" placeholder="Search name or school..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
        <div className="space-y-3">
            {filteredStudents.map(student => {
                const activeApp = db.applications.find(a => a.studentId === student.id && (a.status === 'pending' || a.status === 'approved'));
                const appliedJob = activeApp ? db.jobs.find(j => j.id === activeApp.jobId) : null;
                return (
                <div key={student.id} onClick={() => setViewingStudent(student)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center"><img src={student.avatar} className="w-12 h-12 rounded-full bg-slate-100 mr-3 object-cover" alt={student.name}/><div><h3 className="font-bold text-slate-800 text-base">{student.name}</h3><div className="text-xs text-slate-500 flex items-center mb-1"><Building2 size={12} className="mr-1"/> {student.school}</div>{appliedJob ? (<div className="flex items-center text-xs font-medium text-slate-600"><Briefcase size={12} className="mr-1" /><span className="truncate max-w-[120px]">{appliedJob.title}</span></div>) : (<div className="text-xs text-slate-400 italic">No job selected</div>)}</div></div>
                        <div className="flex flex-col items-end space-y-2"><div className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md text-xs text-center min-w-[2.5rem]">{student.score}</div><div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${activeApp ? (activeApp.status === 'approved' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50') : 'text-slate-400 bg-slate-50'}`}>{activeApp ? (activeApp.status === 'approved' ? 'Matched' : 'Pending') : 'No Selection'}</div><div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 rounded">{student.programYear || '2024'}</div></div>
                    </div>
                </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderStudentModal = () => {
    if (!viewingStudent) return null;
    const isAdmin = db.currentUser?.role === 'admin';
    const activeApp = db.applications.find(a => a.studentId === viewingStudent.id && (a.status === 'pending' || a.status === 'approved'));
    const appliedJob = activeApp ? db.jobs.find(j => j.id === activeApp.jobId) : null;

    return (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full h-[90%] sm:h-auto sm:max-h-[85%] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"><h3 className="font-bold text-slate-900">Student Profile</h3><button onClick={() => { setViewingStudent(null); setEditingScore(''); }} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button></div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex items-center mb-6"><img src={viewingStudent.avatar} className="w-20 h-20 rounded-full bg-slate-100 mr-4 border-4 border-white shadow-lg" alt="Avatar"/><div className="flex-1"><div className="text-2xl font-bold text-slate-900 leading-tight mb-1">{viewingStudent.name}</div><div className="text-sm text-slate-500 font-medium mb-2">{viewingStudent.school}</div><div className="flex items-center flex-wrap gap-2"><div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase">{viewingStudent.role}</div><div className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold uppercase">{viewingStudent.programYear || '2024'}</div></div></div></div>
                    <div className="mb-6"><div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><Briefcase size={14} className="mr-1"/> Job Application</div>{activeApp && appliedJob ? (<div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-2"><div className="font-bold text-slate-800">{appliedJob.title}</div><div className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${activeApp.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{activeApp.status}</div></div><div className="text-xs text-slate-500 mb-3">{appliedJob.company}</div>{isAdmin && (<div className="flex gap-2 pt-2 border-t border-slate-50"><button onClick={() => handleStatusChange(activeApp.id, 'approved')} className="flex-1 py-1.5 text-xs font-bold rounded bg-green-50 text-green-600">Approve</button><button onClick={() => handleStatusChange(activeApp.id, 'rejected')} className="flex-1 py-1.5 text-xs font-bold rounded bg-red-50 text-red-600">Reject</button></div>)}</div>) : (<div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center"><span className="text-sm text-slate-400">Student has not applied for any job yet.</span></div>)}</div>
                    {isAdmin && (<div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100"><div className="flex justify-between items-center mb-2"><div className="text-xs font-bold text-blue-800 uppercase flex items-center"><Star size={14} className="mr-1"/> English Score</div><div className="text-xl font-bold text-blue-600">{viewingStudent.score}</div></div><div className="flex gap-2"><input type="number" step="0.5" placeholder="New Score" className="flex-1 px-3 py-2 rounded-lg border border-blue-200 text-sm outline-none" value={editingScore} onChange={(e) => setEditingScore(e.target.value)} /><button onClick={() => handleUpdateStudentScore(viewingStudent.id)} disabled={!editingScore} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Update</button></div></div>)}
                    <div className="space-y-6"><div><div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><Smartphone size={14} className="mr-1"/> Contact Info</div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3"><div className="flex justify-between"><span className="text-sm text-slate-500">Phone</span><span className="text-sm font-bold text-slate-800">{viewingStudent.phone || 'N/A'}</span></div></div></div><div><div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><ShieldAlert size={14} className="mr-1"/> Emergency Info</div><div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-3"><div className="flex justify-between border-b border-red-100 pb-2"><span className="text-xs text-red-400 font-bold">Family Contact</span><span className="text-sm font-bold text-slate-800">{viewingStudent.emergencyInfo?.contactName || 'N/A'}</span></div><div className="flex justify-between"><span className="text-xs text-red-400 font-bold">Phone</span><span className="text-sm font-bold text-slate-800">{viewingStudent.emergencyInfo?.contactPhone || 'N/A'}</span></div></div></div></div>
                </div>
                {isAdmin && (<div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={() => handleDeleteStudent(viewingStudent.id)} className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 flex items-center justify-center"><Trash2 size={16} className="mr-2"/> Delete Student Account</button></div>)}
            </div>
        </div>
    );
  };

  const renderAdminJobDetail = () => {
      const job = db.jobs.find(j => j.id === adminDetailJobId);
      if(!job) return null;
      const apps = db.applications.filter(a => a.jobId === job.id);
      const jobFeedbacks = db.feedbacks.filter(f => f.jobId === job.id);
      
      return (
          <div className="flex flex-col h-full bg-slate-50 relative">
             <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10"><div className="flex items-center"><button onClick={() => { setAdminDetailJobId(null); setActiveTab('admin-home'); }} className="p-2 -ml-2 text-slate-600"><ChevronRight className="rotate-180" size={24}/></button><span className="font-bold text-slate-800 truncate max-w-[160px] ml-1">{job.title}</span></div><button onClick={() => exportJobData(job.id, job.title)} className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-bold active:scale-95 transition-transform"><Download size={14}/> <span>Export Data</span></button></div>
             <div className="px-4 pt-4 sticky top-16 z-10 bg-slate-50"><div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm mb-4"><button onClick={() => setAdminSubTab('applicants')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${adminSubTab === 'applicants' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Applicants ({apps.length})</button><button onClick={() => setAdminSubTab('feedback')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${adminSubTab === 'feedback' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Feedback ({jobFeedbacks.length})</button></div></div>
             <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
                 {adminSubTab === 'applicants' && (<>{apps.some(a => a.status === 'pending') && (<div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center uppercase tracking-wider"><Filter size={14} className="mr-2"/> Batch Pending</h3><div className="flex gap-3"><button onClick={() => handleBatchAction(job.id, 'approved')} className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold border border-green-100">Approve Pending</button><button onClick={() => handleBatchAction(job.id, 'rejected')} className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-xl text-xs font-bold border border-red-100">Reject Pending</button></div></div>)}<div className="space-y-3">{apps.map(app => { const student = db.users.find(u => u.id === app.studentId); if(!student) return null; return (<div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => setViewingStudent(student)}><div className="flex items-center"><img src={student.avatar} className="w-10 h-10 rounded-full bg-slate-100 mr-3" alt={student.name}/><div><div className="font-bold text-slate-800 flex items-center">{student.name}<Search size={12} className="ml-1 text-blue-400" /></div><div className="text-xs text-slate-500">{student.school}</div></div></div><div className="text-right"><div className="text-lg font-bold text-blue-600">{student.score}</div><div className="text-xs text-slate-400 uppercase">Score</div></div></div><div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center"><div className="text-xs text-slate-500">Applied: {new Date(app.timestamp).toLocaleDateString()}</div><select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className={`text-xs font-bold uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none ${app.status === 'approved' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div></div>); })}</div></>)}
                 {adminSubTab === 'feedback' && (<div className="space-y-3">{jobFeedbacks.map(fb => { const student = db.users.find(u => u.id === fb.studentId); return (<div key={fb.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><MessageSquare size={20} /></div><div className="flex-1"><div className="flex justify-between items-center mb-1"><div className="text-sm font-bold text-slate-800">{student?.name || 'Unknown'}</div><span className="text-[10px] text-slate-400">{new Date(fb.timestamp).toLocaleDateString()}</span></div><div className="text-xs font-medium text-slate-500 mb-2">{student?.school}</div><div className="bg-slate-50 p-2 rounded-lg text-sm text-slate-800 border border-slate-100">"{fb.option}"</div></div></div>); })}</div>)}
             </div>
          </div>
      );
  };
  
  const renderAuth = () => {
    const isRegister = activeTab === 'register';
    return (
      <div className="flex flex-col h-full bg-blue-50 overflow-y-auto">
        <div className="flex-1 p-8 flex flex-col justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6 mx-auto"><span className="text-4xl text-white">✈️</span></div>
            <div className="text-center mb-10"><h1 className="text-2xl font-bold text-slate-900">Blueprint Global Exchange</h1><p className="text-blue-600 font-medium">蓝途国际 · 赴美带薪实习</p></div>
            {isRegister ? (
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
                     <h2 className="text-lg font-bold text-slate-800 mb-2">学生注册</h2>
                     <div className="space-y-3">
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors"><User size={18} className="text-gray-400 mr-3"/><input className="bg-transparent outline-none text-sm w-full" placeholder="真实姓名" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})}/></div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors"><Building2 size={18} className="text-gray-400 mr-3"/><input className="bg-transparent outline-none text-sm w-full" placeholder="就读学校" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})}/></div>
                         <div className="flex space-x-2"><div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors"><Smartphone size={18} className="text-gray-400 mr-3"/><input className="bg-transparent outline-none text-sm w-full" placeholder="手机号" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})}/></div><button onClick={handleSendCode} disabled={isCodeSent} className="bg-blue-100 text-blue-700 px-3 rounded-xl text-xs font-bold whitespace-nowrap">{isCodeSent ? '已发送' : '验证码'}</button></div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors"><ShieldCheck size={18} className="text-gray-400 mr-3"/><input className="bg-transparent outline-none text-sm w-full" placeholder="验证码 (1234)" value={regForm.code} onChange={e => setRegForm({...regForm, code: e.target.value})}/></div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors"><Star size={18} className="text-gray-400 mr-3"/><input type="number" step="0.5" max="10" className="bg-transparent outline-none text-sm w-full" placeholder="预估英语评分 (6-10)" value={regForm.score} onChange={e => setRegForm({...regForm, score: e.target.value})}/></div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                            <Calendar size={18} className="text-gray-400 mr-3"/>
                            <select className="bg-transparent outline-none text-sm w-full text-slate-700" value={regForm.programYear} onChange={e => setRegForm({...regForm, programYear: e.target.value})}>
                                <option value="2023">2023 Program</option>
                                <option value="2024">2024 Program</option>
                                <option value="2025">2025 Program</option>
                                <option value="2026">2026 Program</option>
                            </select>
                         </div>
                     </div>
                     <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-2">立即注册</button><button onClick={() => setActiveTab('login')} className="w-full text-slate-400 text-xs py-2">返回登录</button>
                </div>
            ) : (
                <div className="space-y-3">
                    <button onClick={() => handleLogin('student')} className="w-full bg-white text-slate-700 py-4 rounded-2xl font-bold shadow-sm border border-slate-100 flex items-center justify-center space-x-2 active:scale-95 transition-transform"><span>学生一键登录 (演示)</span></button>
                    <button onClick={() => setActiveTab('register')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">注册新账号</button>
                    <button onClick={() => handleLogin('admin')} className="w-full text-slate-400 text-sm py-4 hover:text-slate-600">管理员入口</button>
                </div>
            )}
        </div>
        <BrandingWatermark />
      </div>
    );
  };
  
  const renderStudentJobs = () => {
    return (
    <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto bg-slate-50">
      <header className="flex justify-between items-end px-1 pt-2"><div><div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1">Blueprint Exchange</div><h2 className="text-2xl font-bold text-slate-800">Job Board</h2></div><div className="bg-white text-blue-700 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center shadow-sm border border-blue-50"><Star size={14} className="mr-1 fill-blue-700"/>Score: {db.currentUser?.score}</div></header>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center text-slate-400"><Search size={20} className="mr-3 ml-1"/><input className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400" placeholder="Search jobs, states..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
      <div className="space-y-4">
        {db.jobs
            .filter(j => 
                (j.programYear === db.currentUser?.programYear) && 
                (j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.location.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map(job => {
            const canApply = (db.currentUser?.score || 0) >= job.minScore;
            const appliedCount = getJobStats(job.id).count;
            const isFull = appliedCount >= job.capacity;
            const activeApp = db.applications.find(a => a.studentId === db.currentUser?.id && (a.status === 'pending' || a.status === 'approved'));

            return (
            <div key={job.id} onClick={() => { if (activeApp && activeApp.jobId !== job.id) { alert("一次只能申请一个岗位，如果开始申请了，其他岗位则不能查看。"); return; } setSelectedJobId(job.id); }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group">
                <div className="h-32 bg-gray-200 relative">
                    <img src={job.image} className="w-full h-full object-cover" alt={job.title} />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 flex items-center shadow-sm"><MapPin size={10} className="mr-1"/> {job.location}</div>
                    {!canApply && (<div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold backdrop-blur-[2px]"><span className="flex items-center"><XCircle size={16} className="mr-2"/> Score {job.minScore}+</span></div>)}
                    {isFull && canApply && (<div className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-white font-bold backdrop-blur-[2px]"><span className="flex items-center">Full</span></div>)}
                    {activeApp && activeApp.jobId !== job.id && (<div className="absolute inset-0 bg-slate-50/80 flex items-center justify-center text-slate-500 font-bold backdrop-blur-[1px]"><span className="flex items-center text-xs">Locked (Active Application)</span></div>)}
                </div>
                <div className="p-4"><h3 className="font-bold text-lg text-slate-800 mb-1">{job.title}</h3><div className="flex justify-between items-center mt-2"><div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{job.salary}</div><div className="flex items-center text-xs text-slate-400"><Users size={12} className="mr-1"/> {appliedCount}/{job.capacity}</div></div></div>
            </div>
            );
        })}
      </div>
    </div>
    );
  };
  
  const renderApplications = () => {
      const myApps = db.applications.filter(a => a.studentId === db.currentUser?.id);
      return (
        <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto bg-slate-50">
            <header className="px-1 pt-2"><h2 className="text-2xl font-bold text-slate-900">My Internship</h2></header>
            <div className="space-y-4">
                {myApps.length === 0 ? (<div className="text-center py-10 text-slate-400">No applications yet.</div>) : (myApps.map(app => {
                        const job = db.jobs.find(j => j.id === app.jobId);
                        if (!job) return null;
                        const statusColors: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-600 border-yellow-100', approved: 'bg-green-50 text-green-600 border-green-100', rejected: 'bg-red-50 text-red-600 border-red-100' };
                        const isApproved = app.status === 'approved';
                        return (
                            <div key={app.id} onClick={() => setSelectedJobId(job.id)} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 active:scale-[0.98] transition-transform cursor-pointer group relative overflow-hidden">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ChevronRight size={24}/></div>
                                <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-slate-800">{job.title}</h3><p className="text-xs text-slate-500">{job.company}</p></div><div className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColors[app.status]}`}>{app.status.toUpperCase()}</div></div>
                                <div className="flex items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50"><Clock size={12} className="mr-1"/>Applied on {new Date(app.timestamp).toLocaleDateString()}</div>
                                {isApproved && (<div className="mt-4 bg-slate-50 rounded-xl p-3" onClick={(e) => e.stopPropagation()}><div className="text-xs font-bold text-slate-500 mb-2 flex items-center"><ClipboardList size={14} className="mr-1"/> Weekly Check-in</div><div className="grid grid-cols-2 gap-2">{['Work is great', 'Need Housing Help', 'Job Issues', 'Other'].map(opt => (<button key={opt} onClick={(e) => handleSubmitFeedback(e, job.id, opt)} className="py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 active:bg-blue-50">{opt}</button>))}</div></div>)}
                            </div>
                        );
                    }))}
            </div>
        </div>
      );
  };
  
  const renderStudentServices = () => {
    return (
      <div className="p-4 space-y-5 pb-24 bg-slate-50 h-full overflow-y-auto">
          <header className="px-1 pt-2"><h2 className="text-2xl font-bold text-slate-900">Services</h2><p className="text-slate-500 text-sm">Essential tools for your trip.</p></header>
          <div className="grid grid-cols-1 gap-4"><button onClick={() => setActiveTab('emergency')} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-3 active:scale-95 transition-transform"><div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center"><ShieldAlert size={28} /></div><span className="font-bold text-slate-800">Emergency Card</span></button></div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-3">Pre-Departure Guide</h3><div className="space-y-3">{db.guides.map((guide) => (<div key={guide.id} onClick={() => setViewingGuide(guide)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"><span className="text-sm font-medium text-slate-700">{guide.title}</span><ChevronRight size={16} className="text-slate-400"/></div>))}{db.guides.length === 0 && (<div className="text-center text-slate-400 py-4 text-xs">No guides available.</div>)}</div></div>
      </div>
    );
  };
  
  const renderEmergencyCard = () => {
    return (
      <div className="flex flex-col h-full bg-slate-50">
          <div className="bg-red-600 text-white p-6 rounded-b-[2.5rem] shadow-lg relative z-10 shrink-0"><div className="flex items-center mb-6"><button onClick={() => setActiveTab('services')} className="mr-3 bg-white/20 p-2 rounded-full backdrop-blur-sm"><ChevronRight className="rotate-180" size={20}/></button><h2 className="text-2xl font-bold">Emergency Card</h2></div><p className="opacity-90 text-sm mb-4">Access these contacts offline.</p></div>
          <div className="flex-1 overflow-y-auto p-5 -mt-6 pt-10 space-y-6">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Local Emergency</h3><div className="space-y-3">{[{ name: 'Police / Ambulance', num: '911' }, { name: 'Chinese Consulate', num: '+1-202-495-2266' }].map(item => (<div key={item.num} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl border border-red-100"><div><div className="font-bold text-slate-800">{item.name}</div><div className="text-red-500 font-mono font-bold">{item.num}</div></div><a href={`tel:${item.num}`} className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"><Phone size={20}/></a></div>))}</div></div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative"><div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Contacts</h3><button onClick={() => editingEmergency ? handleSaveEmergency() : setEditingEmergency(true)} className="text-blue-600 text-xs font-bold">{editingEmergency ? 'Save' : 'Edit'}</button></div><div className="space-y-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-700">Family / Emergency Contact</label><input disabled={!editingEmergency} placeholder="Name" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none" value={emergencyForm.contactName} onChange={e => setEmergencyForm({...emergencyForm, contactName: e.target.value})} /><input disabled={!editingEmergency} placeholder="Phone (+86...)" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none" value={emergencyForm.contactPhone} onChange={e => setEmergencyForm({...emergencyForm, contactPhone: e.target.value})} /></div><div className="w-full h-px bg-slate-100 my-2"></div><div className="space-y-2"><label className="text-xs font-bold text-slate-700">US Employer / Manager</label><input disabled={!editingEmergency} placeholder="Manager Name" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none" value={emergencyForm.managerName} onChange={e => setEmergencyForm({...emergencyForm, managerName: e.target.value})} /><input disabled={!editingEmergency} placeholder="US Phone" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none" value={emergencyForm.managerPhone} onChange={e => setEmergencyForm({...emergencyForm, managerPhone: e.target.value})} /><input disabled={!editingEmergency} placeholder="Email" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none" value={emergencyForm.managerEmail} onChange={e => setEmergencyForm({...emergencyForm, managerEmail: e.target.value})} /></div><div className="w-full h-px bg-slate-100 my-2"></div><div className="space-y-2"><div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-700">Additional Contacts</label>{editingEmergency && (<button onClick={handleAddCustomContact} className="text-xs flex items-center text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded"><Plus size={12} className="mr-1"/> Add</button>)}</div>{emergencyForm.others?.map((contact, idx) => (<div key={contact.id} className="bg-slate-50 p-3 rounded-xl space-y-2 relative">{editingEmergency ? (<><button onClick={() => handleRemoveCustomContact(contact.id)} className="absolute top-2 right-2 text-red-400 p-1"><X size={14}/></button><input placeholder="Name" className="w-full bg-white p-2 rounded-lg text-sm border border-slate-200 outline-none" value={contact.name} onChange={e => handleUpdateCustomContact(contact.id, 'name', e.target.value)} /><div className="flex gap-2"><input placeholder="Phone" className="flex-1 bg-white p-2 rounded-lg text-sm border border-slate-200 outline-none" value={contact.phone} onChange={e => handleUpdateCustomContact(contact.id, 'phone', e.target.value)} /><input placeholder="Role (e.g. Friend)" className="flex-1 bg-white p-2 rounded-lg text-sm border border-slate-200 outline-none" value={contact.role} onChange={e => handleUpdateCustomContact(contact.id, 'role', e.target.value)} /></div></>) : (<div className="flex justify-between items-center"><div><div className="font-bold text-sm text-slate-800">{contact.name}</div><div className="text-xs text-slate-500">{contact.role}</div></div><div className="flex items-center gap-2"><div className="text-right"><div className="text-sm font-bold text-slate-700">{contact.phone}</div></div><a href={`tel:${contact.phone}`} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600"><Phone size={14}/></a></div></div>)}</div>))}{(!emergencyForm.others || emergencyForm.others.length === 0) && !editingEmergency && (<div className="text-center text-xs text-slate-400 py-2">No additional contacts.</div>)}</div></div></div></div></div>
    );
  };
  
  const renderAdminReview = () => {
    const pendingApps = db.applications.filter(a => a.status === 'pending');
    return (
        <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full bg-slate-50">
            <header className="px-1 pt-2"><div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin</div><h2 className="text-2xl font-bold text-slate-900">Application Review</h2></header>
            <div className="space-y-4">{pendingApps.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-slate-400"><CheckCircle2 size={48} className="mb-4 opacity-20"/><p>All caught up! No pending applications.</p></div>) : (pendingApps.map(app => { const job = db.jobs.find(j => j.id === app.jobId); const student = db.users.find(u => u.id === app.studentId); if (!job || !student) return null; return (<div key={app.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5"><div className="flex items-center mb-4 pb-4 border-b border-slate-50"><img src={student.avatar} className="w-12 h-12 rounded-full mr-3 bg-slate-100" alt={student.name}/><div><h3 className="font-bold text-slate-800">{student.name}</h3><div className="text-xs text-slate-500">{student.school} · Score: {student.score}</div></div><div className="ml-auto text-xs text-slate-400">{new Date(app.timestamp).toLocaleDateString()}</div></div><div className="bg-slate-50 rounded-xl p-3 mb-4"><div className="text-xs text-slate-400 uppercase font-bold mb-1">Applying For</div><div className="font-bold text-slate-700">{job.title}</div></div><div className="flex gap-3"><button onClick={() => handleAdminAction(app.id, 'rejected')} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50">Reject</button><button onClick={() => handleAdminAction(app.id, 'approved')} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700">Approve</button></div></div>); }))}</div>
        </div>
    );
  };

  const renderPostJob = () => {
      return (
      <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full bg-slate-50">
          <header className="px-1 pt-2"><h2 className="text-2xl font-bold text-slate-900">New Position</h2></header>
          <div className="space-y-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title</label><input value={newJob.title || ''} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. Resort Lifeguard" className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 outline-none" /></div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><CalendarDays size={16} className="mr-2 text-blue-500"/> Program Details</h3>
                   <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Program Year</label><div className="relative"><select value={newJob.programYear} onChange={e => setNewJob({...newJob, programYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-3 px-3 rounded-xl outline-none appearance-none">{['2023','2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}</select><ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16}/></div></div>
                       <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Housing Cost</label><input className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-3 px-3 rounded-xl outline-none focus:border-blue-500 transition-colors" value={newJob.housing || ''} placeholder="$150/wk" onChange={e => setNewJob({...newJob, housing: e.target.value})} /></div>
                       <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Dates</label><input className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-3 px-3 rounded-xl outline-none focus:border-blue-500 transition-colors" value={newJob.startDateRange || ''} placeholder="Jun 15 - Jun 30" onChange={e => setNewJob({...newJob, startDateRange: e.target.value})} /></div>
                       <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label><div className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm font-bold py-3 px-3 rounded-xl select-none">Sept 15, {newJob.programYear}</div></div>
                   </div>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-h-[200px]"><div className="flex justify-between mb-2"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Max 5000)</label><span className="text-[10px] text-slate-400">{(newJob.description || '').length}/5000</span></div><textarea value={newJob.description || ''} onChange={e => setNewJob({...newJob, description: e.target.value})} maxLength={5000} className="w-full text-sm text-slate-600 outline-none resize-none h-64 leading-relaxed" placeholder="Enter full job details here..." /></div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cover Image</label>{newJob.image ? (<div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 group"><img src={newJob.image} className="w-full h-full object-cover" alt="Preview" /><button onClick={() => setNewJob({...newJob, image: ''})} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"><X size={16} /></button></div>) : (<div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 mb-3"><ImageIcon size={32} className="mb-2 opacity-50"/><span className="text-xs font-bold">No Image Selected</span></div>)}<div className="flex gap-2 mb-3"><label className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"><Upload size={16} className="mr-2"/> Upload<input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} /></label></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><LinkIcon size={14}/></span><input className="w-full bg-slate-50 pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-colors" placeholder="Or paste image URL..." value={newJob.image?.startsWith('data:') ? '' : newJob.image || ''} onChange={e => setNewJob({...newJob, image: e.target.value})} /></div></div>
               <div className="grid grid-cols-2 gap-4"><div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-xs text-slate-400 block mb-1">Location</label><input className="w-full text-sm font-semibold outline-none" value={newJob.location || ''} onChange={e => setNewJob({...newJob, location: e.target.value})} /></div><div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-xs text-slate-400 block mb-1">Salary</label><input className="w-full text-sm font-semibold outline-none" value={newJob.salary || ''} placeholder="$15/hr" onChange={e => setNewJob({...newJob, salary: e.target.value})} /></div><div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-xs text-slate-400 block mb-1">Capacity</label><input type="number" className="w-full text-sm font-semibold outline-none" value={newJob.capacity || ''} onChange={e => setNewJob({...newJob, capacity: Number(e.target.value)})} /></div><div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-xs text-slate-400 block mb-1">Min Score</label><input type="number" className="w-full text-sm font-semibold outline-none" value={newJob.minScore || ''} onChange={e => setNewJob({...newJob, minScore: Number(e.target.value)})} /></div></div>
               <button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform">Post Job</button>
          </div>
      </div>
      );
  };

  const renderProfile = () => {
      if (!db.currentUser) return null;
      const isEditing = !!editingProfile;
      const user = (isEditing && editingProfile) ? { ...db.currentUser, ...editingProfile } : db.currentUser;
      return (
          <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto bg-slate-50">
              <header className="px-1 pt-2 flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-900">Profile</h2>{isEditing ? (<div className="flex space-x-2"><button onClick={() => setEditingProfile(null)} className="p-2 bg-white rounded-full text-slate-400 shadow-sm"><X size={20}/></button><button onClick={handleSaveProfile} className="p-2 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-200"><Save size={20}/></button></div>) : (<button onClick={() => setEditingProfile({})} className="p-2 bg-white rounded-full text-slate-600 shadow-sm"><Edit2 size={20}/></button>)}</header>
              <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden"><div className="w-full h-24 bg-gradient-to-r from-blue-500 to-cyan-400 absolute top-0 left-0 opacity-10"></div><img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4 relative z-10 bg-slate-100" alt="Avatar"/>{isEditing ? (<input className="text-center font-bold text-xl text-slate-800 border-b border-blue-200 outline-none bg-transparent mb-1" value={user.name} onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} />) : (<h3 className="font-bold text-xl text-slate-800 mb-1">{user.name}</h3>)}<p className="text-sm text-slate-500 mb-4">{user.school}</p><div className="flex w-full space-x-3"><div className="flex-1 bg-blue-50 rounded-2xl p-3 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-blue-600">{user.score}</span><span className="text-xs text-blue-400 uppercase font-bold tracking-wider">Score</span></div><div className="flex-1 bg-purple-50 rounded-2xl p-3 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-purple-600">{db.applications.filter(a => a.studentId === user.id).length}</span><span className="text-xs text-purple-400 uppercase font-bold tracking-wider">Applied</span></div></div></div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"><div className="flex items-center space-x-2 mb-4"><Video className="text-pink-500" size={20}/><h3 className="font-bold text-slate-800">Video Resume</h3></div>{generatedVideoUrl ? (<div className="rounded-xl overflow-hidden bg-black aspect-[9/16] relative group"><video src={generatedVideoUrl} controls className="w-full h-full object-cover"/><button onClick={() => setGeneratedVideoUrl(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"><X size={16}/></button></div>) : (<div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200"><p className="text-xs text-slate-400 mb-3">Generate a creative AI video intro.</p><button onClick={handleGeneratePromoVideo} disabled={isVideoGenerating} className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 flex items-center justify-center mx-auto">{isVideoGenerating ? <Loader2 className="animate-spin mr-2" size={16}/> : <PlayCircle className="mr-2" size={16}/>} Generate with Veo</button></div>)}</div>
              <button onClick={() => setActiveTab('login')} className="w-full bg-slate-100 text-slate-400 py-3 rounded-2xl text-sm font-bold flex items-center justify-center"><LogOut size={16} className="mr-2"/> Log Out</button>
          </div>
      );
  };

  const renderJobDetail = () => {
    if (!selectedJobId) return null;
    const job = db.jobs.find(j => j.id === selectedJobId);
    if (!job) return null;
    const canApply = (db.currentUser?.score || 0) >= job.minScore;
    const isApplied = db.applications.some(a => a.jobId === job.id && a.studentId === db.currentUser?.id);

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
             {/* Huge Watermark Layer - Background */}
             <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-5">
                 <div className="-rotate-45 transform">
                     <div className="text-6xl font-black text-slate-900 whitespace-nowrap mb-4">Blueprint Global Exchange</div>
                     <div className="text-8xl font-black text-slate-900 whitespace-nowrap text-center">蓝途国际</div>
                 </div>
             </div>

             <div className="h-64 relative shrink-0 z-10">
                 <img src={job.image} className="w-full h-full object-cover" alt={job.title}/>
                 <button onClick={() => setSelectedJobId(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-10"><ChevronRight className="rotate-180" size={24}/></button>
                 {/* ENGLISH WATERMARK AS REQUESTED */}
                 <div className="absolute top-20 right-[-20px] z-20 pointer-events-none opacity-30 rotate-[-15deg]">
                    <div className="text-4xl font-black text-white tracking-tighter border-4 border-white p-2 rounded-xl">
                        BLUEPRINT
                        <div className="text-sm tracking-[0.5em] text-center">GLOBAL</div>
                    </div>
                 </div>
                 <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
             </div>
             <div className="flex-1 px-6 -mt-12 relative overflow-y-auto pb-24 z-10">
                 <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-1 mb-4">
                     <div className="flex justify-between items-start mb-2"><div className="flex flex-wrap gap-2">{job.tags.map(t => <span key={t} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">{t}</span>)}<span className="px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg">{job.programYear} Program</span></div></div>
                     <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{job.title}</h1>
                     <div className="flex items-center text-slate-500 font-medium text-sm mb-6"><Building2 size={16} className="mr-1"/> {job.company}</div>
                     <div className="grid grid-cols-2 gap-3 mb-6"><div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><div className="text-slate-400 text-xs font-bold uppercase mb-1">Salary</div><div className="text-slate-800 font-bold">{job.salary}</div></div><div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><div className="text-slate-400 text-xs font-bold uppercase mb-1">Housing</div><div className="text-slate-800 font-bold truncate">{job.housing || 'N/A'}</div></div><div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between"><div><div className="text-slate-400 text-xs font-bold uppercase mb-1">Start Dates</div><div className="text-slate-800 font-bold">{job.startDateRange}</div></div><div className="text-right"><div className="text-slate-400 text-xs font-bold uppercase mb-1">End Date</div><div className="text-slate-800 font-bold">{job.endDate}</div></div></div><div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2"><div className="text-slate-400 text-xs font-bold uppercase mb-1">Location</div><div className="text-slate-800 font-bold flex items-start"><MapPin size={14} className="mr-1 mt-0.5 shrink-0"/> {job.location}</div></div></div>
                     <h3 className="font-bold text-lg text-slate-800 mb-3">Job Description</h3>
                     <div className="prose prose-slate prose-sm text-slate-600 mb-10 leading-relaxed"><ReactMarkdown>{job.description}</ReactMarkdown></div>
                 </div>
             </div>
             <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-slate-100 p-4 safe-area-pb z-20">
                 {isApplied ? (<button disabled className="w-full bg-green-100 text-green-700 font-bold py-4 rounded-2xl flex items-center justify-center"><CheckCircle2 size={20} className="mr-2"/> Applied</button>) : canApply ? (<button onClick={() => handleApply(job.id)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center relative overflow-hidden"><span className="relative z-10">Apply Now</span></button>) : (<button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center">Score {job.minScore} Required</button>)}
             </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 mx-auto max-w-md shadow-2xl relative">
      <main className="flex-1 relative overflow-hidden">
        {!db.currentUser ? renderAuth() : (
             <>
                {activeTab === 'jobs' && renderStudentJobs()}
                {activeTab === 'applications' && renderApplications()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'services' && renderStudentServices()}
                {activeTab === 'emergency' && renderEmergencyCard()}
                {activeTab === 'admin-home' && renderAdminHome()}
                {activeTab === 'admin-students' && renderAdminStudents()}
                {activeTab === 'admin-job-detail' && renderAdminJobDetail()}
                {activeTab === 'admin-review' && renderAdminReview()}
                {activeTab === 'post-job' && renderPostJob()}
                {activeTab === 'admin-guides' && renderAdminGuides()}
             </>
        )}
      </main>
      {selectedJobId && renderJobDetail()}
      {viewingStudent && renderStudentModal()}
      {editingGuide && renderGuideEditor()}
      {viewingGuide && renderGuideDetail()}
      {db.currentUser && !selectedJobId && !adminDetailJobId && activeTab !== 'emergency' && (<TabBar role={db.currentUser.role} activeTab={activeTab === 'emergency' ? 'services' : activeTab} onTabChange={setActiveTab} />)}
    </div>
  );
};

export default App;
