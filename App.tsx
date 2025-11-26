
import React, { useState } from 'react';
import { User as UserType, Job, Application, DbState, Role } from './types';
import TabBar from './components/TabBar';
import { generateJobDescription, generateCoverImage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, MapPin, CheckCircle2, Search, Loader2, 
  ChevronRight, LogOut, GraduationCap, Star, Trash2, 
  Users, DollarSign, Briefcase, Edit2, Save, X, ImagePlus, XCircle,
  Smartphone, ShieldCheck, Building2, User, Video, PlayCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- 类型扩展用于 window.aistudio ---
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

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
      // 实际应校验手机号/密码
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
      score: parseFloat(regForm.score), // 初始评分写入
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
    
    // 3.1 检查是否重复申请
    const hasApplied = db.applications.some(a => a.jobId === jobId && a.studentId === db.currentUser?.id);
    if (hasApplied) {
        alert("您已申请过该岗位，请勿重复提交。");
        return;
    }

    // 3.2 写入申请记录
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
    // Check API Key first
    if (!await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
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
            aspectRatio: '9:16' // Mobile portrait
          }
        });

        // Polling loop
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3s
          operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            // Fetch blob via proxy/direct with key to bypass potential CORS or Auth issues on the raw link
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
        <input className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400" placeholder="搜索岗位、州..." />
      </div>

      <div className="space-y-4">
        {db.jobs.map(job => {
            const canApply = (db.currentUser?.score || 0) >= job.minScore;
            const appliedCount = getJobApplicantCount(job.id);
            const isFull = appliedCount >= job.capacity;
            const remaining = Math.max(0, job.capacity - appliedCount);

            return (
            <div key={job.id} onClick={() => setSelectedJobId(job.id)} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group">
                <div className="h-32 bg-gray-200 relative">
                    <img src={job.image} className="w-full h-full object-cover" alt={job.title} />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 flex items-center shadow-sm">
                        <MapPin size={10} className="mr-1"/> {job.location}
                    </div>
                    {!canApply && <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold backdrop-blur-[2px