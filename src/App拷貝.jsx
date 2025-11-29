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
  // Coins, // 移除舊的錢幣圖示
  Search, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Save, 
  Camera, 
  KeyRound, 
  Menu
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
    {/* 外圈圓形 */}
    <circle cx="12" cy="12" r="11" />
    {/* 中間的 G 字母 */}
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

// --- Firebase 設定區 (部署時請修改這裡) ---
// ⚠️ 注意：如果您是在電腦上執行，請將下方被註解的區塊打開，並填入您的 Firebase 設定
// ⚠️ 並刪除 `const firebaseConfig = JSON.parse(__firebase_config);` 這一行

const firebaseConfig = {
  apiKey: "AIzaSyDFgo9JHfl18PAuvWP0L18uffMsqKSQJpo",
  authDomain: "xmas-g-point.firebaseapp.com",
  projectId: "xmas-g-point",
  storageBucket: "xmas-g-point.firebasestorage.app",
  messagingSenderId: "790191807210",
  appId: "1:790191807210:web:258ed0e4a483ecdd0ad593",
  measurementId: "G-TVHV4J5HQH"
};

// ↓↓↓↓ 在這裡預覽時請保留這行，但在電腦上請刪除或註解掉 ↓↓↓↓
//const firebaseConfig = JSON.parse(__firebase_config);
// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ↓↓↓↓ 在這裡預覽時請保留這行，但在電腦上請刪除，直接使用 const appId = 'my-app'; 即可 ↓↓↓↓
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 常數定義 ---
const COLLECTION_USERS = 'users';
const COLLECTION_TASKS = 'tasks';
const COLLECTION_SUBMISSIONS = 'submissions';

// 輔助函式：取得公開資料集合路徑
// ⚠️ 部署時如果您直接使用根目錄集合，請改為： const getCollectionPath = (colName) => [colName];
const getCollectionPath = (colName) => [colName];

// 輔助函式：取得使用者頭像 URL
const getUserAvatar = (user) => {
  const seed = user?.avatarSeed || user?.email || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// --- 主應用程式元件 ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // 應用程式層級的使用者資料
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // login, register, dashboard, leaderboard, admin

  // --- 初始化 Auth ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 使用者資料同步 ---
  // 透過 localStorage 記住的使用者 Email 來模擬登入狀態持續
  useEffect(() => {
    const storedEmail = localStorage.getItem('gpoint_user_email');
    if (firebaseUser && storedEmail && !currentUser) {
      const fetchUser = async () => {
        const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
        // 監聽自己的使用者資料變更 (例如點數增加、頭像變更)
        const unsub = onSnapshot(usersRef, (snapshot) => {
          const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          const found = users.find(u => u.email === storedEmail);
          if (found) {
            setCurrentUser(found);
            setLoading(false);
            if(view === 'login' || view === 'register') setView('dashboard');
          } else {
            setLoading(false);
            localStorage.removeItem('gpoint_user_email');
          }
        });
        return unsub;
      };
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [firebaseUser]);

  const handleLogout = () => {
    localStorage.removeItem('gpoint_user_email');
    setCurrentUser(null);
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
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* 導覽列 */}
      {currentUser && (
        <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="bg-orange-600 p-2 rounded-lg">
                <GCoinIcon className="w-6 h-6 text-yellow-300" />
              </div>
              <h1 className="text-xl font-bold tracking-wider hidden sm:block">聖誕超G拍</h1>
              <h1 className="text-xl font-bold tracking-wider sm:hidden">G-Point</h1>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4 mt-4 md:mt-0 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
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

              <div className="border-l border-slate-700 h-6 mx-2 hidden md:block"></div>

              <div className="flex items-center space-x-2 min-w-max">
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
function AuthScreen({ setView, view, setCurrentUser, db }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const initialAdminEmail = "domingo_yo@webgene.com.tw";

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. 檢查 Email 是否已存在 (模擬檢查，實際應使用 Firebase Auth)
      const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
      const snapshot = await getDocs(usersRef);
      const exists = snapshot.docs.some(doc => doc.data().email.toLowerCase() === email.toLowerCase());

      if (exists) {
        throw new Error("此 Email 已經註冊過囉！");
      }

      // 2. 建立新使用者
      const newUser = {
        email: email.toLowerCase(),
        password: password, // 注意：這僅為 Demo 需求模擬，真實專案請勿將密碼存入 Firestore
        username: username,
        gPoints: 1000, // 需求 #3: 初始 1000 點
        isAdmin: email.toLowerCase() === initialAdminEmail, // 需求 #4: 初始管理員設定
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(usersRef, newUser);
      
      const userWithId = { ...newUser, id: docRef.id };
      localStorage.setItem('gpoint_user_email', userWithId.email);
      setCurrentUser(userWithId);
      setView('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
      const snapshot = await getDocs(usersRef);
      // 手動尋找使用者 (符合 Rule 2: 避免複雜查詢)
      const userDoc = snapshot.docs.find(
        doc => doc.data().email.toLowerCase() === email.toLowerCase() && doc.data().password === password
      );

      if (userDoc) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        localStorage.setItem('gpoint_user_email', userData.email);
        setCurrentUser(userData);
        setView('dashboard');
      } else {
        throw new Error("帳號或密碼錯誤");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  
  // 頭像更換相關狀態
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatarSeed, setTempAvatarSeed] = useState('');

  // 自動關閉 Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // 取得所有任務
    const tasksRef = collection(db, ...getCollectionPath(COLLECTION_TASKS));
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 取得我的提交紀錄
    const subsRef = collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS));
    const unsubSubs = onSnapshot(subsRef, (snap) => {
      const mySubs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(sub => sub.userId === currentUser.id);
      setSubmissions(mySubs);
      setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubSubs();
    };
  }, [currentUser.id]);

  // 階段一：認領任務
  const handleClaim = async (task) => {
    try {
      const subRef = collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS));
      // 建立一筆狀態為 'claimed' 的紀錄
      await addDoc(subRef, {
        userId: currentUser.id,
        userEmail: currentUser.email,
        username: currentUser.username,
        taskId: task.id,
        taskTitle: task.title,
        reward: parseInt(task.reward),
        status: 'claimed', // 新增狀態：已認領 (尚未提交)
        claimedAt: serverTimestamp(),
        submittedAt: null
      });
      setToast({ message: `成功認領任務「${task.title}」！請準備完成後回來提交審核。`, type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: "認領失敗，請稍後再試", type: 'error' });
    }
  };

  // 階段二：提交審核
  const handleSubmit = async (subId, taskTitle) => {
    try {
      const subDocRef = doc(db, ...getCollectionPath(COLLECTION_SUBMISSIONS), subId);
      // 更新狀態為 'pending'
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

  // 頭像編輯邏輯
  const openAvatarModal = () => {
    setTempAvatarSeed(currentUser.avatarSeed || currentUser.email);
    setShowAvatarModal(true);
  };

  const handleRandomizeAvatar = () => {
    setTempAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleSaveAvatar = async () => {
    try {
      const userRef = doc(db, ...getCollectionPath(COLLECTION_USERS), currentUser.id);
      await updateDoc(userRef, { avatarSeed: tempAvatarSeed });
      setToast({ message: "頭像已更新！", type: 'success' });
      setShowAvatarModal(false);
    } catch (error) {
      console.error(error);
      setToast({ message: "更新失敗", type: 'error' });
    }
  };

  // 整合任務與提交狀態
  const taskList = useMemo(() => {
    return tasks.map(task => {
      // 找出針對此任務的最新一筆提交紀錄 (避免重複認領導致錯亂，取時間最新的)
      const taskSubs = submissions
        .filter(s => s.taskId === task.id)
        .sort((a, b) => {
           const timeA = a.claimedAt?.toMillis() || 0;
           const timeB = b.claimedAt?.toMillis() || 0;
           return timeB - timeA;
        });
      
      const sub = taskSubs[0]; // 最新的一筆
      
      let status = 'available'; // 預設：可認領
      
      if (sub) {
        if (sub.status === 'claimed') status = 'claimed_action_needed'; // 已認領，需提交
        else if (sub.status === 'pending') status = 'under_review';     // 審核中
        else if (sub.status === 'approved') status = 'completed';       // 已完成
        else if (sub.status === 'rejected') status = 'rejected';        // 被拒絕 (可重新認領)
      }
      
      return { ...task, status, subId: sub?.id };
    });
  }, [tasks, submissions]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-orange-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 md:right-10 z-[100] animate-bounce-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-slate-800 text-white border-orange-500' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertCircle className="w-6 h-6" />}
            <div>
              <p className="font-bold">{toast.type === 'success' ? '操作成功' : '發生錯誤'}</p>
              <p className="text-sm opacity-90">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Editor Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">更換頭像</h3>
            
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-100 shadow-inner bg-slate-50">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tempAvatarSeed}`} 
                    alt="Preview" 
                    className="w-full h-full"
                  />
                </div>
                <button 
                  onClick={handleRandomizeAvatar}
                  className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 transition group"
                  title="隨機產生"
                >
                  <RefreshCw className="w-5 h-5 text-orange-600 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button 
                onClick={handleSaveAvatar}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" /> 儲存更換
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 上半部：使用者資訊 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        
        <div className="relative group z-10">
          <img 
            src={getUserAvatar(currentUser)} 
            alt="Avatar" 
            className="w-24 h-24 rounded-full border-4 border-orange-50 shadow-md bg-white"
          />
          <button 
            onClick={openAvatarModal}
            className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full shadow-md hover:bg-orange-600 transition opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
            title="更換頭像"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 text-center md:text-left z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
            {currentUser.username}
            <button onClick={openAvatarModal} className="md:hidden text-slate-400">
                <Edit className="w-4 h-4" />
            </button>
          </h2>
          <p className="text-slate-500 text-sm mb-4">{currentUser.email}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <GCoinIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">擁有 G 點幣</p>
                <p className="text-xl font-bold text-slate-800">{currentUser.gPoints.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">已完成任務</p>
                <p className="text-xl font-bold text-slate-800">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 下半部：任務牆列表 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-orange-600" />
            任務牆
          </h3>
          <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            可領取: {taskList.filter(t => t.status === 'available' || t.status === 'rejected').length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskList.map(task => (
            <div 
              key={task.id} 
              className={`
                relative bg-white rounded-xl p-6 shadow-sm border transition-all duration-300 flex flex-col
                ${task.status === 'completed' ? 'border-green-200 bg-green-50/30' : 
                  task.status === 'under_review' ? 'border-blue-200 bg-blue-50/30' : 
                  task.status === 'claimed_action_needed' ? 'border-orange-300 bg-orange-50 shadow-md ring-2 ring-orange-100' :
                  'border-slate-200 hover:shadow-md hover:border-orange-200'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <GCoinIcon className="w-3 h-3" />
                  +{task.reward} G
                </div>
                {task.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                {task.status === 'under_review' && <Clock className="w-6 h-6 text-blue-500 animate-pulse" />}
                {task.status === 'claimed_action_needed' && <Info className="w-6 h-6 text-orange-600 animate-bounce" />}
                {task.status === 'rejected' && <XCircle className="w-6 h-6 text-red-400" />}
              </div>

              <h4 className="text-lg font-bold text-slate-800 mb-2">{task.title}</h4>
              <p className="text-slate-600 text-sm mb-6 flex-grow">{task.description}</p>

              <div className="mt-auto pt-4 border-t border-slate-100/50">
                {/* 狀態 1: 可認領 */}
                {(task.status === 'available' || task.status === 'rejected') && (
                  <button 
                    onClick={() => handleClaim(task)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2
                      ${task.status === 'rejected' 
                        ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                        : 'bg-slate-900 hover:bg-orange-600 text-white'}`}
                  >
                    {task.status === 'rejected' ? '上次被拒 - 重新認領' : '認領任務'} 
                    <Plus className="w-3 h-3" />
                  </button>
                )}
                
                {/* 狀態 2: 已認領，待提交 */}
                {task.status === 'claimed_action_needed' && (
                  <div className="space-y-2">
                    <div className="text-xs text-center text-orange-700 font-bold bg-orange-100 py-1 rounded">
                      已認領！請完成任務後提交
                    </div>
                    <button 
                      onClick={() => handleSubmit(task.subId, task.title)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-md"
                    >
                      提交審核 <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* 狀態 3: 審核中 */}
                {task.status === 'under_review' && (
                  <div className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium text-center cursor-default flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" /> 審核中...
                  </div>
                )}

                {/* 狀態 4: 已完成 */}
                {task.status === 'completed' && (
                  <div className="w-full bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium text-center cursor-default flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> 任務已完成
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {taskList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>目前沒有可用的任務，請稍後再回來查看！</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// --- 排行榜元件 ---
function Leaderboard({ db }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
    const unsub = onSnapshot(usersRef, (snap) => {
      const allUsers = snap.docs.map(d => d.data());
      // 在前端進行排序 (符合 Rule 2: 避免複雜查詢)
      const sorted = allUsers.sort((a, b) => b.gPoints - a.gPoints);
      setUsers(sorted);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          G 點幣排行榜
        </h2>
        <p className="text-slate-500 mt-2">即時更新所有使用者的 G 點幣排名</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold text-center w-20">排名</th>
                <th className="px-6 py-4 font-semibold">使用者</th>
                <th className="px-6 py-4 font-semibold text-right">G 點幣</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, index) => {
                let rankStyle = "text-slate-500 font-bold";
                let rowBg = "";
                
                if (index === 0) { rankStyle = "text-yellow-500 text-2xl drop-shadow-sm"; rowBg = "bg-yellow-50/50"; }
                else if (index === 1) { rankStyle = "text-slate-400 text-xl"; rowBg = "bg-slate-50/50"; }
                else if (index === 2) { rankStyle = "text-orange-400 text-xl"; rowBg = "bg-orange-50/50"; }

                return (
                  <tr key={user.email} className={`hover:bg-slate-50 transition ${rowBg}`}>
                    <td className="px-6 py-4 text-center">
                      <span className={rankStyle}>#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getUserAvatar(user)} 
                          alt="" 
                          className="w-10 h-10 rounded-full bg-white shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{user.username}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        {user.isAdmin && (
                          <span className="bg-pink-100 text-pink-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">ADMIN</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-orange-600 text-lg">
                        {user.gPoints.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- 管理者後台元件 ---
function AdminPanel({ db, currentUser }) {
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, reviews, users

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col md:flex-row overflow-hidden animate-fade-in">
      {/* 側邊欄 */}
      <aside className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-8 text-slate-800 font-bold">
          <Shield className="w-5 h-5 text-pink-600" />
          管理者後台
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'tasks' ? 'bg-white shadow-sm text-orange-700 font-bold border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ListTodo className="w-4 h-4" />
            任務管理
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'reviews' ? 'bg-white shadow-sm text-orange-700 font-bold border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <CheckCircle className="w-4 h-4" />
            審核提交
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'users' ? 'bg-white shadow-sm text-orange-700 font-bold border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" />
            會員管理
          </button>
        </div>
      </aside>

      {/* 內容區 */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">
        {activeTab === 'tasks' && <AdminTasks db={db} />}
        {activeTab === 'reviews' && <AdminReviews db={db} />}
        {activeTab === 'users' && <AdminUsers db={db} myEmail={currentUser.email} />}
      </div>
    </div>
  );
}

// --- 後台子元件: 任務管理 ---
function AdminTasks({ db }) {
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState({ title: '', description: '', reward: 100 });
  const [editId, setEditId] = useState(null);
  // 新增刪除確認狀態
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, ...getCollectionPath(COLLECTION_TASKS)), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tasksRef = collection(db, ...getCollectionPath(COLLECTION_TASKS));
    
    try {
      if (editId) {
        await updateDoc(doc(tasksRef, editId), {
          ...currentTask,
          reward: parseInt(currentTask.reward)
        });
      } else {
        await addDoc(tasksRef, {
          ...currentTask,
          reward: parseInt(currentTask.reward),
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    // 簡單的兩階段刪除確認：點第一次顯示確認，點第二次執行刪除
    if (deleteConfirmId === id) {
      await deleteDoc(doc(db, ...getCollectionPath(COLLECTION_TASKS), id));
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // 3秒後自動取消確認狀態
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const startEdit = (task) => {
    setCurrentTask({ title: task.title, description: task.description, reward: task.reward });
    setEditId(task.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    setCurrentTask({ title: '', description: '', reward: 100 });
    setEditId(null);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">任務列表與編輯</h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 新增任務
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">任務標題</label>
              <input 
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none" 
                value={currentTask.title}
                onChange={e => setCurrentTask({...currentTask, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">G 點幣獎勵</label>
              <input 
                required
                type="number"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none" 
                value={currentTask.reward}
                onChange={e => setCurrentTask({...currentTask, reward: e.target.value})}
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">任務描述內容</label>
              <textarea 
                required
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none" 
                value={currentTask.description}
                onChange={e => setCurrentTask({...currentTask, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-700 px-4 py-2">取消</button>
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 font-bold">
              {editId ? '更新任務' : '建立任務'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">+{task.reward} G</span>
                <h4 className="font-bold text-slate-800">{task.title}</h4>
              </div>
              <p className="text-sm text-slate-500 truncate max-w-md">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(task)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition">
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(task.id)} 
                className={`p-2 rounded transition flex items-center gap-1 ${deleteConfirmId === task.id ? 'bg-red-600 text-white w-auto px-3' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
              >
                <Trash2 className="w-4 h-4" />
                {deleteConfirmId === task.id && <span className="text-xs font-bold">確認?</span>}
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-slate-400 py-4">目前沒有任務</p>}
      </div>
    </div>
  );
}

// --- 後台子元件: 審核提交 ---
function AdminReviews({ db }) {
  const [submissions, setSubmissions] = useState([]);
  const [actionConfirm, setActionConfirm] = useState(null); // { sub, type }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const subRef = collection(db, ...getCollectionPath(COLLECTION_SUBMISSIONS));
    const unsub = onSnapshot(subRef, (snap) => {
      // 過濾出 'pending' 狀態的提交
      const pending = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.status === 'pending')
        .sort((a, b) => {
            const getTime = (timestamp) => {
                if (!timestamp) return Date.now();
                if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
                return 0;
            };
            return getTime(b.submittedAt) - getTime(a.submittedAt);
        });
      setSubmissions(pending);
    });
    return () => unsub();
  }, []);

  const handleReviewClick = (sub, type) => {
    setActionConfirm({ sub, type });
  };

  const executeReview = async () => {
    if (!actionConfirm) return;
    const { sub, type } = actionConfirm;
    
    try {
      const subRef = doc(db, ...getCollectionPath(COLLECTION_SUBMISSIONS), sub.id);
      
      if (type === 'approved') {
        await updateDoc(subRef, { status: 'approved', reviewedAt: serverTimestamp() });
        const userRef = doc(db, ...getCollectionPath(COLLECTION_USERS), sub.userId);
        await updateDoc(userRef, { gPoints: increment(sub.reward) });
        setToast({ type: 'success', message: `已批准 ${sub.username} 的任務` });
      } else {
        await updateDoc(subRef, { status: 'rejected', reviewedAt: serverTimestamp() });
        setToast({ type: 'success', message: `已否決該任務` });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: "審核操作失敗" });
    } finally {
      setActionConfirm(null);
    }
  };

  return (
    <div className="relative">
      {/* 自訂 Toast */}
      {toast && (
        <div className={`fixed bottom-10 right-10 px-6 py-3 rounded-lg shadow-xl border z-50 animate-bounce-in flex items-center gap-3 ${toast.type === 'success' ? 'bg-slate-800 text-white border-orange-500' : 'bg-red-100 text-red-700 border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 確認 Modal */}
      {actionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {actionConfirm.type === 'approved' ? '確認批准任務？' : '確認否決任務？'}
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              {actionConfirm.type === 'approved' 
                ? `將發放 ${actionConfirm.sub.reward} G 點幣給 ${actionConfirm.sub.username}。` 
                : '否決後，使用者可以重新提交此任務。'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setActionConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                取消
              </button>
              <button 
                onClick={executeReview}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-bold shadow-md
                  ${actionConfirm.type === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                確認{actionConfirm.type === 'approved' ? '批准' : '否決'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-800 mb-6">待審核任務 ({submissions.length})</h3>
      
      <div className="space-y-4">
        {submissions.map(sub => (
          <div key={sub.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-800">{sub.username}</span>
                <span className="text-xs text-slate-400">({sub.userEmail})</span>
              </div>
              <p className="text-sm text-slate-600">
                提交了任務：<span className="font-bold text-orange-700">{sub.taskTitle}</span> (+{sub.reward}G)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                提交時間：{sub.submittedAt ? (typeof sub.submittedAt.toDate === 'function' ? sub.submittedAt.toDate().toLocaleString() : '剛剛') : '剛剛'}
              </p>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleReviewClick(sub, 'rejected')}
                className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition"
              >
                否決
              </button>
              <button 
                onClick={() => handleReviewClick(sub, 'approved')}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition shadow-sm"
              >
                批准 (+{sub.reward}G)
              </button>
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">目前沒有待審核的任務</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 後台子元件: 會員管理 ---
function AdminUsers({ db, myEmail }) {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) setTimeout(() => setToast(null), 3000);
  }, [toast]);

  useEffect(() => {
    const usersRef = collection(db, ...getCollectionPath(COLLECTION_USERS));
    const unsub = onSnapshot(usersRef, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const toggleAdmin = async (user) => {
    if (user.email === myEmail) {
        setToast({ type: 'error', message: "不能修改自己的權限" });
        return;
    }

    try {
      const userRef = doc(db, ...getCollectionPath(COLLECTION_USERS), user.id);
      await updateDoc(userRef, { isAdmin: !user.isAdmin });
      setToast({ type: 'success', message: `已${user.isAdmin ? '取消' : '設定'} ${user.username} 為管理員` });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: "權限修改失敗" });
    }
  };

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed bottom-10 right-10 px-6 py-3 rounded-lg shadow-xl border z-50 animate-bounce-in flex items-center gap-3 ${toast.type === 'success' ? 'bg-slate-800 text-white border-orange-500' : 'bg-red-100 text-red-700 border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-800 mb-6">會員列表 ({users.length})</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
              <th className="py-3 px-2">使用者</th>
              <th className="py-3 px-2">Email</th>
              <th className="py-3 px-2 text-right">目前點數</th>
              <th className="py-3 px-2 text-center">權限</th>
              <th className="py-3 px-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="py-3 px-2 font-medium text-slate-800">{user.username}</td>
                <td className="py-3 px-2 text-slate-500 text-sm">{user.email}</td>
                <td className="py-3 px-2 text-right font-mono text-orange-600">{user.gPoints}</td>
                <td className="py-3 px-2 text-center">
                  {user.isAdmin ? (
                    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-bold">Admin</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">Member</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  {user.email !== myEmail && (
                    <button 
                      onClick={() => toggleAdmin(user)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {user.isAdmin ? '移除管理員' : '設為管理員'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}