import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas'; 
import { 
    ChevronLeft, ChevronRight, Target, CheckSquare, Image as ImageIcon, 
    Share2, Save, X, Trash2, Plus, Link as LinkIcon, Loader2, 
    CheckCircle2, Sparkles, Lock, Ghost, CalendarDays, ScrollText,
    Trophy, Quote, PenLine, AlertTriangle, Copy, Download, Heart, User, Calendar, Settings, LogIn, LogOut, Mail
} from 'lucide-react';

// --- Firebase 导入 ---
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "firebase/firestore";

// =========================================================================
// ★★★ Firebase 配置 (您提供的) ★★★
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCz9vwlM0qF_qzmpsZADYkQX46v6KvhEFA",
    authDomain: "decalife-587b2.firebaseapp.com",
    projectId: "decalife-587b2",
    storageBucket: "decalife-587b2.firebasestorage.app",
    messagingSenderId: "863325275588",
    appId: "1:863325275588:web:45be487a0328c033e39091",
    measurementId: "G-8QYWKZWDSH"
};

// --- Firebase 初始化 ---
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase init failed:", e);
}

// --- 样式注入 (保持原样) ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&display=swap');
        body { margin: 0; font-family: sans-serif; background-color: #f8fafc; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
        
        /* 简单的淡入动画 */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    `}</style>
);

// 背景纹理组件 (保留您的设计)
const BackgroundPattern = () => (
    <div className="fixed inset-0 z-[-1] opacity-40 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#f8fafc]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-amber-100/40 rounded-full blur-3xl"></div>
    </div>
);

const MOTIVATIONAL_QUOTES = [
    "向内探索，去见证本自具足的自己。🧘",
    "无需向外索求，答案多在内心深处。🌊",
    "不是为了抵达某处，而是为了感受行走的意义。🚶",
    "安静地从泥土中汲取养分，按自己的节奏开花。🌼",
    "所谓自由，不过是拥有被讨厌的勇气和独立的灵魂。🦅",
    "在这个快时代，做个慢行者，细嗅蔷薇。🌹",
    "记录不是为了怀念，而是为了更清醒地活在当下。👁️",
    "生长是无声的，但自有力量。🌲",
    "独处时见自己，记录时见天地。📖"
];

const formatDate = (date) => `${date.getMonth() + 1}.${date.getDate()}`;

const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
                canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};

const generateBlocks = (year) => {
    const blocks = [];
    let currentDate = new Date(year, 0, 1);
    for (let i = 0; i < 36; i++) {
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        end.setDate(end.getDate() + 9);
        blocks.push({
            id: `${year}-block-${i + 1}`,
            index: i + 1,
            startDate: start,
            endDate: end,
        });
        currentDate.setDate(currentDate.getDate() + 10);
    }
    const lastBlockStart = new Date(currentDate);
    const lastBlockEnd = new Date(year, 11, 31);
    blocks.push({
        id: `${year}-block-37`,
        index: 37,
        startDate: lastBlockStart,
        endDate: lastBlockEnd,
    });
    return blocks;
};

const getBlockStatus = (block) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(block.startDate.getFullYear(), block.startDate.getMonth(), block.startDate.getDate());
    const end = new Date(block.endDate.getFullYear(), block.endDate.getMonth(), block.endDate.getDate());
    if (today > end) return 'past';
    if (today >= start && today <= end) return 'current';
    return 'future';
};

const calculateProgress = (todos) => {
    if (!todos || todos.length === 0) return 0;
    const completed = todos.filter(t => t.done).length;
    return Math.round((completed / todos.length) * 100);
};

// --- 登录/注册 弹窗组件 ---
const LoginModal = ({ onClose, onGoogleLogin, onEmailLogin, onEmailSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                await onEmailSignup(email, password);
            } else {
                await onEmailLogin(email, password);
            }
            onClose();
        } catch (err) {
            console.error(err);
            let msg = "操作失败";
            if (err.code === 'auth/invalid-email') msg = "邮箱格式错误";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "账号或密码错误";
            if (err.code === 'auth/email-already-in-use') msg = "该邮箱已被注册";
            if (err.code === 'auth/weak-password') msg = "密码至少6位";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">同步数据</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
                </div>

                <div className="space-y-4">
                    <button onClick={() => { onGoogleLogin(); onClose(); }} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google 账号登录
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">或使用邮箱</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">邮箱</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="name@example.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">密码</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : (isSignup ? "注册并登录" : "登录")}
                        </button>
                    </form>
                    
                    <div className="text-center">
                        <button onClick={() => setIsSignup(!isSignup)} className="text-xs text-indigo-600 hover:underline">
                            {isSignup ? "还没有账号？去注册" : "已有账号？去登录"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 其他 UI 组件 ---
const Toast = ({ message, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in pointer-events-none"><div className="bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-max border border-white/10"><Sparkles size={18} className="text-yellow-400 animate-pulse" /><span className="font-medium text-sm tracking-wide">{message}</span></div></div>);
};
const ProgressRing = ({ radius, stroke, progress, color = "text-green-500" }) => {
    const normalizedRadius = radius - stroke * 2; const circumference = normalizedRadius * 2 * Math.PI; const strokeDashoffset = circumference - (progress / 100) * circumference;
    return (<div className="relative flex items-center justify-center"><svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]"><circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} r={normalizedRadius} cx={radius} cy={radius} className={`${color} transition-all duration-500 ease-out`} strokeLinecap="round" /><circle stroke="currentColor" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} className="text-gray-100 opacity-20" /></svg></div>);
};
const BrandLogo = ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="2" width="9" height="9" rx="2.5" fill="currentColor" fillOpacity="0.3" /><rect x="13" y="2" width="9" height="9" rx="2.5" fill="currentColor" fillOpacity="0.5" /><rect x="2" y="13" width="9" height="9" rx="2.5" fill="currentColor" fillOpacity="0.7" /><rect x="13" y="13" width="9" height="9" rx="2.5" fill="currentColor" fillOpacity="1" /></svg>);
const StatsModal = ({ blocks, dataStore, onClose }) => {
    const filledCount = blocks.filter(b => { const data = dataStore[b.id]; return !!data && (!!data.theme || !!data.goals || (data.todos && data.todos.length > 0) || !!data.image); }).length;
    const achievedCount = blocks.filter(b => { const data = dataStore[b.id]; return !!data && data.isAchieved; }).length;
    const total = 37; const passedBlocks = blocks.filter(b => getBlockStatus(b) === 'past').length; const timeProgress = Math.min(100, Math.round(((passedBlocks + 1) / total) * 100));
    const progressBarChars = 15; const walkerPos = Math.round((timeProgress / 100) * (progressBarChars - 1)); let progressBarVisual = [];
    for (let i = 0; i < progressBarChars; i++) { if (i === walkerPos) progressBarVisual.push("🚶"); else if (i < walkerPos) progressBarVisual.push("•"); else progressBarVisual.push("·"); }
    let comment = "向内生长，扎根于每一个当下。🌱"; if (filledCount > 3) comment = "觉察自我，是成长的第一步。🪜"; if (filledCount > 10) comment = "你正在重塑生活的秩序，构建内心的城堡。🏰";
    return (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in" onClick={onClose}><div className="bg-[#FFFDF5] w-full max-w-[340px] shadow-2xl relative flex flex-col font-mono text-gray-800 transform rotate-1 transition-transform hover:rotate-0 duration-300" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 2px rgba(0,0,0,0.1)' }}><div className="absolute top-0 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_0.25rem,#FFFDF5_0.25rem)] bg-[length:0.5rem_0.5rem] bg-[position:0_-0.25rem] -mt-2"></div><div className="p-8 pt-8 pb-4 flex flex-col items-center text-center"><div className="mb-6 flex flex-col items-center gap-2"><BrandLogo size={32} className="text-gray-800" /><h2 className="text-xl font-black text-gray-900 tracking-wide font-serif">年度拾光小票</h2></div><div className="w-full border-t border-dashed border-gray-300 mb-6"></div><div className="w-full mb-8"><div className="flex justify-between items-end text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2"><span>Jan</span><span>Dec</span></div><div className="relative w-full h-6 flex items-center justify-between text-gray-400 text-sm">{progressBarVisual.map((char, index) => (<span key={index} className={char === "🚶" ? "text-lg inline-block transform -translate-y-1" : ""} style={char === "🚶" ? { transform: 'scaleX(-1) translateY(-4px)' } : {}}>{char}</span>))}</div><div className="text-center text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{timeProgress}% Loaded</div></div><div className="w-full space-y-3 mb-8 text-sm"><div className="flex items-end justify-between"><span className="font-bold text-gray-600">胶囊总数</span><span className="font-bold text-gray-900">{total}</span></div><div className="flex items-end justify-between"><span className="font-bold text-gray-600">珍藏回忆</span><span className="font-bold text-indigo-600">{filledCount}</span></div><div className="flex items-end justify-between"><span className="font-bold text-gray-600">闪光时刻</span><span className="font-bold text-amber-500">{achievedCount}</span></div></div><div className="w-full relative py-2 mb-6"><Quote size={20} className="text-gray-200 absolute top-[-10px] left-[-5px]" /><p className="text-sm text-gray-800 font-serif italic leading-relaxed px-4">“{comment}”</p><div className="mt-4 flex justify-center"><div className="border border-gray-300 rounded-full px-3 py-1 text-[10px] text-gray-400 font-sans tracking-wide uppercase">自我探索之旅</div></div></div><div className="w-full border-t-2 border-gray-800 mb-2"></div><div className="w-full flex flex-col items-center gap-2 opacity-60"><div className="h-8 w-3/4 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAADklEQVR42mNkgAJGKAAAACQABZ4+O98AAAAASUVORK5CYII=')] bg-repeat-x opacity-80"></div><div className="flex justify-between w-full text-[9px] font-mono uppercase mt-1"><span>{new Date().toLocaleDateString()}</span><span>NO. {new Date().getFullYear()}-001</span></div><p className="text-[10px] font-bold mt-1 tracking-widest">KEEP WALKING</p></div></div><div className="absolute bottom-0 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_0.25rem,#FFFDF5_0.25rem)] bg-[length:0.5rem_0.5rem] bg-[position:0_-0.25rem] -mb-2 transform rotate-180"></div></div></div>);
};

// --- 主应用逻辑 ---
function App() {
    const [user, setUser] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [dataStore, setDataStore] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [toastMessage, setToastMessage] = useState(null);
    const [isEditing, setIsEditing] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // 控制自动滚动
    const [hasAutoScrolled, setHasAutoScrolled] = useState(false);

    const exportRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // --- 1. 认证逻辑 (Google + 邮箱) ---
    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    signInAnonymously(auth).catch(console.error);
                }
            });
            return () => unsubscribe();
        }
    }, []);

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            setToastMessage("Google 登录成功 ☁️");
        } catch (error) {
            console.error("Google Login failed:", error);
            setToastMessage("Google 登录失败，请检查网络");
        }
    };

    const handleEmailLogin = async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
        setToastMessage("邮箱登录成功 📧");
    };

    const handleEmailSignup = async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
        setToastMessage("注册成功并已登录 🎉");
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setToastMessage("已退出登录");
            setDataStore({}); 
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // --- 2. 数据监听 ---
    useEffect(() => {
        if (!user || !db) return;
        const q = collection(db, 'users', user.uid, 'blocks');
        return onSnapshot(q, (snapshot) => {
            const newData = {};
            snapshot.forEach((doc) => { newData[doc.id] = doc.data(); });
            setDataStore(prev => ({ ...prev, ...newData }));
        }, (error) => {
             // 忽略权限错误，通常是未登录状态下的正常表现
             console.log("Firestore access limited:", error.code);
        });
    }, [user]);

    // --- 3. 自动滚动到当前日期 (核心) ---
    useEffect(() => { 
        setBlocks(generateBlocks(year)); 
        if (year === new Date().getFullYear()) setHasAutoScrolled(false); 
    }, [year]);

    useEffect(() => {
        if (blocks.length > 0 && !hasAutoScrolled && year === new Date().getFullYear()) {
            const currentBlock = blocks.find(b => getBlockStatus(b) === 'current');
            if (currentBlock) {
                // 延迟滚动，确保 DOM 渲染完毕
                setTimeout(() => {
                    const element = document.getElementById(currentBlock.id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHasAutoScrolled(true);
                    }
                }, 800);
            }
        }
    }, [blocks, hasAutoScrolled, year]);


    const handleBlockClick = (block) => {
        setSelectedBlock(block);
        const data = dataStore[block.id];
        const hasContent = !!data && (!!data.theme || !!data.goals || (data.todos && data.todos.length > 0) || !!data.image);
        setIsEditing(!hasContent);
    };

    const saveData = (blockId, newData, isManual = false) => {
        const updatedStore = { ...dataStore, [blockId]: newData };
        setDataStore(updatedStore);
        setSyncStatus('saving');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const performSave = async () => {
            if (!user || !db) return;
            try {
                const docRef = doc(db, 'users', user.uid, 'blocks', blockId);
                await setDoc(docRef, newData, { merge: true });
                setSyncStatus('saved');
                if (isManual) {
                    setToastMessage(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
                    setIsEditing(false);
                }
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch (err) {
                console.error("Save failed", err);
                setSyncStatus('error');
            }
        };

        if (isManual) performSave();
        else saveTimeoutRef.current = setTimeout(performSave, 1000);
    };

    const handleManualSave = () => { if (selectedBlock && currentBlockData) saveData(selectedBlock.id, currentBlockData, true); };

    const handleImageUpload = async (e, blockId) => {
        const file = e.target.files[0];
        if (file) {
            setSyncStatus('saving');
            try {
                const compressedBase64 = await compressImage(file);
                saveData(blockId, { ...(dataStore[blockId] || {}), image: compressedBase64 });
            } catch (err) { setSyncStatus('error'); }
        }
    };

    const handleExport = async () => {
        if (!exportRef.current) return;
        
        setIsExporting(true);
        // 延时一小段时间确保DOM稳定
        setTimeout(async () => {
            try {
                // 直接使用导入的 html2canvas，无需检查 undefined
                const canvas = await html2canvas(exportRef.current, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff', // 确保导出图片背景是白的
                    allowTaint: true
                });
                const link = document.createElement('a');
                link.download = `DecaLife-${selectedBlock.id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                setToastMessage("图片生成成功！📸");
            } catch (err) { 
                console.error("Export failed:", err); 
                setToastMessage("导出失败，请重试");
            } finally { 
                setIsExporting(false); 
            }
        }, 100);
    };

    const toggleAchievement = () => {
        if (selectedBlock && currentBlockData) {
            const newValue = !currentBlockData.isAchieved;
            saveData(selectedBlock.id, { ...currentBlockData, isAchieved: newValue });
            if (newValue) setToastMessage("已标记为达成！太棒了 🌟");
        }
    };

    const currentBlockData = selectedBlock ? (dataStore[selectedBlock.id] || { theme: '', goals: '', todos: [], memo: '', image: null, isAchieved: false }) : null;

    return (
        <div className="min-h-screen font-sans pb-10 relative selection:bg-indigo-100 selection:text-indigo-900">
            <GlobalStyles />
            <BackgroundPattern />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {showStats && <StatsModal blocks={blocks} dataStore={dataStore} onClose={() => setShowStats(false)} />}
            {showLoginModal && (
                <LoginModal 
                    onClose={() => setShowLoginModal(false)} 
                    onGoogleLogin={handleGoogleLogin}
                    onEmailLogin={handleEmailLogin}
                    onEmailSignup={handleEmailSignup}
                />
            )}
            
            <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] px-6 py-4 flex items-center justify-between transition-all">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transform transition-transform hover:rotate-6">
                        <BrandLogo size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-base font-extrabold text-gray-900 leading-none tracking-tight font-serif italic">DecaLife</h1>
                        <span className="text-[10px] text-gray-500 font-medium mt-0.5 tracking-wide">记录本身，即是抵抗遗忘 🌱</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {user && !user.isAnonymous ? (
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full" />
                            ) : (
                                <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                    {user.email ? user.email[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <button onClick={handleLogout} className="text-xs font-bold text-indigo-700 hover:text-red-500 transition-colors flex items-center gap-1">
                                退出
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95">
                            <LogIn size={14} />
                            <span className="hidden sm:inline">同步数据</span>
                        </button>
                    )}

                    <button onClick={() => setShowStats(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative group" title="年度统计">
                        <ScrollText size={20} />
                    </button>
                    <div className="flex items-center bg-white/60 border border-white/60 backdrop-blur-md rounded-full px-1.5 p-1 shadow-sm hover:shadow-md transition-shadow">
                        <button onClick={() => setYear(y => y - 1)} className="p-1.5 hover:bg-white rounded-full transition-all text-gray-500 hover:text-gray-900 active:scale-95"><ChevronLeft size={16} /></button>
                        <span className="mx-3 font-bold text-gray-800 tabular-nums text-sm font-serif">{year}</span>
                        <button onClick={() => setYear(y => y + 1)} className="p-1.5 hover:bg-white rounded-full transition-all text-gray-500 hover:text-gray-900 active:scale-95"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 mt-4">
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-5 px-1">
                        <h2 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-sm rotate-45"></span>
                            <span className="tracking-[0.1em]">拾光胶囊 · CAPSULES</span>
                        </h2>
                        <div className="sm:hidden text-[10px] text-gray-400 font-medium bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                           {syncStatus === 'saving' ? 'Syncing...' : (syncStatus === 'saved' ? 'Synced' : '')}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        {blocks.map(block => {
                            const status = getBlockStatus(block);
                            const data = dataStore[block.id];
                            const hasContent = !!data && ((data.theme && data.theme.trim().length > 0) || (data.goals && data.goals.trim().length > 0) || (data.todos && data.todos.some(t => t.text && t.text.trim().length > 0)) || !!data.image || (data.memo && data.memo.trim().length > 0));
                            const progress = hasContent && data.todos ? calculateProgress(data.todos) : 0;
                            const isAchieved = hasContent && data.isAchieved;
                            let containerClass = "bg-white/70 backdrop-blur-sm border-white/50 hover:bg-white/90 text-gray-600";
                            let ringColor = "text-indigo-500";
                            let shadowClass = "shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            let icon = null;

                            if (status === 'current') {
                                containerClass = "bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-purple-100 border-transparent transform scale-[1.02] z-10";
                                ringColor = "text-white";
                                shadowClass = "shadow-xl shadow-indigo-500/30";
                            } else if (status === 'past') {
                                if (hasContent) {
                                    containerClass = "bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200/60 ring-1 ring-amber-100 text-amber-900";
                                    shadowClass = "shadow-md hover:shadow-lg";
                                    icon = isAchieved ? <Sparkles size={16} className="text-amber-500 animate-pulse" /> : <Lock size={16} className="text-amber-400 opacity-60" />;
                                } else {
                                    containerClass = "bg-gray-50/20 border-2 border-dashed border-gray-200 text-gray-300 hover:border-gray-300 hover:bg-gray-50 transition-colors";
                                    shadowClass = "shadow-none";
                                    icon = <Ghost size={16} className="text-gray-300 opacity-40" />;
                                }
                            } else if (status === 'future') {
                                if (hasContent) {
                                    containerClass = "bg-blue-50/80 border-blue-200 text-blue-700";
                                    icon = <CalendarDays size={16} className="text-blue-400 opacity-60" />;
                                }
                            }

                            return (
                                <button 
                                    key={block.id} 
                                    id={block.id} /* 自动滚动锚点 */
                                    onClick={() => handleBlockClick(block)} 
                                    className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-300 ease-out h-24 sm:h-28 ${containerClass} ${shadowClass}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className={`text-sm font-black tracking-tight font-serif ${status === 'current' ? 'text-white' : 'text-current'} opacity-90`}>{block.index}</span>
                                        {hasContent && <div className="opacity-90"><ProgressRing radius={9} stroke={2} progress={progress} color={ringColor} /></div>}
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5 w-full">
                                        <span className={`text-[9px] font-bold tracking-wider uppercase opacity-80 ${status === 'current' ? 'text-indigo-100' : 'text-current'}`}>{formatDate(block.startDate)}</span>
                                        {hasContent && data.theme ? <span className={`text-[10px] font-bold truncate w-full text-left ${status === 'current' ? 'text-white' : 'text-current'} mt-1`}>{data.theme}</span> : (status === 'past' && !hasContent && <span className="text-[9px] italic mt-1 opacity-60">Missed</span>)}
                                    </div>
                                    {icon && <div className="absolute bottom-2 right-2">{icon}</div>}
                                    {status === 'future' && !hasContent && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] rounded-2xl" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {selectedBlock && currentBlockData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/30 backdrop-blur-md animate-fade-in">
                    <div className={`bg-[#FFFFFE] w-full max-w-lg max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5 relative transition-all duration-300 ${!isEditing ? 'border-t-4 border-indigo-500' : ''}`}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-2"><h3 className="text-xl font-black text-gray-900 tracking-tight font-serif">第 {selectedBlock.index} 颗 · 拾光胶囊</h3>{!isEditing && <Lock size={14} className="text-indigo-500" />}</div>
                                <p className="text-xs text-gray-500 font-medium mt-1 tracking-wide">{selectedBlock.startDate.getFullYear()} · {formatDate(selectedBlock.startDate)} - {formatDate(selectedBlock.endDate)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleExport} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="生成长图"><Share2 size={18} /></button>
                                <button onClick={() => setSelectedBlock(null)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"><X size={20} /></button>
                            </div>
                        </div>
                        <div ref={exportRef} className="overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24 bg-[#FFFFFE]">
                            {isEditing ? (
                                <>
                                    <div className="group"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target size={12} /> 胶囊关键词</label><input type="text" placeholder="给这10天一个关键词..." value={currentBlockData.theme} onChange={(e) => saveData(selectedBlock.id, { ...currentBlockData, theme: e.target.value })} className="w-full text-xl font-bold bg-gray-50/50 hover:bg-gray-50 focus:bg-white border-b-2 border-gray-100 focus:border-indigo-500 rounded-t-lg px-3 py-3 outline-none transition-all placeholder-gray-300 text-gray-800 font-serif" /></div>
                                    <div className="group"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">核心目标 (OKR)</label><textarea rows={3} placeholder="写下这期间最重要的1-3个目标..." value={currentBlockData.goals} onChange={(e) => saveData(selectedBlock.id, { ...currentBlockData, goals: e.target.value })} className="w-full p-4 bg-gray-50 hover:bg-white focus:bg-white rounded-2xl border border-transparent focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none text-sm resize-none transition-all text-gray-700 leading-relaxed" /></div>
                                    <div className="group">
                                        <div className="flex items-center justify-between mb-3"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><CheckSquare size={12} /> 关键行动</label></div>
                                        <div className="space-y-2.5">
                                            {(currentBlockData.todos || []).map((todo, idx) => (
                                                <div key={idx} className="flex items-center gap-3 group/item">
                                                    <button onClick={() => { const newTodos = [...currentBlockData.todos]; newTodos[idx].done = !newTodos[idx].done; saveData(selectedBlock.id, { ...currentBlockData, todos: newTodos }); }} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${todo.done ? 'bg-indigo-500 border-indigo-500 shadow-sm shadow-indigo-200' : 'bg-white border-gray-300 hover:border-indigo-400'}`}>{todo.done && <CheckSquare size={12} className="text-white" />}</button>
                                                    <input type="text" value={todo.text} onChange={(e) => { const newTodos = [...currentBlockData.todos]; newTodos[idx].text = e.target.value; saveData(selectedBlock.id, { ...currentBlockData, todos: newTodos }); }} placeholder="待办事项..." className={`flex-1 bg-transparent outline-none text-sm transition-colors border-b border-transparent focus:border-gray-100 pb-0.5 ${todo.done ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`} />
                                                    <button onClick={() => { const newTodos = currentBlockData.todos.filter((_, i) => i !== idx); saveData(selectedBlock.id, { ...currentBlockData, todos: newTodos }); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all px-2"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => { const newTodos = [...(currentBlockData.todos || []), { text: '', done: false }]; saveData(selectedBlock.id, { ...currentBlockData, todos: newTodos }); }} className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold py-2 px-3 hover:bg-indigo-50 rounded-xl w-fit transition-all mt-2"><Plus size={14} /> 添加事项</button>
                                        </div>
                                    </div>
                                    <div className="group"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><LinkIcon size={12} /> 灵感碎片</label><textarea rows={3} placeholder="粘贴教程链接、笔记或灵感..." value={currentBlockData.memo || ''} onChange={(e) => saveData(selectedBlock.id, { ...currentBlockData, memo: e.target.value })} className="w-full p-4 bg-amber-50/50 hover:bg-amber-50 focus:bg-amber-50 rounded-2xl border border-amber-100/50 focus:border-amber-200 focus:ring-4 focus:ring-amber-50 outline-none text-sm resize-none text-gray-700 transition-all" /></div>
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ImageIcon size={12} /> 精彩瞬间</label>
                                        <div className="relative">
                                            {currentBlockData.image ? (
                                                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-md group/img"><img src={currentBlockData.image} alt="Moment" className="w-full h-56 object-cover transition-transform duration-700 group-hover/img:scale-105" /><button onClick={() => saveData(selectedBlock.id, { ...currentBlockData, image: null })} className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-red-500 transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button></div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all group/upload bg-white">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 transition-transform group-hover/upload:-translate-y-1"><ImageIcon size={20} className="text-gray-400 group-hover/upload:text-indigo-500 mb-2" /><p className="text-xs text-gray-500 font-medium">点击上传图片</p></div><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, selectedBlock.id)} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="bg-black text-white px-3 py-1 text-[10px] font-bold rounded-full tracking-wider">THEME</span>
                                            {currentBlockData.isAchieved && <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-in zoom-in duration-300"><Trophy size={14} fill="currentColor" /><span className="text-[10px] font-bold tracking-wide">ACHIEVED</span></div>}
                                        </div>
                                        <h2 className="text-3xl font-black mt-4 text-gray-900 leading-tight font-serif">{currentBlockData.theme || "未命名时光"}</h2>
                                    </div>
                                    {currentBlockData.goals && <div className="bg-gray-50 p-5 rounded-2xl border-l-4 border-indigo-500"><h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Target</h3><p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{currentBlockData.goals}</p></div>}
                                    {(currentBlockData.todos || []).length > 0 && <div><h3 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Checklist Progress</h3><div className="space-y-3">{currentBlockData.todos.map((todo, i) => (<div key={i} className="flex items-start gap-3 opacity-90"><div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border ${todo.done ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>{todo.done && <CheckCircle2 size={12} className="text-white" />}</div><span className={`text-sm ${todo.done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{todo.text}</span></div>))}</div></div>}
                                    {currentBlockData.image && <div className="rounded-2xl overflow-hidden shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-500"><img src={currentBlockData.image} className="w-full h-auto object-cover" alt="Memory" /></div>}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-center gap-3">
                            {isEditing ? (
                                <button onClick={handleManualSave} className="flex-1 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-gray-200">{syncStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}<span>确认封存</span></button>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-sm"><PenLine size={18} className="text-gray-500" /><span>重绘记忆</span></button>
                                    <button onClick={toggleAchievement} className={`flex-1 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md ${currentBlockData.isAchieved ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{currentBlockData.isAchieved ? <CheckCircle2 size={18} /> : <Trophy size={18} />}<span>{currentBlockData.isAchieved ? "已达成" : "标记达成"}</span></button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
