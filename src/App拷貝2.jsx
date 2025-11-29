import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  getDocs,
  getDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { 
  User, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  Send, 
  Loader2, 
  Search, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Save, 
  Camera, 
  KeyRound, 
  Menu,
  Sparkles, // 懸賞圖示
  Filter,   // 篩選圖示
  ArrowUpDown, // 排序圖示
  Gavel     // 審核圖示
} from 'lucide-react';

// --- 自定義 G 金幣圖示元件 ---
const GCoinIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="11" />
    <text 
      x="12" 
      y="18" 
      textAnchor="middle" 
      fontSize="18" 
      fontWeight="bold" 
      fill="currentColor" 
      stroke="none"
      style={{ userSelect: 'none' }}
    >
      G
    </text>
  </svg>
);

// --- Firebase 設定區 ---
const firebaseConfig = {
  apiKey: "AIzaSyDFgo9JHfl18PAuvWP0L18uffMsqKSQJpo",
  authDomain: "xmas-g-point.firebaseapp.com",
  projectId: "xmas-g-point",
  storageBucket: "xmas-g-point.firebasestorage.app",
  messagingSenderId: "790191807210",
  appId: "1:790191807210:web:258ed0e4a483ecdd0ad593",
  measurementId: "G-TVHV4J5HQH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 常數定義 ---
const COLLECTION_USERS = 'users';
const COLLECTION_TASKS = 'tasks';
const COLLECTION_SUBMISSIONS = 'submissions';

const getCollectionPath = (colName) => [colName];

// 輔助函式：取得使用者頭像 URL
const getUserAvatar = (user) => {
  const seed = user?.avatarSeed || user?.email || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// --- 主應用程式元件 ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); 

  // --- 初始化 Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setLoading(false);
        setCurrentUser(null);
        setView('login');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 使用者資料同步 ---
  useEffect(() => {
    if (firebaseUser) {
      const fetchUserData = async () => {
        const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
        const unsub = onSnapshot(usersRef, (snapshot) => {
          const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          const found = users.find(u => u.email === firebaseUser.email) || 
                        users.find(u => u.uid === firebaseUser.uid);
          
          if (found) {
            setCurrentUser(found);
            setLoading(false);
            if(view === 'login' || view === 'register') setView('dashboard');
          } else {
            setLoading(false);
          }
        });
        return unsub;
      };
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [firebaseUser]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('gpoint_user_email');
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <span className="ml-3">載入活動資料中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20 md:pb-0">
      {/* 導覽列 */}
      {currentUser && (
        <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 cursor-pointer self-start md:self-center" onClick={() => setView('dashboard')}>
              <div className="bg-orange-600 p-2 rounded-lg">
                <GCoinIcon className="w-6 h-6 text-yellow-300" />
              </div>
              <h1 className="text-xl font-bold tracking-wider">G-Point</h1>
            </div>
            
            <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="flex items-center space-x-3 min-w-max p-1">
                <button 
                  onClick={() => setView('dashboard')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded transition whitespace-nowrap ${view === 'dashboard' ? 'bg-orange-700' : 'hover:bg-slate-800'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>首頁</span>
                </button>
                
                <button 
                  onClick={() => setView('leaderboard')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded transition whitespace-nowrap ${view === 'leaderboard' ? 'bg-orange-700' : 'hover:bg-slate-800'}`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>排行榜</span>
                </button>

                {currentUser.isAdmin && (
                  <button 
                    onClick={() => setView('admin')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded transition whitespace-nowrap ${view === 'admin' ? 'bg-pink-700' : 'hover:bg-slate-800'}`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>管理後台</span>
                  </button>
                )}

                <div className="border-l border-slate-700 h-6 mx-2"></div>

                <div className="flex items-center space-x-2">
                  <img 
                    src={getUserAvatar(currentUser)} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full bg-slate-200 border border-slate-600"
                  />
                  <span className="hidden lg:inline text-sm font-medium max-w-[100px] truncate">{currentUser.username}</span>
                </div>

                <button onClick={handleLogout} className="text-slate-400 hover:text-white p-2">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* 主要內容區 */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {!currentUser ? (
          <AuthScreen 
            setView={setView} 
            view={view} 
            setCurrentUser={setCurrentUser} 
            db={db} 
            auth={auth}
          />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard currentUser={currentUser} db={db} />}
            {view === 'leaderboard' && <Leaderboard db={db} />}
            {view === 'admin' && currentUser.isAdmin && <AdminPanel db={db} currentUser={currentUser} />}
          </>
        )}
      </main>
    </div>
  );
}

// --- 登入/註冊元件 ---
function AuthScreen({ setView, view, db, auth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const initialAdminEmail = "domingo_yo@webgene.com.tw";

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newUser = {
        uid: user.uid,
        email: email.toLowerCase(),
        username: username,
        gPoints: 1000,
        isAdmin: email.toLowerCase() === initialAdminEmail,
        createdAt: serverTimestamp(),
        avatarSeed: Math.random().toString(36).substring(7)
      };

      const userDocRef = doc(db, ...getCollectionPath(COLLECTION_USERS), user.uid);
      await setDoc(userDocRef, newUser);

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("此 Email 已經註冊過囉！請直接登入。");
      } else if (err.code === 'auth/weak-password') {
        setError("密碼強度太弱，請至少輸入 6 個字元。");
      } else {
        setError("註冊失敗：" + err.message);
      }
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError("登入失敗：帳號或密碼錯誤");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("請先輸入您的 Email，我們才能寄送重設信給您。"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`重設密碼信件已寄送至 ${email}，請查收信箱。`);
      setError('');
    } catch (err) {
      console.error(err);
      setError("寄送失敗，請確認 Email 是否正確。");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GCoinIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {view === 'login' ? '聖誕超G拍' : '註冊新帳號'}
          </h2>
          <p className="text-slate-500 mt-2">加入任務牆，賺取你的 G 點幣！</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {successMsg}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">使用者名稱</label>
              <input 
                required 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="你的暱稱"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              required 
              type="email" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
            <input 
              required 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (view === 'login' ? '登入' : '立即註冊')}
          </button>
          
          {view === 'login' && (
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-slate-500 text-sm hover:text-orange-600 transition flex items-center justify-center gap-1 py-1"
            >
              <KeyRound className="w-3 h-3" /> 忘記密碼？
            </button>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {view === 'login' ? (
            <p>還沒有帳號？ <button onClick={() => setView('register')} className="text-orange-600 font-semibold hover:underline">免費註冊</button></p>
          ) : (
            <p>已經有帳號了？ <button onClick={() => setView('login')} className="text-orange-600 font-semibold hover:underline">返回登入</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 首頁 (任務牆) 元件 ---
function Dashboard({ currentUser, db }) {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // 頭像 Modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatarSeed, setTempAvatarSeed] = useState('');

  // 懸賞 Modal
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [bountyForm, setBountyForm] = useState({ title: '', description: '', reward: 100 });

  // Filter & Sort
  const [filterType, setFilterType] = useState('all'); // all, available, claimed, reviewing, completed, created
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // 自動關閉 Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // 取得所有任務 (即時監聽)
    const tasksRef = collection(db, ...getCollectionPath(COLLECTION_TASKS));
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 取得所有提交 (為了計算狀態，以及發起者需要看別人的提交)
    const subsRef = collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS));
    const unsubSubs = onSnapshot(subsRef, (snap) => {
      const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubmissions(allSubs);
      setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubSubs();
    };
  }, []);

  // 階段一：認領任務
  const handleClaim = async (task) => {
    if (!confirm(`確定要認領「${task.title}」嗎？`)) return;
    try {
      await addDoc(collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS)), {
        userId: currentUser.uid || currentUser.id,
        userEmail: currentUser.email,
        username: currentUser.username,
        taskId: task.id,
        taskTitle: task.title,
        reward: parseInt(task.reward),
        status: 'claimed',
        claimedAt: serverTimestamp(),
        submittedAt: null,
        taskCreatorId: task.creatorId || null // 重要：記錄誰是發起人
      });
      setToast({ message: `成功認領任務「${task.title}」！`, type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: "認領失敗，請稍後再試", type: 'error' });
    }
  };

  // 階段二：提交審核
  const handleSubmit = async (subId, taskTitle) => {
    try {
      const subDocRef = doc(db, ...getCollectionPath(COLLECTION_SUBMISSIONS), subId);
      await updateDoc(subDocRef, {
        status: 'pending',
        submittedAt: serverTimestamp()
      });
      setToast({ message: `任務「${taskTitle}」已提交審核！`, type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: "提交失敗，請稍後再試", type: 'error' });
    }
  };

  // 發起懸賞
  const handleCreateBounty = async (e) => {
    e.preventDefault();
    const rewardCost = parseInt(bountyForm.reward);
    
    if (currentUser.gPoints < rewardCost) {
      setToast({ message: "您的 G 點幣不足以支付此懸賞！", type: 'error' });
      return;
    }

    try {
      // 建立懸賞任務 (狀態為待審核)
      await addDoc(collection(db, ...getCollectionPath(COLLECTION_TASKS)), {
        ...bountyForm,
        reward: rewardCost,
        type: 'bounty',
        creatorId: currentUser.uid || currentUser.id,
        creatorName: currentUser.username,
        status: 'pending_approval', // 待管理員審核
        createdAt: serverTimestamp()
      });
      
      setToast({ message: "懸賞已送出！待管理員審核通過後將自動上架。", type: 'success' });
      setShowBountyModal(false);
      setBountyForm({ title: '', description: '', reward: 100 });
    } catch (err) {
      setToast({ message: "懸賞發起失敗", type: 'error' });
    }
  };

  // 懸賞發起者審核
  const handleCreatorReview = async (sub, decision) => {
    try {
      const subRef = doc(db, ...getCollectionPath(COLLECTION_SUBMISSIONS), sub.id);
      if (decision === 'approved') {
        await updateDoc(subRef, { status: 'approved', reviewedAt: serverTimestamp() });
        // 增加提交者的點數
        const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
        const q = query(usersRef, where("uid", "==", sub.userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
           await updateDoc(snap.docs[0].ref, { gPoints: increment(sub.reward) });
        }
        setToast({ message: "已批准！對方獲得獎勵。", type: 'success' });
      } else {
        await updateDoc(subRef, { status: 'rejected', reviewedAt: serverTimestamp() });
        setToast({ message: "已否決該提交。", type: 'success' });
      }
    } catch (e) { console.error(e); setToast({ message: "操作失敗", type: 'error' }); }
  };

  // 頭像編輯
  const openAvatarModal = () => {
    setTempAvatarSeed(currentUser.avatarSeed || currentUser.email);
    setShowAvatarModal(true);
  };
  const handleRandomizeAvatar = () => setTempAvatarSeed(Math.random().toString(36).substring(7));
  const handleSaveAvatar = async () => {
    try {
      const uid = currentUser.uid || currentUser.id;
      await updateDoc(doc(db, ...getCollectionPath(COLLECTION_USERS), uid), { avatarSeed: tempAvatarSeed });
      setToast({ message: "頭像已更新！", type: 'success' });
      setShowAvatarModal(false);
    } catch (error) { setToast({ message: "更新失敗", type: 'error' }); }
  };

  // --- 資料處理：過濾與排序 ---
  const taskList = useMemo(() => {
    let processed = tasks
      .filter(t => t.status !== 'pending_approval') // 只顯示已上架的
      .map(task => {
        // 找出「我」對此任務的提交狀態
        const mySub = submissions.find(s => s.taskId === task.id && (s.userId === currentUser.uid || s.userId === currentUser.id));
        
        let status = 'available';
        let subId = null;

        if (mySub) {
           if (mySub.status === 'pending') status = 'under_review';
           else if (mySub.status === 'claimed') status = 'claimed';
           else if (mySub.status === 'approved') status = 'completed';
           else if (mySub.status === 'rejected') status = 'rejected';
           subId = mySub.id;
        }
        
        const isMyBounty = task.creatorId === (currentUser.uid || currentUser.id);
        return { ...task, status, subId, isMyBounty };
      });

    // 1. Filter
    if (filterType === 'claimed') processed = processed.filter(t => t.status === 'claimed');
    else if (filterType === 'available') processed = processed.filter(t => t.status === 'available' || t.status === 'rejected');
    else if (filterType === 'reviewing') processed = processed.filter(t => t.status === 'under_review');
    else if (filterType === 'completed') processed = processed.filter(t => t.status === 'completed');
    else if (filterType === 'created') processed = processed.filter(t => t.isMyBounty);

    // 2. Sort (已認領置頂 -> 獎勵排序)
    processed.sort((a, b) => {
      const isAActive = a.status === 'claimed' || a.status === 'under_review';
      const isBActive = b.status === 'claimed' || b.status === 'under_review';
      
      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;

      if (sortOrder === 'asc') return a.reward - b.reward;
      return b.reward - a.reward;
    });

    return processed;
  }, [tasks, submissions, currentUser, filterType, sortOrder]);

  // 取得「我發起的懸賞」中，等待我審核的提交
  const myBountyReviews = useMemo(() => {
    const uid = currentUser.uid || currentUser.id;
    return submissions.filter(s => s.status === 'pending' && s.taskCreatorId === uid);
  }, [submissions, currentUser]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-orange-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {toast && (
        <div className="fixed top-24 right-4 md:right-10 z-[100] animate-bounce-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-slate-800 text-white border-orange-500' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertCircle className="w-6 h-6" />}
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        </div>
      )}

      {/* 頭像 Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">更換頭像</h3>
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tempAvatarSeed}`} className="w-32 h-32 rounded-full border-4 border-orange-100 shadow-inner bg-slate-50" />
                <button onClick={handleRandomizeAvatar} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border hover:bg-slate-50"><RefreshCw className="w-5 h-5 text-orange-600" /></button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAvatarModal(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleSaveAvatar} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* 懸賞 Modal */}
      {showBountyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-pink-500"/> 發起懸賞任務</h3>
            <p className="text-sm text-slate-500 mb-6">審核通過後，系統將扣除您的點數並自動上架。</p>
            <form onSubmit={handleCreateBounty} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">懸賞標題</label><input required className="w-full px-3 py-2 border rounded-lg" value={bountyForm.title} onChange={e=>setBountyForm({...bountyForm, title: e.target.value})} placeholder="例如：幫我倒垃圾"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">懸賞獎勵 (G幣)</label><input required type="number" min="10" className="w-full px-3 py-2 border rounded-lg" value={bountyForm.reward} onChange={e=>setBountyForm({...bountyForm, reward: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">任務說明</label><textarea required rows="3" className="w-full px-3 py-2 border rounded-lg" value={bountyForm.description} onChange={e=>setBountyForm({...bountyForm, description: e.target.value})} placeholder="詳細說明任務內容..."/></div>
              <div className="flex gap-3 mt-6 pt-4"><button type="button" onClick={() => setShowBountyModal(false)} className="flex-1 py-3 border rounded-xl">取消</button><button type="submit" className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700">提交審核</button></div>
            </form>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        <div className="relative group z-10">
          <img src={getUserAvatar(currentUser)} className="w-24 h-24 rounded-full border-4 border-orange-50 shadow-md bg-white object-cover" />
          <button onClick={openAvatarModal} className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full shadow-md hover:bg-orange-600"><Camera className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 w-full z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{currentUser.username}</h2>
              <p className="text-slate-500 text-sm">{currentUser.email}</p>
            </div>
            <button onClick={() => setShowBountyModal(true)} className="w-full md:w-auto bg-pink-100 text-pink-700 hover:bg-pink-200 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition mt-4 md:mt-0"><Sparkles className="w-4 h-4"/> 發起懸賞</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-3"><div className="bg-yellow-100 p-2 rounded-full"><GCoinIcon className="w-5 h-5 text-yellow-600"/></div><div><p className="text-xs text-slate-500 font-bold">G 點幣</p><p className="text-xl font-bold text-slate-800">{currentUser.gPoints.toLocaleString()}</p></div></div>
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-3"><div className="bg-green-100 p-2 rounded-full"><CheckCircle className="w-5 h-5 text-green-600"/></div><div><p className="text-xs text-slate-500 font-bold">已完成</p><p className="text-xl font-bold text-slate-800">{submissions.filter(s => s.status === 'approved').length}</p></div></div>
          </div>
        </div>
      </section>

      {/* 懸賞審核區 (給發起者) */}
      {myBountyReviews.length > 0 && (
        <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6 animate-fade-in">
          <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2"><Gavel className="w-5 h-5"/> 你的懸賞任務有新的提交！</h3>
          <div className="grid gap-4">
            {myBountyReviews.map(sub => (
              <div key={sub.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-slate-800">{sub.username} <span className="font-normal text-slate-500">完成了</span> {sub.taskTitle}</p>
                  <p className="text-xs text-slate-400">{sub.submittedAt ? new Date(sub.submittedAt.toMillis()).toLocaleString() : '剛剛'}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => handleCreatorReview(sub, 'rejected')} className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold">否決</button>
                  <button onClick={() => handleCreatorReview(sub, 'approved')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm">批准 (+{sub.reward}G)</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 任務牆 */}
      <section>
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='all'?'bg-slate-800 text-white':'bg-white text-slate-500 border'}`}>全部</button>
            <button onClick={() => setFilterType('available')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='available'?'bg-purple-600 text-white':'bg-white text-slate-500 border'}`}>未認領</button>
            <button onClick={() => setFilterType('claimed')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='claimed'?'bg-blue-600 text-white':'bg-white text-slate-500 border'}`}>已認領</button>
            <button onClick={() => setFilterType('reviewing')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='reviewing'?'bg-yellow-500 text-white':'bg-white text-slate-500 border'}`}>審核中</button>
            <button onClick={() => setFilterType('completed')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='completed'?'bg-green-600 text-white':'bg-white text-slate-500 border'}`}>已完成</button>
            <button onClick={() => setFilterType('created')} className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType==='created'?'bg-pink-600 text-white':'bg-white text-slate-500 border'}`}>我發起的</button>
          </div>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-orange-600 bg-white px-3 py-1.5 rounded-lg border">
            <ArrowUpDown className="w-4 h-4"/> 獎勵 {sortOrder === 'asc' ? '少 → 多' : '多 → 少'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskList.map(task => {
            let borderClass = 'border-slate-200 hover:shadow-md';
            let bgClass = 'bg-white';
            let icon = <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><GCoinIcon className="w-3 h-3"/> +{task.reward}</div>;

            // 外框顏色與樣式設定
            if (task.status === 'completed') { borderClass = 'border-green-200 opacity-70 pointer-events-none'; bgClass = 'bg-green-50/50'; icon = <CheckCircle className="w-6 h-6 text-green-500"/>; }
            else if (task.status === 'under_review') { borderClass = 'border-yellow-400 ring-2 ring-yellow-100'; bgClass = 'bg-yellow-50'; icon = <Clock className="w-6 h-6 text-yellow-600 animate-pulse"/>; }
            else if (task.status === 'claimed') { borderClass = 'border-blue-400 ring-2 ring-blue-100'; bgClass = 'bg-blue-50'; icon = <Info className="w-6 h-6 text-blue-600"/>; }
            else if (task.type === 'bounty') { borderClass = 'border-pink-300 hover:border-pink-400 hover:shadow-pink-100'; bgClass = 'bg-pink-50/30'; }

            return (
              <div key={task.id} className={`relative rounded-xl p-6 shadow-sm border transition-all duration-300 flex flex-col ${borderClass} ${bgClass}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    {task.type === 'bounty' ? <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Sparkles className="w-3 h-3"/> 懸賞</span> : null}
                    {task.status !== 'completed' && task.status !== 'under_review' && task.status !== 'claimed' && <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><GCoinIcon className="w-3 h-3"/> +{task.reward}</div>}
                  </div>
                  {icon}
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">{task.title}</h4>
                <p className="text-slate-600 text-sm mb-6 flex-grow line-clamp-3">{task.description}</p>
                <div className="mt-auto pt-4 border-t border-slate-100/50">
                  {(task.status === 'available' || task.status === 'rejected') && (
                     task.isMyBounty ? 
                     <div className="text-center text-sm text-slate-400 py-2 cursor-default">這是你發起的懸賞</div> :
                     <button onClick={() => handleClaim(task)} className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${task.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-900 text-white hover:bg-orange-600'}`}>{task.status === 'rejected' ? '重新認領' : '認領任務'} <Plus className="w-3 h-3"/></button>
                  )}
                  {task.status === 'claimed' && <button onClick={() => handleSubmit(task.subId, task.title)} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md">提交審核 <Send className="w-3 h-3"/></button>}
                  {task.status === 'under_review' && <div className="w-full bg-yellow-100 text-yellow-700 py-2 rounded-lg text-sm font-medium text-center">審核中...</div>}
                  {task.status === 'completed' && <div className="w-full bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium text-center">任務已完成</div>}
                </div>
              </div>
            );
          })}
          {taskList.length === 0 && <div className="col-span-full py-12 text-center text-slate-400">沒有符合條件的任務</div>}
        </div>
      </section>
    </div>
  );
}

// --- 排行榜元件 ---
function Leaderboard({ db }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { onSnapshot(collection(db, ...getCollectionPath(COLLECTION_USERS)), (s) => setUsers(s.docs.map(d => d.data()).sort((a, b) => b.gPoints - a.gPoints))); }, []);
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10"><h2 className="text-3xl font-bold text-slate-800">G 點幣排行榜</h2></div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase"><th className="px-6 py-4 text-center">排名</th><th className="px-6 py-4">使用者</th><th className="px-6 py-4 text-right">點數</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((u, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-6 py-4 text-center font-bold text-slate-500">#{i+1}</td><td className="px-6 py-4 flex items-center gap-3"><img src={getUserAvatar(u)} className="w-8 h-8 rounded-full bg-white object-cover border"/><span>{u.username}</span></td><td className="px-6 py-4 text-right font-mono font-bold text-orange-600">{u.gPoints}</td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}

// --- 管理者後台 ---
function AdminPanel({ db, currentUser }) {
  const [activeTab, setActiveTab] = useState('tasks');
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col md:flex-row overflow-hidden animate-fade-in">
      <aside className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-8 text-slate-800 font-bold"><Shield className="w-5 h-5 text-pink-600" /> 後台管理</div>
        <div className="space-y-2">
          <button onClick={() => setActiveTab('tasks')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'tasks' ? 'bg-white shadow-sm text-orange-700 font-bold border' : 'text-slate-500 hover:bg-slate-100'}`}><ListTodo className="w-4 h-4" /> 任務</button>
          <button onClick={() => setActiveTab('bounties')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'bounties' ? 'bg-white shadow-sm text-orange-700 font-bold border' : 'text-slate-500 hover:bg-slate-100'}`}><Sparkles className="w-4 h-4" /> 懸賞審核</button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'reviews' ? 'bg-white shadow-sm text-orange-700 font-bold border' : 'text-slate-500 hover:bg-slate-100'}`}><CheckCircle className="w-4 h-4" /> 任務審核</button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'users' ? 'bg-white shadow-sm text-orange-700 font-bold border' : 'text-slate-500 hover:bg-slate-100'}`}><Users className="w-4 h-4" /> 會員</button>
        </div>
      </aside>
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">
        {activeTab === 'tasks' && <AdminTasks db={db} />}
        {activeTab === 'bounties' && <AdminBounties db={db} />}
        {activeTab === 'reviews' && <AdminReviews db={db} />}
        {activeTab === 'users' && <AdminUsers db={db} myEmail={currentUser.email} />}
      </div>
    </div>
  );
}

// --- 後台子元件 ---
function AdminTasks({ db }) {
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState({ title: '', description: '', reward: 100 });
  const [editId, setEditId] = useState(null);

  useEffect(() => { 
    // 只顯示系統任務或已上架的懸賞 (status != pending_approval) 供編輯
    const u = onSnapshot(collection(db, ...getCollectionPath(COLLECTION_TASKS)), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.status !== 'pending_approval'))); return () => u(); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tasksRef = collection(db, ...getCollectionPath(COLLECTION_TASKS));
    if (editId) await updateDoc(doc(tasksRef, editId), { ...currentTask, reward: parseInt(currentTask.reward) });
    else await addDoc(tasksRef, { ...currentTask, reward: parseInt(currentTask.reward), createdAt: serverTimestamp(), type: 'system' });
    setIsEditing(false); setCurrentTask({ title: '', description: '', reward: 100 }); setEditId(null);
  };
  
  const handleDelete = async (id) => { if(confirm("刪除?")) await deleteDoc(doc(db, ...getCollectionPath(COLLECTION_TASKS), id)); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">任務列表</h3>{!isEditing && <button onClick={() => setIsEditing(true)} className="bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> 新增官方任務</button>}</div>
      {isEditing && <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl mb-6"><input className="w-full mb-2 p-2 border rounded" placeholder="標題" value={currentTask.title} onChange={e=>setCurrentTask({...currentTask, title: e.target.value})} /><input type="number" className="w-full mb-2 p-2 border rounded" placeholder="獎勵" value={currentTask.reward} onChange={e=>setCurrentTask({...currentTask, reward: e.target.value})} /><textarea className="w-full mb-2 p-2 border rounded" placeholder="內容" value={currentTask.description} onChange={e=>setCurrentTask({...currentTask, description: e.target.value})} /><div className="flex gap-2"><button type="button" onClick={()=>setIsEditing(false)} className="p-2 border rounded">取消</button><button type="submit" className="p-2 bg-orange-600 text-white rounded">儲存</button></div></form>}
      <div className="space-y-3">{tasks.map(t => (<div key={t.id} className="p-4 border rounded-lg flex justify-between items-center bg-white"><div><div className="font-bold">{t.title} <span className="text-orange-600 text-sm">+{t.reward}</span> {t.type==='bounty' && <span className="bg-pink-100 text-pink-600 text-xs px-1 rounded">玩家懸賞</span>}</div><div className="text-sm text-slate-500">{t.description}</div></div><div className="flex gap-2"><button onClick={()=>{setCurrentTask(t);setEditId(t.id);setIsEditing(true)}}><Edit className="w-4 h-4 text-slate-400"/></button><button onClick={()=>handleDelete(t.id)}><Trash2 className="w-4 h-4 text-red-400"/></button></div></div>))}</div>
    </div>
  );
}

function AdminBounties({ db }) {
  const [bounties, setBounties] = useState([]);
  useEffect(() => {
    const u = onSnapshot(collection(db, ...getCollectionPath(COLLECTION_TASKS)), (s) => {
      setBounties(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.status === 'pending_approval'));
    }); return () => u();
  }, []);

  const handleApprove = async (bounty) => {
    try {
      // 核准：1. 扣除發起者點數 2. 任務上架 (status -> available)
      const creatorRef = doc(db, ...getCollectionPath(COLLECTION_USERS), bounty.creatorId);
      const creatorSnap = await getDoc(creatorRef);
      if (creatorSnap.exists() && creatorSnap.data().gPoints >= bounty.reward) {
        await updateDoc(creatorRef, { gPoints: increment(-bounty.reward) });
        await updateDoc(doc(db, ...getCollectionPath(COLLECTION_TASKS), bounty.id), { status: 'available' });
        alert("已核准並扣除發起者點數！");
      } else {
        alert("發起者點數不足，無法核准！");
      }
    } catch (e) { console.error(e); alert("操作失敗"); }
  };

  const handleReject = async (id) => {
    if(confirm("確定拒絕此懸賞？")) await deleteDoc(doc(db, ...getCollectionPath(COLLECTION_TASKS), id));
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-6">待審核懸賞 ({bounties.length})</h3>
      <div className="space-y-3">{bounties.map(t => (<div key={t.id} className="p-4 border rounded-lg bg-pink-50 border-pink-100 flex justify-between items-center"><div><div className="font-bold">{t.title} <span className="text-orange-600">+{t.reward}</span></div><div className="text-sm text-slate-500">發起人: {t.creatorName}</div><div className="text-sm text-slate-500">{t.description}</div></div><div className="flex gap-2"><button onClick={()=>handleReject(t.id)} className="px-3 py-1 border border-red-200 text-red-600 rounded text-sm">拒絕</button><button onClick={()=>handleApprove(t)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">核准上架</button></div></div>))}</div>
    </div>
  );
}

function AdminReviews({ db }) {
  const [subs, setSubs] = useState([]);
  useEffect(() => {
    // 管理員只審核「系統任務」或「發起者是管理員」的任務 (taskCreatorId 為空或為 admin)
    // 但為了保險，管理員可以看到所有待審核，但介面上標示清楚
    const u = onSnapshot(collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS)), (s) => setSubs(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.status === 'pending'))); return () => u();
  }, []);

  const handleReview = async (sub, status) => {
    try {
      const subRef = doc(db, ...getCollectionPath(COLLECTION_SUBMISSIONS), sub.id);
      if (status === 'approved') {
        await updateDoc(subRef, { status: 'approved', reviewedAt: serverTimestamp() });
        // 只有系統任務才需要「系統發點數」，懸賞任務的點數在發起時已經扣在系統池了，這裡只是確認給分
        // 但因為目前架構是 User document 記點，所以這裡統一加分給提交者
        const q = query(collection(db, ...getCollectionPath(COLLECTION_USERS)), where("uid", "==", sub.userId));
        const snap = await getDocs(q);
        if (!snap.empty) await updateDoc(snap.docs[0].ref, { gPoints: increment(sub.reward) });
      } else {
        await updateDoc(subRef, { status: 'rejected', reviewedAt: serverTimestamp() });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-6">所有待審核任務 ({subs.length})</h3>
      <div className="space-y-3">{subs.map(s => (<div key={s.id} className="p-4 border rounded-lg bg-white flex justify-between items-center"><div><div className="font-bold">{s.username} <span className="font-normal">提交了</span> {s.taskTitle}</div><div className="text-sm text-slate-400">獎勵: {s.reward} G {s.taskCreatorId ? '(懸賞任務)' : '(官方任務)'}</div></div><div className="flex gap-2"><button onClick={()=>handleReview(s,'rejected')} className="px-3 py-1 border text-red-600 rounded text-sm">否決</button><button onClick={()=>handleReview(s,'approved')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">批准</button></div></div>))}</div>
    </div>
  );
}

function AdminUsers({ db, myEmail }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { const u = onSnapshot(collection(db, ...getCollectionPath(COLLECTION_USERS)), (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))); return () => u(); }, []);
  const toggleAdmin = async (u) => { if(u.email!==myEmail) await updateDoc(doc(db, ...getCollectionPath(COLLECTION_USERS), u.id), { isAdmin: !u.isAdmin }); };
  return (
    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b text-sm text-slate-500"><th className="p-2">User</th><th className="p-2">Email</th><th className="p-2">Points</th><th className="p-2">Role</th><th className="p-2">Action</th></tr></thead><tbody>{users.map(u=>(<tr key={u.id} className="border-b"><td className="p-2 font-bold">{u.username}</td><td className="p-2 text-sm">{u.email}</td><td className="p-2 text-orange-600 font-mono">{u.gPoints}</td><td className="p-2">{u.isAdmin?'Admin':'User'}</td><td className="p-2"><button onClick={()=>toggleAdmin(u)} className="text-blue-600 text-xs underline">{u.isAdmin?'Demote':'Promote'}</button></td></tr>))}</tbody></table></div>
  );
}