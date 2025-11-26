
import React, { useState } from 'react';
import { User as UserType, Job, Application, DbState, Role } from './types';
import TabBar from './components/TabBar';
import { generateJobDescription, generateCoverImage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, MapPin, CheckCircle2, Search, Loader2, 
  ChevronRight, LogOut, GraduationCap, Star, Trash2, 
  Users, DollarSign, Briefcase, Edit2, Save, X, ImagePlus, XCircle,
  Smartphone, ShieldCheck, Building2, User, Video, PlayCircle, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Removed conflicting window.aistudio declaration to resolve Type errors.
// We will access window.aistudio via type assertion in handleGeneratePromoVideo.

// --- 品牌水印组件 ---
const BrandingWatermark = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center justify-center opacity-30 pointer-events-none py-6 select-none ${className}`}>
     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
        Blueprint Global Exchange | 蓝途
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
    capacity: 10
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
    capacity: 5
  },
  { 
    id: 'j3', 
    title: 'Housekeeping (客房服务)', 
    company: 'Grand Teton Lodge', 
    location: 'Jackson Hole, WY', 
    salary: '$15.00/hr + Tips', 
    minScore: 8, 
    description: 'Work in one of the most beautiful national parks. Employee housing and meal plan included.', 
    tags: ['Hospitality', 'National Park'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: 20
  },
];

const INITIAL_USERS: UserType[] = [
  { id: 'u1', name: 'Admin', role: 'admin', score: 10, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin' },
  { id: 'u2', name: '李明', role: 'student', score: 7.5, school: '上海交通大学', phone: '13800138000', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LiMing' },
];

const App: React.FC = () => {
  // --- 数据库状态 ---
  const [db, setDb] = useState<DbState>({
    users: INITIAL_USERS,
    jobs: INITIAL_JOBS,
    applications: [],
    currentUser: null,
  });

  // --- UI 状态 ---
  const [activeTab, setActiveTab] = useState<string>('login'); // login | register | jobs ...
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  // 注册表单状态
  const [regForm, setRegForm] = useState({ name: '', phone: '', code: '', school: '', score: '6.0' });
  const [isCodeSent, setIsCodeSent] = useState(false);

  // 发布岗位表单状态
  const [newJob, setNewJob] = useState<Partial<Job>>({ title: '', minScore: 6, location: 'USA', salary: '', tags: [], capacity: 5 });
  
  // 个人中心编辑状态
  const [editingProfile, setEditingProfile] = useState<Partial<UserType> | null>(null);
  
  // AI 状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImgGenerating, setIsImgGenerating] = useState(false);
  
  // 视频生成状态
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // --- 核心业务逻辑 (API 模拟) ---

  // 1. 登录
  const handleLogin = (role: Role) => {
    if (role === 'admin') {
      const admin = db.users.find(u => u.role === 'admin');
      if (admin) {
          setDb(prev => ({ ...prev, currentUser: admin }));
          setActiveTab('admin-home');
      }
    } else {
      // 模拟学生登录，这里简化为直接登录第一个学生
      const student = db.users.find(u => u.role === 'student'); 
      if (student) {
          setDb(prev => ({ ...prev, currentUser: student }));
          setActiveTab('jobs');
      }
    }
  };

  // 2. 注册流程
  const handleSendCode = () => {
      if(regForm.phone.length !== 11) {
          alert("请输入正确的11位手机号");
          return;
      }
      setIsCodeSent(true);
      alert("模拟验证码已发送: 1234");
  };

  const handleRegister = () => {
    // 基础校验
    if (!regForm.name || !regForm.school || !regForm.score) {
        alert("请完善所有信息");
        return;
    }
    if (regForm.code !== '1234') {
        alert("验证码错误 (请输入 1234)");
        return;
    }
    
    // 写入数据库
    const newStudent: UserType = {
      id: `u${Date.now()}`,
      name: regForm.name,
      school: regForm.school,
      phone: regForm.phone,
      role: 'student',
      score: parseFloat(regForm.score),
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${regForm.name}`
    };

    setDb(prev => ({ 
      ...prev, 
      users: [...prev.users, newStudent],
      currentUser: newStudent 
    }));
    
    // 重置表单并跳转
    setRegForm({ name: '', phone: '', code: '', school: '', score: '6.0' });
    setIsCodeSent(false);
    setActiveTab('jobs');
  };

  // 3. 岗位申请流程
  const handleApply = (jobId: string) => {
    if (!db.currentUser) return;
    
    const hasApplied = db.applications.some(a => a.jobId === jobId && a.studentId === db.currentUser?.id);
    if (hasApplied) {
        alert("您已申请过该岗位，请勿重复提交。");
        return;
    }

    const newApp: Application = {
      id: `app${Date.now()}`,
      jobId,
      studentId: db.currentUser.id,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    setDb(prev => ({ ...prev, applications: [...prev.applications, newApp] }));
    alert('✅ 申请提交成功！请等待蓝途顾问审核。');
    setSelectedJobId(null);
  };

  // 4. 管理员审核操作
  const handleAdminAction = (appId: string, action: 'approved' | 'rejected') => {
    setDb(prev => ({
      ...prev,
      applications: prev.applications.map(app => 
        app.id === appId ? { ...app, status: action } : app
      )
    }));
  };

  // 5. 发布岗位 & AI
  const handlePostJob = () => {
    if (!newJob.title || !newJob.description) {
        alert("请填写完整岗位信息");
        return;
    }
    const job: Job = {
      id: `j${Date.now()}`,
      title: newJob.title!,
      company: 'SWT Partner Employer',
      location: newJob.location || 'USA',
      salary: newJob.salary || '$12/hr',
      minScore: newJob.minScore || 6,
      description: newJob.description!,
      tags: newJob.tags?.length ? newJob.tags : ['Summer Job'],
      image: newJob.image || 'https://via.placeholder.com/400x300',
      capacity: newJob.capacity || 5
    };
    setDb(prev => ({ ...prev, jobs: [job, ...prev.jobs] }));
    setActiveTab('admin-home');
    setNewJob({ title: '', minScore: 6, location: 'USA', salary: '', tags: [], capacity: 5 });
  };

  const handleAiGenerateDesc = async () => {
    if (!newJob.title) return;
    setIsGenerating(true);
    try {
      const desc = await generateJobDescription(newJob.title, `${newJob.location}, Capacity: ${newJob.capacity}`);
      setNewJob(prev => ({ ...prev, description: desc }));
    } catch (e) {
      alert('AI 生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGenerateImage = async () => {
      if (!newJob.title) return;
      setIsImgGenerating(true);
      try {
        const img = await generateCoverImage(newJob.title + " " + (newJob.tags?.[0] || ''));
        if(img) setNewJob(prev => ({ ...prev, image: img }));
      } catch (e) {
          alert('AI 生成失败');
      } finally {
          setIsImgGenerating(false);
      }
  };
  
  // 6. 视频生成 (Veo)
  const handleGeneratePromoVideo = async () => {
    // Fixed: Use type assertion to access window.aistudio without conflicting declaration
    const aistudio = (window as any).aistudio;
    if (aistudio && !await aistudio.hasSelectedApiKey()) {
        await aistudio.openSelectKey();
    }
    
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: 'A cinematic, high-energy promotional video for "Blueprint Global Exchange" student travel program. Scenes of happy diverse students in American cities, working in summer jobs, national parks, beach resorts. Sunny, bright, 4k resolution, upbeat vibe.',
          config: {
            numberOfVideos: 1,
            resolution: '1080p', 
            aspectRatio: '9:16'
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setGeneratedVideoUrl(url);
        }

    } catch (e) {
        console.error("Video Gen Error", e);
        alert("视频生成失败，请重试或检查 API Key。");
    } finally {
        setIsVideoGenerating(false);
    }
  };

  // --- 辅助函数 ---
  const getJobApplicantCount = (jobId: string) => db.applications.filter(a => a.jobId === jobId).length;
  const handleDeleteJob = (id: string) => setDb(prev => ({ ...prev, jobs: prev.jobs.filter(j => j.id !== id) }));
  const handleSaveProfile = () => {
      if (!editingProfile || !db.currentUser) return;
      const updatedUser = { ...db.currentUser, ...editingProfile };
      setDb(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u),
          currentUser: updatedUser
      }));
      setEditingProfile(null);
  };

  // --- 页面渲染 ---

  // RENDER: 登录 / 注册
  const renderAuth = () => {
    const isRegister = activeTab === 'register';

    return (
      <div className="flex flex-col h-full bg-blue-50 overflow-y-auto">
        <div className="flex-1 p-8 flex flex-col justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6 mx-auto">
                <span className="text-4xl text-white">✈️</span>
            </div>
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-slate-900">Blueprint Global Exchange</h1>
                <p className="text-blue-600 font-medium">蓝途国际 · 赴美带薪实习</p>
            </div>

            {isRegister ? (
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
                     <h2 className="text-lg font-bold text-slate-800 mb-2">学生注册</h2>
                     
                     <div className="space-y-3">
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                             <User size={18} className="text-gray-400 mr-3"/>
                             <input className="bg-transparent outline-none text-sm w-full" placeholder="真实姓名" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})}/>
                         </div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                             <Building2 size={18} className="text-gray-400 mr-3"/>
                             <input className="bg-transparent outline-none text-sm w-full" placeholder="就读学校" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})}/>
                         </div>
                         <div className="flex space-x-2">
                            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                                <Smartphone size={18} className="text-gray-400 mr-3"/>
                                <input className="bg-transparent outline-none text-sm w-full" placeholder="手机号" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})}/>
                            </div>
                            <button onClick={handleSendCode} disabled={isCodeSent} className="bg-blue-100 text-blue-700 px-3 rounded-xl text-xs font-bold whitespace-nowrap">
                                {isCodeSent ? '已发送' : '验证码'}
                            </button>
                         </div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                             <ShieldCheck size={18} className="text-gray-400 mr-3"/>
                             <input className="bg-transparent outline-none text-sm w-full" placeholder="验证码 (1234)" value={regForm.code} onChange={e => setRegForm({...regForm, code: e.target.value})}/>
                         </div>
                         <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-colors">
                             <Star size={18} className="text-gray-400 mr-3"/>
                             <input type="number" step="0.5" max="10" className="bg-transparent outline-none text-sm w-full" placeholder="预估英语评分 (6-10)" value={regForm.score} onChange={e => setRegForm({...regForm, score: e.target.value})}/>
                         </div>
                     </div>

                     <button 
                        onClick={handleRegister}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-2"
                     >
                        立即注册
                     </button>
                     <button onClick={() => setActiveTab('login')} className="w-full text-slate-400 text-xs py-2">返回登录</button>
                </div>
            ) : (
                <div className="space-y-3">
                    <button 
                    onClick={() => handleLogin('student')}
                    className="w-full bg-white text-slate-700 py-4 rounded-2xl font-bold shadow-sm border border-slate-100 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                        <span>学生一键登录 (演示)</span>
                    </button>
                    <button 
                    onClick={() => setActiveTab('register')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        注册新账号
                    </button>
                    <button 
                    onClick={() => handleLogin('admin')}
                    className="w-full text-slate-400 text-sm py-4 hover:text-slate-600"
                    >
                        管理员入口
                    </button>
                </div>
            )}
        </div>
        
        <BrandingWatermark />
      </div>
    );
  };

  // RENDER: 学生端 - 岗位列表
  const renderStudentJobs = () => (
    <div className="p-4 space-y-5 pb-24">
      <header className="flex justify-between items-end px-1 pt-2">
         <div>
            <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1">Blueprint Exchange</div>
            <h2 className="text-2xl font-bold text-slate-800">岗位精选</h2>
         </div>
         <div className="bg-white text-blue-700 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center shadow-sm border border-blue-50">
            <Star size={14} className="mr-1 fill-blue-700"/>
            学分: {db.currentUser?.score}
         </div>
      </header>
      
      {/* 搜索 */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center text-slate-400">
        <Search size={20} className="mr-3 ml-1"/>
        <input 
            className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400" 
            placeholder="搜索岗位、州..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {db.jobs
            .filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.location.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(job => {
            const canApply = (db.currentUser?.score || 0) >= job.minScore;
            const appliedCount = getJobApplicantCount(job.id);
            const isFull = appliedCount >= job.capacity;

            return (
            <div key={job.id} onClick={() => setSelectedJobId(job.id)} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group">
                <div className="h-32 bg-gray-200 relative">
                    <img src={job.image} className="w-full h-full object-cover" alt={job.title} />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 flex items-center shadow-sm">
                        <MapPin size={10} className="mr-1"/> {job.location}
                    </div>
                    {!canApply && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold backdrop-blur-[2px]">
                            <span className="flex items-center"><XCircle size={16} className="mr-2"/> 需学分 {job.minScore}</span>
                        </div>
                    )}
                    {isFull && canApply && (
                        <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-white font-bold backdrop-blur-[2px]">
                            <span className="flex items-center">名额已满</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{job.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{job.salary}</div>
                        <div className="flex items-center text-xs text-slate-400">
                            <Users size={12} className="mr-1"/> {appliedCount}/{job.capacity}
                        </div>
                    </div>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );

  // RENDER: Admin - Home (Dashboard)
  const renderAdminHome = () => (
    <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full">
        <header className="px-1 pt-2">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Console</div>
            <h2 className="text-2xl font-bold text-slate-900">Job Management</h2>
        </header>

        <div className="space-y-4">
            {db.jobs.map(job => {
                const applicants = db.applications.filter(a => a.jobId === job.id).length;
                return (
                    <div key={job.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex gap-4 relative">
                        <img src={job.image} className="w-20 h-20 rounded-xl object-cover" alt={job.title} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800 truncate pr-8">{job.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{job.company}</p>
                            <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Score {job.minScore}+</span>
                                <span className={`text-xs px-2 py-1 rounded-lg flex items-center ${applicants >= job.capacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <Users size={12} className="mr-1"/> {applicants}/{job.capacity}
                                </span>
                            </div>
                        </div>
                        {/* Delete Button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
                                    handleDeleteJob(job.id);
                                }
                            }}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Delete Job"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            })}
            {db.jobs.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No jobs posted yet.</div>
            )}
        </div>
    </div>
  );

  // RENDER: Admin - Review
  const renderAdminReview = () => {
    const pendingApps = db.applications.filter(a => a.status === 'pending');
    
    return (
        <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full">
            <header className="px-1 pt-2">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Console</div>
                <h2 className="text-2xl font-bold text-slate-900">Application Review</h2>
            </header>

            <div className="space-y-4">
                {pendingApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <CheckCircle2 size={48} className="mb-4 opacity-20"/>
                        <p>All caught up! No pending applications.</p>
                    </div>
                ) : (
                    pendingApps.map(app => {
                        const job = db.jobs.find(j => j.id === app.jobId);
                        const student = db.users.find(u => u.id === app.studentId);
                        if (!job || !student) return null;

                        return (
                            <div key={app.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5">
                                <div className="flex items-center mb-4 pb-4 border-b border-slate-50">
                                    <img src={student.avatar} className="w-12 h-12 rounded-full mr-3 bg-slate-100" alt={student.name}/>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{student.name}</h3>
                                        <div className="text-xs text-slate-500">{student.school} · Score: {student.score}</div>
                                    </div>
                                    <div className="ml-auto text-xs text-slate-400">{new Date(app.timestamp).toLocaleDateString()}</div>
                                </div>
                                
                                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Applying For</div>
                                    <div className="font-bold text-slate-700">{job.title}</div>
                                    <div className="text-xs text-slate-500">{job.company}</div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleAdminAction(app.id, 'rejected')}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => handleAdminAction(app.id, 'approved')}
                                        className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  };

  // RENDER: Admin - Post Job
  const renderPostJob = () => (
      <div className="p-4 space-y-5 pb-24 overflow-y-auto h-full">
          <header className="px-1 pt-2">
            <h2 className="text-2xl font-bold text-slate-900">New Position</h2>
          </header>

          <div className="space-y-4">
               {/* Job Title Input */}
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
                   <input 
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                      placeholder="e.g. Resort Lifeguard"
                      className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 outline-none"
                   />
               </div>

               {/* AI Generators */}
               <div className="flex gap-3">
                   <button 
                      onClick={handleAiGenerateDesc}
                      disabled={isGenerating || !newJob.title}
                      className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl text-xs font-bold flex items-center justify-center border border-emerald-100 active:scale-95 transition-transform"
                   >
                       {isGenerating ? <Loader2 className="animate-spin mr-2" size={14}/> : <Sparkles className="mr-2" size={14}/>}
                       AI Description
                   </button>
                   <button 
                      onClick={handleAiGenerateImage}
                      disabled={isImgGenerating || !newJob.title}
                      className="flex-1 bg-purple-50 text-purple-700 py-3 rounded-xl text-xs font-bold flex items-center justify-center border border-purple-100 active:scale-95 transition-transform"
                   >
                       {isImgGenerating ? <Loader2 className="animate-spin mr-2" size={14}/> : <ImagePlus className="mr-2" size={14}/>}
                       AI Cover
                   </button>
               </div>

               {/* Description Editor */}
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-h-[150px]">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                   <textarea 
                      value={newJob.description || ''}
                      onChange={e => setNewJob({...newJob, description: e.target.value})}
                      className="w-full text-sm text-slate-600 outline-none resize-none h-40"
                      placeholder="Job details will appear here..."
                   />
               </div>
               
               {/* Cover Image Preview */}
               {newJob.image && (
                   <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <img src={newJob.image} className="w-full h-40 object-cover rounded-xl" alt="Preview" />
                   </div>
               )}

               {/* Other Fields */}
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <label className="text-xs text-slate-400 block mb-1">Location</label>
                        <input className="w-full text-sm font-semibold" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <label className="text-xs text-slate-400 block mb-1">Salary</label>
                        <input className="w-full text-sm font-semibold" value={newJob.salary} placeholder="$15/hr" onChange={e => setNewJob({...newJob, salary: e.target.value})} />
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <label className="text-xs text-slate-400 block mb-1">Min Score</label>
                        <input type="number" className="w-full text-sm font-semibold" value={newJob.minScore} onChange={e => setNewJob({...newJob, minScore: Number(e.target.value)})} />
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <label className="text-xs text-slate-400 block mb-1">Capacity</label>
                        <input type="number" className="w-full text-sm font-semibold" value={newJob.capacity} onChange={e => setNewJob({...newJob, capacity: Number(e.target.value)})} />
                   </div>
               </div>

               <button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform">
                   Post Job
               </button>
          </div>
      </div>
  );

  // RENDER: Applications (Student)
  const renderApplications = () => {
      const myApps = db.applications.filter(a => a.studentId === db.currentUser?.id);

      return (
        <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto">
            <header className="px-1 pt-2">
                <h2 className="text-2xl font-bold text-slate-900">My Applications</h2>
            </header>
            <div className="space-y-4">
                {myApps.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No applications yet.</div>
                ) : (
                    myApps.map(app => {
                        const job = db.jobs.find(j => j.id === app.jobId);
                        if (!job) return null;
                        
                        const statusColors = {
                            pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
                            approved: 'bg-green-50 text-green-600 border-green-100',
                            rejected: 'bg-red-50 text-red-600 border-red-100'
                        };

                        return (
                            <div key={app.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{job.title}</h3>
                                        <p className="text-xs text-slate-500">{job.company}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColors[app.status]}`}>
                                        {app.status.toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50">
                                    <Clock size={12} className="mr-1"/>
                                    Applied on {new Date(app.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      );
  };

  // RENDER: Profile (Student)
  const renderProfile = () => {
      if (!db.currentUser) return null;
      const isEditing = !!editingProfile;
      const user = isEditing ? { ...db.currentUser, ...editingProfile } : db.currentUser;

      return (
          <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto bg-slate-50">
              <header className="px-1 pt-2 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
                  {isEditing ? (
                      <div className="flex space-x-2">
                        <button onClick={() => setEditingProfile(null)} className="p-2 bg-white rounded-full text-slate-400 shadow-sm"><X size={20}/></button>
                        <button onClick={handleSaveProfile} className="p-2 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-200"><Save size={20}/></button>
                      </div>
                  ) : (
                      <button onClick={() => setEditingProfile({})} className="p-2 bg-white rounded-full text-slate-600 shadow-sm"><Edit2 size={20}/></button>
                  )}
              </header>

              <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
                   <div className="w-full h-24 bg-gradient-to-r from-blue-500 to-cyan-400 absolute top-0 left-0 opacity-10"></div>
                   <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4 relative z-10 bg-slate-100" alt="Avatar"/>
                   {isEditing ? (
                       <input className="text-center font-bold text-xl text-slate-800 border-b border-blue-200 outline-none bg-transparent mb-1" value={user.name} onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} />
                   ) : (
                       <h3 className="font-bold text-xl text-slate-800 mb-1">{user.name}</h3>
                   )}
                   <p className="text-sm text-slate-500 mb-4">{user.school}</p>
                   
                   <div className="flex w-full space-x-3">
                       <div className="flex-1 bg-blue-50 rounded-2xl p-3 flex flex-col items-center justify-center">
                           <span className="text-2xl font-bold text-blue-600">{user.score}</span>
                           <span className="text-xs text-blue-400 uppercase font-bold tracking-wider">Score</span>
                       </div>
                       <div className="flex-1 bg-purple-50 rounded-2xl p-3 flex flex-col items-center justify-center">
                           <span className="text-2xl font-bold text-purple-600">{db.applications.filter(a => a.studentId === user.id).length}</span>
                           <span className="text-xs text-purple-400 uppercase font-bold tracking-wider">Applied</span>
                       </div>
                   </div>
              </div>

              {/* Video Generation for Profile */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                   <div className="flex items-center space-x-2 mb-4">
                       <Video className="text-pink-500" size={20}/>
                       <h3 className="font-bold text-slate-800">My Video Resume</h3>
                   </div>
                   
                   {generatedVideoUrl ? (
                       <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] relative group">
                           <video src={generatedVideoUrl} controls className="w-full h-full object-cover"/>
                           <button onClick={() => setGeneratedVideoUrl(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"><X size={16}/></button>
                       </div>
                   ) : (
                       <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                           <p className="text-xs text-slate-400 mb-3">Generate a creative AI video intro for employers.</p>
                           <button 
                                onClick={handleGeneratePromoVideo}
                                disabled={isVideoGenerating}
                                className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 flex items-center justify-center mx-auto"
                           >
                                {isVideoGenerating ? <Loader2 className="animate-spin mr-2" size={16}/> : <PlayCircle className="mr-2" size={16}/>}
                                Generate with Veo
                           </button>
                       </div>
                   )}
              </div>

              <button onClick={() => setActiveTab('login')} className="w-full bg-slate-100 text-slate-400 py-3 rounded-2xl text-sm font-bold flex items-center justify-center">
                  <LogOut size={16} className="mr-2"/> Log Out
              </button>
          </div>
      );
  };

  // RENDER: Job Detail View (Modal)
  const renderJobDetail = () => {
    if (!selectedJobId) return null;
    const job = db.jobs.find(j => j.id === selectedJobId);
    if (!job) return null;

    const canApply = (db.currentUser?.score || 0) >= job.minScore;
    const isApplied = db.applications.some(a => a.jobId === job.id && a.studentId === db.currentUser?.id);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
             {/* Header Image */}
             <div className="h-64 relative shrink-0">
                 <img src={job.image} className="w-full h-full object-cover" alt={job.title}/>
                 <button onClick={() => setSelectedJobId(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-10">
                     <ChevronRight className="rotate-180" size={24}/>
                 </button>
                 <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
             </div>

             {/* Content */}
             <div className="flex-1 px-6 -mt-12 relative overflow-y-auto pb-24">
                 <div className="bg-white rounded-3xl p-1 mb-4">
                     <div className="flex flex-wrap gap-2 mb-3">
                         {job.tags.map(t => <span key={t} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">{t}</span>)}
                     </div>
                     <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">{job.title}</h1>
                     <div className="flex items-center text-slate-500 font-medium text-sm mb-6">
                         <Building2 size={16} className="mr-1"/> {job.company}
                     </div>

                     <div className="grid grid-cols-2 gap-3 mb-8">
                         <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <div className="text-slate-400 text-xs font-bold uppercase mb-1">Salary</div>
                             <div className="text-slate-800 font-bold">{job.salary}</div>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <div className="text-slate-400 text-xs font-bold uppercase mb-1">Location</div>
                             <div className="text-slate-800 font-bold truncate">{job.location}</div>
                         </div>
                     </div>

                     <h3 className="font-bold text-lg text-slate-800 mb-3">Job Description</h3>
                     <div className="prose prose-slate prose-sm text-slate-600 mb-10">
                         <ReactMarkdown>{job.description}</ReactMarkdown>
                     </div>
                 </div>
             </div>

             {/* Bottom Action Bar */}
             <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 p-4 safe-area-pb">
                 {isApplied ? (
                     <button disabled className="w-full bg-green-100 text-green-700 font-bold py-4 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={20} className="mr-2"/> Applied
                     </button>
                 ) : canApply ? (
                     <button onClick={() => handleApply(job.id)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center">
                        Apply Now
                     </button>
                 ) : (
                     <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center">
                        Score {job.minScore} Required
                     </button>
                 )}
             </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 mx-auto max-w-md shadow-2xl relative">
      {/* Dynamic Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {!db.currentUser ? (
             renderAuth()
        ) : (
             <>
                {activeTab === 'jobs' && renderStudentJobs()}
                {activeTab === 'applications' && renderApplications()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'admin-home' && renderAdminHome()}
                {activeTab === 'admin-review' && renderAdminReview()}
                {activeTab === 'post-job' && renderPostJob()}
             </>
        )}
      </main>
      
      {/* Job Detail Modal */}
      {selectedJobId && renderJobDetail()}

      {/* Tab Bar (Navigation) */}
      {db.currentUser && !selectedJobId && (
        <TabBar 
            role={db.currentUser.role} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
        />
      )}
    </div>
  );
};

export default App;
