/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Menu, 
  X, 
  ChevronRight,
  ChevronDown, 
  Quote, 
  Linkedin, 
  Instagram, 
  Mail,
  Compass,
  Users,
  Lightbulb,
  Heart,
  Lock,
  LogOut,
  Trash2,
  CheckCircle,
  Eye,
  Plus,
  ShieldCheck,
  UserPlus,
  Settings,
  FileText
} from "lucide-react";
import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// --- Types & Constants ---

interface SiteContent {
  hero: {
    badge: string;
    titleMain: string;
    titleItalic: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  about: {
    subtitle: string;
    title: string;
    description1: string;
    description2: string;
    cta: string;
  };
  philosophy: {
    quote: string;
    author: string;
    line1: string;
    line2: string;
  };
  mission?: {
    summary: string;
    content1: string;
    content2: string;
  };
  vision?: {
    summary: string;
    description: string;
    content1: string;
    content2: string;
    content3: string;
    footer: string;
  };
  ceoMessage: {
    subtitle: string;
    title: string;
    message: string;
    name: string;
    position: string;
  };
  values?: Array<{
    letter: string;
    label: string;
    description: string;
  }>;
  growthModel?: Array<{
    letter: string;
    label: string;
    summary: string;
    description: string;
  }>;
  contact: {
    subtitle: string;
    title: string;
    description: string;
    email: string;
    instagram: string;
    linkedin: string;
    kakao?: string;
  };
}

const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: "Professional Coaching Lab",
    titleMain: "Dialogue",
    titleItalic: "as a Weaving Art",
    description: "당신의 일상이 예술이 되는 순간, 코에이브가 함께 대화로 삶의 문양을 엮어갑니다.",
    ctaPrimary: "Explore Programs",
    ctaSecondary: "Our Story"
  },
  about: {
    subtitle: "The Concept",
    title: "Coaching + Weave",
    description1: "코에이브(COAVE)는 코칭(Coaching)과 엮다(Weave)의 합성어로, 코치와 코치이가 대화를 통해 흩어진 생각의 실타래를 정교하게 엮어 새로운 삶의 무늬를 만들어가는 과정을 상징합니다.",
    description2: "우리는 단순히 답을 주는 것을 넘어, 당신이 이미 가지고 있는 지혜의 실들을 발견하고 그것이 아름다운 직물이 될 수 있도록 섬세하게 돕는 '라이프 위버(Life Weaver)'들의 안식처입니다.",
    cta: "Our Vision"
  },
  philosophy: {
    quote: "The beauty of coaching lies in the invisible threads that connect us.",
    author: "the invisible threads",
    line1: "코칭은 단순한 대화가 아닙니다.",
    line2: "그것은 서로의 영혼이 만나 함께 성장이라는 거대한 문양을 수놓는 숭고한 예술 행위입니다."
  },
  mission: {
    summary: "사람의 가능성을 발견하고, 성장의 구조를 설계하며, 삶의 변화를 현실로 연결한다.",
    content1: "COAVE는 한 사람 안에 이미 존재하는 가능성을 발견하고, 그 가능성이 행동으로 이어지며, 그 행동이 지속 가능한 변화와 성과로 연결되도록 돕는 성장 파트너가 되고자 합니다.",
    content2: "개인의 성장이 조직의 변화로, 조직의 변화가 더 큰 사회적 가치로 확장될 수 있도록 COAVE는 함께합니다."
  },
  vision: {
    summary: "Beyond Coaching. Designing Human Growth.",
    description: "코칭을 넘어, 사람의 성장 시스템을 설계하는 브랜드",
    content1: "COAVE는 한 사람의 성장이 개인의 변화에 머무르지 않고, 가정의 변화가 되고, 조직의 변화가 되며, 더 나은 사회로 확장될 수 있다고 믿습니다.",
    content2: "우리는 사람 안에 이미 존재하는 가능성을 발견하고, 그 가능성이 배움과 실천을 통해 현실이 되도록 돕는 지속 가능한 성장의 구조를 만들어갑니다.",
    content3: "한 사람의 성장이 조직의 변화가 되고, 조직의 변화가 더 나은 세상으로 확장되는 성장 생태계를 만드는 것.",
    footer: "그것이 COAVE Coaching Lab 가 꿈꾸는 비전입니다."
  },
  values: [
    { letter: "C", label: "Connect", description: "사람과 사람, 경험과 통찰, 현재와 미래를 연결합니다." },
    { letter: "O", label: "Observe", description: "판단보다 이해로, 평가보다 호기심으로 바라봅니다." },
    { letter: "A", label: "Add Value", description: "삶에 가치, 신념, 사랑, 실천을 더합니다." },
    { letter: "V", label: "Voice & Vision", description: "내 안의 목소리를 발견하고 더 큰 비전을 향합니다." },
    { letter: "E", label: "Evolve", description: "배움을 행동으로, 행동을 변화로, 변화를 성장으로 연결합니다." }
  ],
  growthModel: [
    { letter: "C", label: "Connect", summary: "신뢰 관계 형성", description: "안전한 대화와 진정한 연결의 시작" },
    { letter: "O", label: "Observe", summary: "현재 인식", description: "감정, 행동, 강점, 패턴 발견" },
    { letter: "A", label: "Align", summary: "가치와 목표 정렬", description: "삶의 방향성과 목적 재설계" },
    { letter: "V", label: "Validate", summary: "실행 검증", description: "행동, 피드백, 반복, 습관화" },
    { letter: "E", label: "Expand", summary: "성장 확장", description: "개인에서 조직으로, 조직에서 영향력으로" }
  ],
  ceoMessage: {
    subtitle: "CEO Message",
    title: "Connecting Your Potential to Reality",
    message: "안녕하세요.\nCOAVE를 찾아주신 여러분께 진심으로 감사드립니다.\n\n우리는 모두 더 나은 삶을 꿈꿉니다.\n그러나 진정한 변화는 누군가 정답을 알려줄 때가 아니라,\n내 안에 이미 존재하는 가능성을 발견하고\n그 가능성을 행동으로 연결할 때 시작된다고 믿습니다.\n\nCOAVE는 Coaching과 Weave의 의미처럼,\n사람과 사람,\n배움과 실천,\n현재와 미래,\n가능성과 변화의 순간들을 연결하기 위해 시작된 브랜드입니다.\n\n우리는 한 사람의 성장이\n개인의 변화에 머무르지 않고,\n가정의 변화가 되고,\n조직의 변화가 되며,\n더 나은 사회로 확장될 수 있다고 믿습니다.\n\nCOAVE는 단순히 코칭을 제공하는 곳이 아니라,\n한 사람 안에 이미 존재하는 가능성이\n삶 속에서 현실이 되도록 함께하는\n진정한 성장 파트너가 되고자 합니다.\n\n여러분의 가능성이\n가치 있는 변화로 이어지는 여정에\nCOAVE가 함께하겠습니다.\n\n감사합니다.",
    name: "이인주",
    position: "Learning Director"
  },
  contact: {
    subtitle: "Connect",
    title: "Start Your Journey",
    description: "당신의 성장을 위한 첫 번째 대화를 시작하세요. 코에이브의 문은 정기적인 코칭 상담을 원하는 분들에게 언제나 열려있습니다.",
    email: "coaveadmin@gmail.com",
    instagram: "@coave_coaching",
    linkedin: "Coave Coaching Lab",
    kakao: "https://open.kakao.com/me/coave"
  }
};

// --- Components ---

const AdminDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'admins' | 'content'>('inquiries');
  
  // Content state
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [isSavingContent, setIsSavingContent] = useState(false);
  
  // Admin form state
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      setIsCheckingAdmin(true);
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists() || user.email === 'sadsoul1103@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Admin check error:", error);
        if (user.email === 'sadsoul1103@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, [user.uid, user.email]);

  useEffect(() => {
    if (!isAdmin) return;

    // Listen to inquiries
    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubInquiries = onSnapshot(qInquiries, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInquiries(data);
      if (activeTab === 'inquiries') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inquiries');
    });

    // Listen to admins
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(data);
      if (activeTab === 'admins') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admins');
    });

    // Fetch Content
    const unsubContent = onSnapshot(doc(db, 'content', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setContent({
          hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
          about: { ...DEFAULT_CONTENT.about, ...data.about },
          philosophy: { ...DEFAULT_CONTENT.philosophy, ...data.philosophy },
          mission: { ...DEFAULT_CONTENT.mission, ...data.mission },
          vision: { ...DEFAULT_CONTENT.vision, ...data.vision },
          ceoMessage: { ...DEFAULT_CONTENT.ceoMessage, ...data.ceoMessage },
          values: data.values || DEFAULT_CONTENT.values,
          growthModel: data.growthModel || DEFAULT_CONTENT.growthModel,
          contact: { ...DEFAULT_CONTENT.contact, ...data.contact },
        });
      }
      if (activeTab === 'content') setLoading(false);
    });

    return () => {
      unsubInquiries();
      unsubAdmins();
      unsubContent();
    };
  }, [isAdmin, activeTab]);

  const handleSaveContent = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingContent(true);
    try {
      await setDoc(doc(db, 'content', 'site'), content);
      alert('콘텐츠가 성공적으로 저장되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'content/site');
      alert('콘텐츠 저장에 실패했습니다.');
    } finally {
      setIsSavingContent(false);
    }
  };

  const updateContentField = (section: keyof SiteContent, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      // Automatically reset confirmation state after 3 seconds if not confirmed
      setTimeout(() => {
        setDeletingId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    console.log(`Attempting to delete inquiry: ${id}`);
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      alert('문의가 성공적으로 삭제되었습니다.');
      setDeletingId(null);
      console.log(`Successfully deleted inquiry: ${id}`);
    } catch (error) {
      console.error(`Failed to delete inquiry: ${id}`, error);
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${id}`);
      alert('문의 삭제에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    console.log(`Updating status for inquiry: ${id} to ${status}`);
    try {
      await updateDoc(doc(db, 'inquiries', id), { status });
      alert('상태가 업데이트되었습니다.');
    } catch (error) {
      console.error(`Failed to update inquiry status: ${id}`, error);
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdminUid || !newAdminEmail) return;

    try {
      await setDoc(doc(db, 'admins', newAdminUid.trim()), {
        uid: newAdminUid.trim(),
        email: newAdminEmail.trim(),
        addedAt: serverTimestamp(),
        addedBy: user.email
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      alert('관리자가 성공적으로 추가되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${newAdminUid}`);
      alert('관리자 추가에 실패했습니다.');
    }
  };

  const [deletingAdminUid, setDeletingAdminUid] = useState<string | null>(null);

  const handleDeleteAdmin = async (adminUid: string) => {
    if (adminUid === user.uid) {
      alert('자기 자신은 삭제할 수 없습니다.');
      return;
    }

    if (deletingAdminUid !== adminUid) {
      setDeletingAdminUid(adminUid);
      setTimeout(() => {
        setDeletingAdminUid(prev => prev === adminUid ? null : prev);
      }, 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'admins', adminUid));
      alert('관리자가 삭제되었습니다.');
      setDeletingAdminUid(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${adminUid}`);
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center">
        <Lock size={48} className="text-brand-rose mb-6" />
        <h2 className="text-3xl font-serif mb-4">접근 권한이 없습니다</h2>
        <p className="text-brand-navy/60 mb-8 max-w-md">관리자 계정으로 로그인해주세요.</p>
        <button 
          onClick={onLogout}
          className="px-8 py-3 bg-brand-navy text-brand-cream text-xs uppercase tracking-widest font-bold"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-2 block">Management</span>
            <h2 className="text-4xl md:text-5xl font-serif italic">Dashboard</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex bg-white/50 p-1 rounded-sm border border-brand-navy/5">
              <button 
                onClick={() => setActiveTab('inquiries')}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${activeTab === 'inquiries' ? 'bg-brand-navy text-brand-cream shadow-md' : 'text-brand-navy/40 hover:text-brand-navy'}`}
              >
                Inquiries
              </button>
              <button 
                onClick={() => setActiveTab('admins')}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${activeTab === 'admins' ? 'bg-brand-navy text-brand-cream shadow-md' : 'text-brand-navy/40 hover:text-brand-navy'}`}
              >
                Admins
              </button>
              <button 
                onClick={() => setActiveTab('content')}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${activeTab === 'content' ? 'bg-brand-navy text-brand-cream shadow-md' : 'text-brand-navy/40 hover:text-brand-navy'}`}
              >
                Content
              </button>
            </div>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-navy/60 hover:text-brand-rose transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
          </div>
        ) : activeTab === 'inquiries' ? (
          // --- Inquiries Tab ---
          inquiries.length === 0 ? (
            <div className="bg-white p-20 rounded-[2rem] text-center border border-brand-navy/5">
              <Mail size={40} className="mx-auto mb-6 text-brand-navy/20" />
              <p className="text-brand-navy/40 font-light">수신된 문의가 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {inquiries.map((inquiry) => (
                <motion.div 
                  layout
                  key={inquiry.id}
                  className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-8"
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold ${
                        inquiry.status === 'new' ? 'bg-blue-100 text-blue-600' : 
                        inquiry.status === 'replied' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {inquiry.status}
                      </span>
                      <span className="text-[10px] text-brand-navy/40 uppercase tracking-widest">
                        {inquiry.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-serif mb-1">{inquiry.name}</h3>
                      <p className="text-sm text-brand-gold font-medium mb-2">{inquiry.email}</p>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/50 py-1 px-3 border border-brand-navy/10 rounded-sm inline-block mb-4">
                        {inquiry.service}
                      </div>
                      <p className="text-brand-navy/80 font-light leading-relaxed whitespace-pre-wrap text-sm">
                        {inquiry.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-3 md:min-w-[140px]">
                    {inquiry.status === 'new' && (
                      <button 
                        onClick={() => handleStatusUpdate(inquiry.id, 'replied')}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-navy text-brand-cream text-[9px] uppercase tracking-widest font-bold hover:bg-brand-gold transition-colors rounded-sm"
                      >
                        <CheckCircle size={14} /> Mark Replied
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(inquiry.id)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-sm transition-all text-[9px] uppercase tracking-widest font-bold ${
                        deletingId === inquiry.id 
                          ? "bg-brand-rose text-white shadow-lg scale-105" 
                          : "border border-brand-rose/20 text-brand-rose hover:bg-brand-rose hover:text-white"
                      }`}
                    >
                      <Trash2 size={14} /> 
                      {deletingId === inquiry.id ? "Confirm Delete" : "Delete"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : activeTab === 'content' ? (
          // --- Content Tab ---
          <div className="space-y-12">
            <form onSubmit={handleSaveContent} className="space-y-12">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-brand-navy/5 shadow-sm sticky top-24 z-20">
                <div className="flex items-center gap-3">
                  <FileText className="text-brand-gold" />
                  <h3 className="text-lg font-serif">웹사이트 텍스트 편집</h3>
                </div>
                <button 
                  type="submit"
                  disabled={isSavingContent}
                  className="px-10 py-3 bg-brand-gold text-brand-cream text-[10px] uppercase tracking-widest font-bold hover:bg-brand-navy transition-all rounded-sm shadow-lg disabled:opacity-50"
                >
                  {isSavingContent ? '저장 중...' : '모든 변경사항 저장'}
                </button>
              </div>

              <div className="grid gap-8">
                {/* Hero Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Hero Section</h4>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Badge Text</label>
                      <input 
                        type="text"
                        value={content.hero.badge}
                        onChange={(e) => updateContentField('hero', 'badge', e.target.value)}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Title (Main)</label>
                        <input 
                          type="text"
                          value={content.hero.titleMain}
                          onChange={(e) => updateContentField('hero', 'titleMain', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Title (Italic)</label>
                        <input 
                          type="text"
                          value={content.hero.titleItalic}
                          onChange={(e) => updateContentField('hero', 'titleItalic', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description</label>
                      <textarea 
                        value={content.hero.description}
                        onChange={(e) => updateContentField('hero', 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">CTA Primary</label>
                        <input 
                          type="text"
                          value={content.hero.ctaPrimary}
                          onChange={(e) => updateContentField('hero', 'ctaPrimary', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">CTA Secondary</label>
                        <input 
                          type="text"
                          value={content.hero.ctaSecondary}
                          onChange={(e) => updateContentField('hero', 'ctaSecondary', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">About Section</h4>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Subtitle</label>
                        <input 
                          type="text"
                          value={content.about.subtitle}
                          onChange={(e) => updateContentField('about', 'subtitle', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Title</label>
                        <input 
                          type="text"
                          value={content.about.title}
                          onChange={(e) => updateContentField('about', 'title', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description Paragraph 1</label>
                      <textarea 
                        value={content.about.description1}
                        onChange={(e) => updateContentField('about', 'description1', e.target.value)}
                        rows={3}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description Paragraph 2</label>
                      <textarea 
                        value={content.about.description2}
                        onChange={(e) => updateContentField('about', 'description2', e.target.value)}
                        rows={3}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Philosophy Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Philosophy Section</h4>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Quote</label>
                      <textarea 
                        value={content.philosophy.quote}
                        onChange={(e) => updateContentField('philosophy', 'quote', e.target.value)}
                        rows={2}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm italic font-serif"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Quote Emphasis/Author</label>
                        <input 
                          type="text"
                          value={content.philosophy.author}
                          onChange={(e) => updateContentField('philosophy', 'author', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Line 1</label>
                        <input 
                          type="text"
                          value={content.philosophy.line1}
                          onChange={(e) => updateContentField('philosophy', 'line1', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Line 2</label>
                        <input 
                          type="text"
                          value={content.philosophy.line2}
                          onChange={(e) => updateContentField('philosophy', 'line2', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Mission Section</h4>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Summary</label>
                      <input 
                        type="text"
                        value={content.mission?.summary || ''}
                        onChange={(e) => updateContentField('mission', 'summary', e.target.value)}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Content 1</label>
                      <textarea 
                        value={content.mission?.content1 || ''}
                        onChange={(e) => updateContentField('mission', 'content1', e.target.value)}
                        rows={3}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Content 2</label>
                      <textarea 
                        value={content.mission?.content2 || ''}
                        onChange={(e) => updateContentField('mission', 'content2', e.target.value)}
                        rows={2}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none italic"
                      />
                    </div>
                  </div>
                </div>

                {/* Vision Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Vision Section</h4>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Summary</label>
                        <input 
                          type="text"
                          value={content.vision?.summary || ''}
                          onChange={(e) => updateContentField('vision', 'summary', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm font-serif italic"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description</label>
                        <input 
                          type="text"
                          value={content.vision?.description || ''}
                          onChange={(e) => updateContentField('vision', 'description', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Content 1</label>
                      <textarea 
                        value={content.vision?.content1 || ''}
                        onChange={(e) => updateContentField('vision', 'content1', e.target.value)}
                        rows={3}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Content 2</label>
                      <textarea 
                        value={content.vision?.content2 || ''}
                        onChange={(e) => updateContentField('vision', 'content2', e.target.value)}
                        rows={3}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Content 3 (Emphasis)</label>
                      <input 
                        type="text"
                        value={content.vision?.content3 || ''}
                        onChange={(e) => updateContentField('vision', 'content3', e.target.value)}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Footer Quote</label>
                      <input 
                        type="text"
                        value={content.vision?.footer || ''}
                        onChange={(e) => updateContentField('vision', 'footer', e.target.value)}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm italic"
                      />
                    </div>
                  </div>
                </div>

                {/* CEO Message Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">CEO Message</h4>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Subtitle</label>
                        <input 
                          type="text"
                          value={content.ceoMessage.subtitle}
                          onChange={(e) => updateContentField('ceoMessage', 'subtitle', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Title</label>
                        <input 
                          type="text"
                          value={content.ceoMessage.title}
                          onChange={(e) => updateContentField('ceoMessage', 'title', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm font-serif italic"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Message</label>
                      <textarea 
                        value={content.ceoMessage.message}
                        onChange={(e) => updateContentField('ceoMessage', 'message', e.target.value)}
                        rows={10}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none leading-relaxed"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">CEO Name</label>
                        <input 
                          type="text"
                          value={content.ceoMessage.name}
                          onChange={(e) => updateContentField('ceoMessage', 'name', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm font-serif"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Role/Position</label>
                        <input 
                          type="text"
                          value={content.ceoMessage.position}
                          onChange={(e) => updateContentField('ceoMessage', 'position', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm uppercase tracking-widest"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Values Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Core Values Section</h4>
                  <div className="space-y-8">
                    {content.values?.map((v, idx) => (
                      <div key={idx} className="p-4 bg-brand-cream/20 rounded-xl border border-brand-navy/5 space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Letter</label>
                            <input 
                              type="text"
                              value={v.letter}
                              onChange={(e) => {
                                const newValues = [...(content.values || [])];
                                newValues[idx] = { ...v, letter: e.target.value };
                                setContent(prev => ({ ...prev, values: newValues }));
                              }}
                              className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm text-center font-serif"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Label</label>
                            <input 
                              type="text"
                              value={v.label}
                              onChange={(e) => {
                                const newValues = [...(content.values || [])];
                                newValues[idx] = { ...v, label: e.target.value };
                                setContent(prev => ({ ...prev, values: newValues }));
                              }}
                              className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description</label>
                          <textarea 
                            value={v.description}
                            onChange={(e) => {
                              const newValues = [...(content.values || [])];
                              newValues[idx] = { ...v, description: e.target.value };
                              setContent(prev => ({ ...prev, values: newValues }));
                            }}
                            rows={2}
                            className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Model Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Growth Model Section</h4>
                  <div className="space-y-8">
                    {content.growthModel?.map((m, idx) => (
                      <div key={idx} className="p-4 bg-brand-cream/20 rounded-xl border border-brand-navy/5 space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Letter</label>
                            <input 
                              type="text"
                              value={m.letter}
                              onChange={(e) => {
                                const newModel = [...(content.growthModel || [])];
                                newModel[idx] = { ...m, letter: e.target.value };
                                setContent(prev => ({ ...prev, growthModel: newModel }));
                              }}
                              className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm text-center font-serif"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Label</label>
                            <input 
                              type="text"
                              value={m.label}
                              onChange={(e) => {
                                const newModel = [...(content.growthModel || [])];
                                newModel[idx] = { ...m, label: e.target.value };
                                setContent(prev => ({ ...prev, growthModel: newModel }));
                              }}
                              className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Summary (Short Label)</label>
                          <input 
                            type="text"
                            value={m.summary}
                            onChange={(e) => {
                              const newModel = [...(content.growthModel || [])];
                              newModel[idx] = { ...m, summary: e.target.value };
                              setContent(prev => ({ ...prev, growthModel: newModel }));
                            }}
                            className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm font-bold text-brand-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description</label>
                          <textarea 
                            value={m.description}
                            onChange={(e) => {
                              const newModel = [...(content.growthModel || [])];
                              newModel[idx] = { ...m, description: e.target.value };
                              setContent(prev => ({ ...prev, growthModel: newModel }));
                            }}
                            rows={2}
                            className="w-full bg-white border border-brand-navy/10 rounded-sm px-4 py-2 text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact & Footer Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm space-y-6">
                  <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold border-b border-brand-navy/5 pb-2">Contact & Footer</h4>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Subtitle</label>
                        <input 
                          type="text"
                          value={content.contact.subtitle}
                          onChange={(e) => updateContentField('contact', 'subtitle', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Title</label>
                        <input 
                          type="text"
                          value={content.contact.title}
                          onChange={(e) => updateContentField('contact', 'title', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Description</label>
                      <textarea 
                        value={content.contact.description}
                        onChange={(e) => updateContentField('contact', 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm resize-none"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Email</label>
                        <input 
                          type="text"
                          value={content.contact.email}
                          onChange={(e) => updateContentField('contact', 'email', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">KakaoTalk Link</label>
                        <input 
                          type="text"
                          value={content.contact.kakao || ""}
                          onChange={(e) => updateContentField('contact', 'kakao', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                          placeholder="https://open.kakao.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">Instagram</label>
                        <input 
                          type="text"
                          value={content.contact.instagram}
                          onChange={(e) => updateContentField('contact', 'instagram', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">LinkedIn</label>
                        <input 
                          type="text"
                          value={content.contact.linkedin}
                          onChange={(e) => updateContentField('contact', 'linkedin', e.target.value)}
                          className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          // --- Admins Tab ---
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm">
              <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                <UserPlus size={20} className="text-brand-gold" />
                관리자 추가
              </h3>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">User UID</label>
                  <input 
                    type="text"
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    placeholder="Auth에서 확인한 UID 입력"
                    required
                    className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/40">User Email</label>
                  <input 
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="사용자 이메일 입력"
                    required
                    className="w-full bg-brand-cream/30 border border-brand-navy/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-brand-gold text-brand-cream text-[9px] uppercase tracking-widest font-bold hover:bg-brand-navy transition-all rounded-sm shadow-md"
                  >
                    관리자 등록
                  </button>
                </div>
              </form>
              <p className="mt-4 text-[10px] text-brand-navy/40 italic">
                * UID는 Firebase Console의 Authentication 탭에서 확인할 수 있습니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm">
              <h3 className="text-xl font-serif mb-6">현재 관리자 목록</h3>
              <div className="grid gap-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border border-brand-navy/5 rounded-xl hover:bg-brand-cream/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy/40">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{admin.email}</p>
                        <p className="text-[10px] text-brand-navy/40 font-mono">{admin.uid}</p>
                      </div>
                    </div>
                    {admin.uid !== user.uid && (
                      <button 
                        onClick={() => handleDeleteAdmin(admin.uid)}
                        className={`p-2 rounded-full transition-all flex items-center gap-2 ${
                          deletingAdminUid === admin.uid 
                            ? "text-white bg-brand-rose" 
                            : "text-brand-rose/40 hover:text-brand-rose hover:bg-brand-rose/5"
                        }`}
                        title={deletingAdminUid === admin.uid ? "Confirm Delete" : "관리자 권한 삭제"}
                      >
                        <Trash2 size={16} />
                        {deletingAdminUid === admin.uid && <span className="text-[9px] font-bold uppercase">Confirm</span>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const scrollToSection = (id: string) => {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const element = document.getElementById(id);
  if (element) {
    const navbarHeight = 80;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - navbarHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "CEO Message", href: "#ceo-message" },
    { name: "Coaches", href: "#coaches" },
    { name: "Programs", href: "#programs" },
    { name: "Values", href: "#values" },
    { name: "Philosophy", href: "#philosophy" },
    { name: "Vision", href: "#vision" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? "bg-brand-cream/90 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => {
              scrollToSection('home');
              setIsMenuOpen(false);
            }}
          >
            <img 
              src="/logo_bg_removed.png" 
              className="h-10 md:h-12 w-auto object-contain" 
              alt="COAVE" 
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="flex flex-col items-center leading-none gap-0.5 text-center">
              <span className="text-xl font-serif font-bold tracking-[0.15em] text-brand-navy">COAVE</span>
              <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-brand-gold opacity-80">Coaching Lab</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link, idx) => (
              <motion.a
                key={link.name}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href.replace('#', ''));
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-xs uppercase tracking-widest font-medium hover:text-brand-gold transition-colors cursor-pointer"
              >
                {link.name}
              </motion.a>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 border border-brand-navy text-xs uppercase tracking-widest font-semibold hover:bg-brand-navy hover:text-brand-cream transition-all cursor-pointer"
              onClick={() => scrollToSection('contact')}
            >
              Inquiry
            </motion.button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-brand-navy hover:text-brand-gold transition-colors relative z-[110]" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-brand-cream md:hidden flex flex-col items-center justify-center px-6"
          >
            <div className="flex flex-col gap-10 items-center w-full max-w-xs transition-all">
              <div className="mb-8 flex flex-col items-center leading-none gap-0.5 text-center">
                <span className="text-4xl font-serif font-bold tracking-[0.15em] text-brand-navy">COAVE</span>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold opacity-80">Coaching Lab</span>
              </div>
              
              <div className="flex flex-col gap-6 w-full">
                {navLinks.map((link) => (
                  <button 
                    key={link.name} 
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setTimeout(() => scrollToSection(link.href.replace('#', '')), 400);
                    }}
                    className="text-xl uppercase tracking-[0.4em] font-bold text-brand-navy hover:text-brand-gold transition-colors py-2 border-b border-brand-navy/5"
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setTimeout(() => scrollToSection('contact'), 400);
                }}
                className="w-full mt-6 py-5 bg-brand-navy text-brand-cream uppercase tracking-widest font-bold text-sm hover:bg-brand-gold transition-colors rounded-sm shadow-xl"
              >
                Inquiry
              </button>
            </div>
            
            <div className="absolute bottom-12 flex flex-col items-center gap-6">
              <div className="flex gap-8 text-brand-navy/40">
                <Instagram size={22} className="hover:text-brand-gold transition-colors" />
                <Mail size={22} className="hover:text-brand-gold transition-colors" />
                <Linkedin size={22} className="hover:text-brand-gold transition-colors" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-brand-navy/30">
                &copy; {new Date().getFullYear()} Coave Coaching Lab
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const WeavingLine = ({ className }: { className?: string }) => {
  return (
    <div className={`relative h-px w-full overflow-hidden ${className}`}>
      <motion.div 
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
      />
    </div>
  );
};

const Hero = ({ content }: { content: SiteContent['hero'] }) => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* High-end Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2070&auto=format&fit=crop" 
          alt="Abstract Silk Texture"
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/10 via-brand-cream/80 to-brand-cream" />
        
        {/* Animated Weaving Lines Layer */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            d="M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50" 
            stroke="#0B1E33" fill="transparent" strokeWidth="0.05" 
          />
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
            d="M0,30 C30,50 70,10 100,30" 
            stroke="#D4AF37" fill="transparent" strokeWidth="0.05" 
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Subtle Logo Placement */}
          <div className="mb-12 flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="relative flex flex-col items-center"
            >
              <div className="absolute -inset-16 bg-brand-gold/5 blur-3xl rounded-full" />
              <span className="relative z-10 text-6xl md:text-8xl font-serif font-medium tracking-[0.2em] text-brand-navy">
                COAVE
              </span>
              <div className="relative z-10 w-24 md:w-32 h-[1px] bg-brand-gold/30 mt-4 overflow-hidden">
                <motion.div 
                  className="w-full h-full bg-brand-gold"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>

          <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.5em] font-medium mb-6 text-brand-navy/60">
            {content.badge}
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-light tracking-tighter leading-[1.1] mb-8">
            {content.titleMain} <br />
            <span className="italic font-normal">{content.titleItalic}</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-brand-navy/85 leading-relaxed mb-12 break-keep text-balance">
            {content.description}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#D4AF37" }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-brand-navy text-brand-cream text-xs uppercase tracking-[0.3em] font-bold transition-colors"
              onClick={() => scrollToSection('programs')}
            >
              {content.ctaPrimary}
            </motion.button>
            <motion.button 
              whileHover={{ x: 5 }}
              onClick={() => scrollToSection('about')}
              className="group flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-bold"
            >
              {content.ctaSecondary} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-brand-navy/40 to-transparent" />
      </motion.div>
    </section>
  );
};

const SectionHeading = ({ title, subtitle, align = "center" }: { title: string; subtitle: string; align?: "center" | "left" }) => {
  return (
    <div className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      <motion.span 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-4 block"
      >
        {subtitle}
      </motion.span>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-serif italic"
      >
        {title}
      </motion.h2>
    </div>
  );
};

const CEOMessageSection = ({ content }: { content: SiteContent['ceoMessage'] }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="ceo-message" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden bg-brand-navy/5">
              <img 
                src="/images/lee.png" 
                alt="Lee In-ju" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop";
                }}
              />
            </div>
            {/* Logo Accent */}
            <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-brand-gold rounded-full flex items-center justify-center p-5 shadow-2xl overflow-hidden border-4 border-white">
              <img 
                src="/logo_bg_removed.png" 
                className="w-full h-auto object-contain brightness-0 invert scale-110" 
                alt="COAVE" 
              />
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            className="space-y-10"
          >
            <div>
              <motion.span variants={item} className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold mb-6">
                {content.subtitle}
              </motion.span>
              <motion.h2 variants={item} className="text-3xl md:text-5xl font-serif italic leading-tight break-keep">
                {content.title}
              </motion.h2>
            </div>

            <motion.div variants={item} className="space-y-6 text-brand-navy/80 font-light leading-relaxed break-keep">
              {content.message.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-base md:text-lg">
                  {paragraph.split('\n').map((line, j) => (
                    <span key={j} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              ))}
            </motion.div>

            <motion.div variants={item} className="pt-8 border-t border-brand-navy/5">
              <div className="flex flex-col gap-1">
                <span className="text-xl md:text-2xl font-serif tracking-widest">{content.name}</span>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold">
                  {content.position}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = ({ content, onCtaClick }: { content: SiteContent['about'], onCtaClick: () => void }) => {
  return (
    <section id="about" className="py-24 bg-brand-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           whileHover={{ y: -5 }}
           transition={{ duration: 1.8, ease: "easeOut" }}
           viewport={{ amount: 0.2 }}
           className="relative aspect-[4/5] max-h-[700px] overflow-hidden rounded-[2rem] shadow-2xl group"
        >
          <motion.img 
            src="/images/about.png" 
            alt="Professional Coaching Session" 
            className="w-full h-full object-cover object-top transition-transform duration-1000"
            whileHover={{ scale: 1.05 }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500" />
          <motion.div 
            className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
           viewport={{ amount: 0.2 }}
           className="space-y-8"
        >
          <SectionHeading 
            subtitle={content.subtitle} 
            title={content.title} 
            align="left"
          />
          <div className="space-y-6 text-brand-navy/90 leading-relaxed font-light break-keep">
            <p>
              {content.description1}
            </p>
            <p>
              {content.description2}
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={onCtaClick}
              className="text-xs uppercase tracking-[0.3em] font-bold border-b border-brand-navy/30 pb-2 hover:border-brand-navy transition-colors"
            >
              {content.cta}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CoachesSection = () => {
  const coaches = [
    {
      name: "김정향",
      role: "대표코치",
      tags: ["PCC (ICF)", "KPC (한국코치협회)"],
      description: "심리학 기반의 정교한 코칭으로 개인과 조직의 잠재력을 깨우는 리더십 전문가입니다.",
      exp: [
        "성균관대 경영대학원 Global AMCP 수료",
        "코칭 리더십 및 코칭 역량 개발 전문",
        "아빈저 경영연구소 파트너 코치",
        "前 메가스터디 상담 코칭 전문가 활동",
        "前 웅진 씽크빅 팀장 / 최연소 지국장"
      ],
      image: "/images/kim.png"
    },
    {
      name: "이인주",
      role: "수석코치",
      tags: ["KPC (한국코치협회)", "임상심리사"],
      description: "사람의 마음을 읽는 상담 심리 전문성을 바탕으로 조직의 본질적 변화를 이끕니다.",
      exp: [
        "성균관대 경영대학원 Global AMCP 수료",
        "상담 및 임상심리학 석사 / 교육공학 학사",
        "조직 문화 및 리더십 소통 전문가",
        "前 KT ACE강사 센터장",
        "前 고운소아청소년과 학습발달심리센터 실장"
      ],
      image: "/images/lee.png",
      position: "object-top"
    },
    {
      name: "이정은",
      role: "수석강사",
      tags: ["공공기관 기업 컨설턴트", "KAC (한국코치협회)"],
      description: "현장의 풍부한 대화 경험을 통해 고객 가치를 창조하는 서비스 디자인 전문가입니다.",
      exp: [
        "이화여대 경영전문대학원 석사",
        "공공기관·기업 조직 문화 교육 전문가",
        "SOO컨설팅 전임강사",
        "前 (주)텐마인즈 조직문화 팀장",
        "前 스카이 서비스 아카데미 부원장"
      ],
      image: "/images/lee_je.jpg",
      position: "object-top"
    }
  ];

  return (
    <section id="coaches" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading 
          subtitle="Life Weavers" 
          title="Meet Our Experts" 
        />
        
        <div className="grid md:grid-cols-3 gap-12">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
              viewport={{ amount: 0.1 }}
              className="group"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] mb-8 bg-brand-cream">
                <img 
                  src={coach.image} 
                  alt={coach.name} 
                  className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${(coach as any).position || "object-center"}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-serif">{coach.name}</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-gold">{coach.role}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {coach.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 bg-brand-cream/80 text-brand-navy/80 font-bold uppercase tracking-widest rounded-full border border-brand-navy/5">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-[15px] text-brand-navy/90 font-light leading-relaxed break-keep">
                  {coach.description}
                </p>
                
                <ul className="pt-4 border-t border-brand-navy/5 space-y-2.5 break-keep">
                  {coach.exp.map((item, idx) => (
                    <li key={idx} className="text-[13px] text-brand-navy/90 flex items-start gap-2 leading-snug">
                      <span className="text-brand-gold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProgramCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-10 bg-white border border-brand-navy/5 group hover:border-brand-gold/30 transition-all rounded-[1.5rem]"
    >
      <div className="w-12 h-12 rounded-full border border-brand-navy/10 flex items-center justify-center mb-10 group-hover:bg-brand-navy group-hover:text-brand-cream transition-all">
        <Icon size={20} />
      </div>
      <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-gold transition-colors">{title}</h3>
      <p className="text-sm text-brand-navy/85 font-light leading-relaxed mb-8 break-keep">
        {description}
      </p>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-all">
        View Details <ChevronRight size={12} />
      </div>
    </motion.div>
  );
};

const ProgramsSection = () => {
  const programs = [
    {
      title: "Individual Growth",
      description: "개인의 잠재력을 깨우고 더 나은 삶의 방향을 설계하는 일대일 맞춤형 코칭 서비스입니다. 내면의 소리에 집중하는 시간을 마련합니다.",
      icon: Heart
    },
    {
      title: "Executive Excellence",
      description: "리더십의 본질을 탐구하고 조직의 성장을 견인할 수 있는 탁월한 인사이트를 구축하는 최고경영자 및 핵심 인재 코칭입니다.",
      icon: Compass
    },
    {
      title: "Creative Workshops",
      description: "함께 대화하고 공유하며 서로에게 영감을 주는 그룹 세션 및 주제별 워크숍을 통해 집단 지성의 힘을 경험합니다.",
      icon: Lightbulb
    }
  ];

  return (
    <section id="programs" className="py-24 bg-[#F8F6F2]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <SectionHeading 
          subtitle="Our Lab" 
          title="Curated Programs" 
        />
        <div className="grid md:grid-cols-3 gap-8">
          {programs.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
              viewport={{ amount: 0.1 }}
            >
              <ProgramCard {...p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MissionVisionSection = ({ mission, vision }: { mission: SiteContent['mission'], vision: SiteContent['vision'] }) => {
  if (!mission || !vision) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="vision" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Mission Column */}
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            className="space-y-12"
          >
            <div>
              <motion.span variants={item} className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold mb-6">
                Our Mission
              </motion.span>
              <motion.h3 variants={item} className="text-3xl md:text-4xl font-serif leading-tight mb-8 break-keep">
                {mission.summary}
              </motion.h3>
              <div className="w-16 h-px bg-brand-navy/10" />
            </div>

            <div className="space-y-8 text-brand-navy/80 font-light leading-relaxed break-keep">
              <motion.p variants={item} className="text-lg">
                {mission.content1}
              </motion.p>
              <motion.p variants={item} className="text-base border-l-2 border-brand-gold/20 pl-6 italic">
                {mission.content2}
              </motion.p>
            </div>
          </motion.div>

          {/* Vision Column */}
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            className="space-y-12"
          >
            <div>
              <motion.span variants={item} className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold mb-6">
                Our Vision
              </motion.span>
              <motion.h3 variants={item} className="text-3xl md:text-4xl font-serif italic mb-2 break-keep">
                {vision.summary}
              </motion.h3>
              <motion.p variants={item} className="text-xs uppercase tracking-widest font-bold text-brand-navy/40 mb-8">
                {vision.description}
              </motion.p>
              <div className="w-16 h-px bg-brand-navy/10" />
            </div>

            <div className="space-y-8">
              <div className="space-y-6 text-brand-navy/80 font-light leading-relaxed break-keep">
                <motion.p variants={item} className="text-base">
                  {vision.content1}
                </motion.p>
                <motion.p variants={item} className="text-base">
                  {vision.content2}
                </motion.p>
                <motion.p variants={item} className="text-base font-medium text-brand-navy">
                  {vision.content3}
                </motion.p>
              </div>
              
              <motion.div variants={item} className="pt-8 border-t border-brand-navy/5">
                <p className="text-sm font-serif italic text-brand-gold/80">
                  {vision.footer}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.02]">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-50">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.05" />
        </svg>
      </div>
    </section>
  );
};

const ValuesAndModelSection = ({ values, growthModel }: { values: SiteContent['values'], growthModel: SiteContent['growthModel'] }) => {
  if (!values || !growthModel) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="values" className="py-24 md:py-32 bg-brand-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Core Values */}
          <div className="lg:w-1/2">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ amount: 0.2 }}
              variants={container}
              className="space-y-12"
            >
              <div>
                <motion.span variants={item} className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold mb-6">
                  Guiding Principles
                </motion.span>
                <motion.h2 variants={item} className="text-4xl md:text-5xl font-serif italic mb-8">
                  Core Values
                </motion.h2>
                <div className="w-16 h-px bg-brand-navy/10" />
              </div>

              <div className="space-y-6">
                {values.map((v, i) => (
                  <motion.div 
                    key={i} 
                    variants={item}
                    className="group flex gap-6 items-start p-6 rounded-2xl border border-brand-navy/5 hover:border-brand-gold/30 hover:bg-white transition-all duration-500"
                  >
                    <span className="w-12 h-12 flex items-center justify-center text-3xl md:text-4xl font-serif text-brand-gold/40 group-hover:text-brand-gold transition-colors shrink-0">
                      {v.letter}
                    </span>
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xl font-serif">{v.label}</h4>
                      <p className="text-sm font-light text-brand-navy/70 leading-relaxed break-keep group-hover:text-brand-navy transition-colors">
                        {v.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Growth Model */}
          <div className="lg:w-1/2">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ amount: 0.2 }}
              variants={container}
              className="space-y-12"
            >
              <div>
                <motion.span variants={item} className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold mb-6">
                  Methodology
                </motion.span>
                <motion.h2 variants={item} className="text-4xl md:text-5xl font-serif italic mb-8">
                  Growth Model
                </motion.h2>
                <div className="w-16 h-px bg-brand-navy/10" />
              </div>

              <div className="relative">
                <div className="absolute left-7 top-0 bottom-0 w-px bg-brand-navy/5 hidden md:block" />
                <div className="space-y-8">
                  {growthModel.map((m, i) => (
                    <motion.div 
                      key={i} 
                      variants={item}
                      className="relative flex gap-6 md:gap-10 items-start group"
                    >
                      <div className="relative z-10 w-14 h-14 shrink-0 rounded-full bg-brand-navy text-brand-cream flex items-center justify-center font-serif text-xl border-4 border-brand-cream group-hover:bg-brand-gold transition-colors duration-500">
                        {m.letter}
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <h4 className="text-lg font-serif">{m.label}</h4>
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">{m.summary}</span>
                        </div>
                        <p className="text-sm font-light text-brand-navy/70 leading-relaxed break-keep group-hover:text-brand-navy transition-colors">
                          {m.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

const PhilosophySection = ({ content }: { content: SiteContent['philosophy'] }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="philosophy" className="py-24 md:py-32 relative overflow-hidden bg-brand-navy text-brand-cream">
      {/* Refined Weaving Background Decor */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <svg viewBox="0 0 1000 1000" className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M -100 200 C 200 100 400 300 600 200 S 800 100 1100 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          <motion.path
            d="M -100 300 C 150 400 350 200 550 300 S 750 400 1100 300"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M -100 500 C 250 450 450 550 650 500 S 850 450 1100 500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.path
            d="M -100 700 C 100 800 400 600 600 700 S 900 800 1100 700"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3.5, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.path
            d="M -100 850 C 300 750 500 950 700 850 S 900 750 1100 850"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
          />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
           variants={container}
           initial="hidden"
           whileInView="show"
           viewport={{ amount: 0.1 }}
           className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={item} className="mb-12">
            <span className="inline-block text-[10px] uppercase tracking-[0.6em] font-bold text-brand-gold/60 mb-6">
              Brand Philosophy
            </span>
            <div className="w-10 h-px bg-brand-gold/20 mx-auto" />
          </motion.div>
          
          <motion.h3 variants={item} className="text-2xl md:text-4xl font-serif mb-16 break-keep leading-[1.4] tracking-tight">
            COAVE는 Coaching과 Weave의 <br className="hidden md:block" /> 만남에서 시작되었습니다.
          </motion.h3>

          <div className="mb-20">
            <motion.p variants={item} className="text-lg md:text-xl font-serif italic mb-8 text-brand-cream/80">
              우리는 사람의 성장이 혼자 이루어지지 않는다고 믿습니다.
            </motion.p>
            <div className="flex flex-col items-center gap-4">
               {[
                 "성장은 관계 속에서 발견되고,", 
                 "배움 속에서 확장되며,", 
                 "실천 속에서 완성됩니다."
               ].map((line, i) => (
                 <motion.p key={i} variants={item} className="text-sm md:text-base font-light tracking-wide text-brand-cream/60 hover:text-brand-cream transition-colors duration-500">
                   {line}
                 </motion.p>
               ))}
            </div>
          </div>

          <motion.div variants={item} className="mb-20 relative">
            <div className="absolute -inset-x-10 inset-y-0 border-x border-brand-cream/5 hidden md:block" />
            <p className="text-xl md:text-2xl font-serif leading-relaxed break-keep px-4 text-brand-cream/90">
              COAVE는 사람과 가능성, 배움과 행동, 현재와 미래를 연결하며 <br className="hidden md:block" />
              한 사람의 삶에 더 깊은 가치와 지속 가능한 성장을 직조합니다.
            </p>
          </motion.div>

          <motion.div variants={item} className="mb-24">
            <div className="flex flex-col items-center mb-10">
              <span className="text-brand-cream/30 uppercase tracking-[0.4em] text-[10px] font-bold mb-4">Core Belief</span>
              <h4 className="text-xl md:text-2xl font-serif italic opacity-90">우리는 믿습니다</h4>
            </div>
            
            <div className="grid gap-px max-w-2xl mx-auto">
              {[
                { t: "삶에 가치를 더할 때", e: "변화가 시작되고" },
                { t: "선택에 신념을 더할 때", e: "방향이 선명해지며" },
                { t: "관계에 이해를 더할 때", e: "연결이 깊어지고" },
                { t: "행동에 실천을 더할 때", e: "성장이 현실이 된다는 것을" },
              ].map((b, i) => (
                <motion.div 
                  key={i} 
                  variants={item}
                  className="group flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 py-6 border-b border-brand-cream/5 last:border-0 hover:bg-brand-cream/[0.02] transition-colors rounded-none"
                >
                  <span className="text-xs md:text-sm font-light opacity-40 group-hover:opacity-60 transition-opacity uppercase tracking-widest">{b.t}</span>
                  <div className="w-1 h-1 rounded-full bg-brand-gold/20 hidden md:block" />
                  <span className="text-base md:text-xl font-serif italic group-hover:text-brand-gold/80 transition-colors">{b.e}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-20">
            <p className="text-lg md:text-xl font-light leading-relaxed break-keep text-brand-cream/80 max-w-3xl mx-auto">
              COAVE는 코칭을 통해 사람의 가능성을 발견하고, <br className="hidden md:block" />
              그 가능성이 삶 속에서 살아 움직이도록 함께합니다.
            </p>
          </motion.div>

          {/* Minimal Legacy Quote */}
          <motion.div 
            variants={item}
            className="pt-16 border-t border-brand-cream/10"
          >
            <p className="text-xs md:text-sm italic font-serif text-brand-cream/30 tracking-wide break-keep">
              {content.line1} {content.line2}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading 
              subtitle="Voices" 
              title="Shared Moments" 
              align="left"
            />
            <div className="space-y-12">
              <motion.div 
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 className="relative pl-12"
              >
                <div className="absolute left-0 top-0 text-brand-rose font-serif text-6xl">“</div>
                <p className="text-xl font-serif mb-4 leading-relaxed italic break-keep">
                  처음 방문했을 때의 불안함은 상담이 진행될수록 저만의 확신으로 바뀌었습니다. 코치님과 함께 제 삶의 실타래를 정리한 기분이에요.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-brand-navy/20" />
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-navy/60">Creative Director, B. Kim</span>
                </div>
              </motion.div>
              
              <motion.div 
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="relative pl-12"
              >
                <div className="absolute left-0 top-0 text-brand-rose font-serif text-6xl">“</div>
                <p className="text-xl font-serif mb-4 leading-relaxed italic break-keep">
                  리더로서의 무게감이 버거울 때 코에이브는 유일한 탈출구이자 충전소였습니다. 훨씬 더 유연하고 단단한 소통 방식을 배웠습니다.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-brand-navy/20" />
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-navy/60">CEO of Tech Startup, L. Min</span>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4 pt-12">
                <div className="h-64 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/calm/400/600" alt="Calm" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="h-48 rounded-full border border-brand-navy/10 flex items-center justify-center p-8 text-center text-[10px] uppercase tracking-widest font-bold">
                  200+ <br /> Lives woven
                </div>
             </div>
             <div className="space-y-4">
                <div className="h-48 rounded-full bg-brand-navy flex items-center justify-center text-brand-cream text-3xl font-serif italic">
                  98%
                </div>
                <div className="h-96 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/serene/400/800" alt="Serene" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactSection = ({ content }: { content: SiteContent['contact'] }) => {
  const [state, setState] = useState<{ status: "idle" | "submitting" | "success" | "error" }>({ status: "idle" });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ status: "submitting" });
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      service: formData.get('service') as string,
      message: formData.get('message') as string,
      createdAt: serverTimestamp(),
      status: 'new'
    };
    
    try {
      await addDoc(collection(db, 'inquiries'), data);
      setState({ status: "success" });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inquiries');
      setState({ status: "error" });
    }
  };

  return (
    <section id="contact" className="py-24 bg-brand-navy text-brand-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ amount: 0.2 }}
          >
            <SectionHeading 
              subtitle={content.subtitle} 
              title={content.title} 
              align="left"
            />
            <p className="text-brand-cream/85 font-light mb-12 max-w-md break-keep">
              {content.description}
            </p>
            <div className="space-y-6">
              {content.kakao && (
                <motion.a 
                  href={content.kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center group-hover:bg-brand-gold group-hover:border-brand-gold transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 3C7.029 3 3 6.129 3 10c0 2.508 1.631 4.708 4.14 5.968l-1.04 3.79c-.06.22.06.45.28.53.07.02.14.03.2.03.16 0 .31-.08.38-.23l4.58-3.04c.15.01.3.02.46.02 4.971 0 9-3.129 9-7 0-3.871-4.029-7-9-7z" />
                      <text x="12" y="11.5" fontSize="4.5" fontWeight="900" textAnchor="middle" fill="black">TALK</text>
                    </svg>
                  </div>
                  <span className="text-sm tracking-wider group-hover:text-brand-gold transition-colors font-medium">카카오톡 오픈채팅</span>
                </motion.a>
              )}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center opacity-70">
                  <Mail size={16} />
                </div>
                <span className="text-sm tracking-wider opacity-70">{content.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center opacity-70">
                  <Instagram size={16} />
                </div>
                <span className="text-sm tracking-wider opacity-70">{content.instagram}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center opacity-70">
                  <Linkedin size={16} />
                </div>
                <span className="text-sm tracking-wider opacity-70">{content.linkedin}</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            viewport={{ amount: 0.2 }}
            className="bg-white/5 backdrop-blur-sm p-10 rounded-[2rem] border border-white/10"
          >
            {state.status === "success" ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-brand-gold" />
                </div>
                <h3 className="text-2xl font-serif mb-4">감사합니다.</h3>
                <p className="text-brand-cream/60 font-light text-sm">
                  메시지가 성공적으로 전달되었습니다.<br />
                  빠른 시일 내에 연락드리겠습니다.
                </p>
                <button 
                  onClick={() => setState({ status: "idle" })}
                  className="mt-8 text-[10px] uppercase tracking-widest font-bold border-b border-brand-cream/20 pb-1"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <label htmlFor="full-name" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Full Name</label>
                  <input 
                    id="full-name"
                    name="name" 
                    type="text" 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all" 
                  />
                </div>
                <div className="space-y-4">
                  <label htmlFor="email-address" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Email Address</label>
                  <input 
                    id="email-address"
                    name="email" 
                    type="email" 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all" 
                  />
                </div>
                <div className="space-y-4">
                  <label htmlFor="service-type" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Type of Service</label>
                  <div className="relative">
                    <select 
                      id="service-type"
                      name="service"
                      required
                      defaultValue=""
                      className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-brand-navy">문의 유형을 선택해주세요</option>
                      <option className="bg-brand-navy">코치 더 코치</option>
                      <option className="bg-brand-navy">코칭 강의</option>
                      <option className="bg-brand-navy">기타</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label htmlFor="message" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Message</label>
                  <textarea 
                    id="message"
                    name="message" 
                    rows={4} 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all resize-none" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={state.status === "submitting"}
                  className="w-full py-4 bg-brand-cream text-brand-navy text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold hover:text-brand-cream transition-all disabled:opacity-50"
                >
                  {state.status === "submitting" ? "Sending..." : "Send Message"}
                </button>
                {state.status === "error" && (
                  <p className="text-brand-rose text-[10px] text-center mt-2">
                    오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ onLogin }: { onLogin?: () => void }) => {
  return (
    <footer className="py-12 bg-brand-cream border-t border-brand-navy/5">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="mb-6 flex flex-col items-center gap-4">
          <img 
            src="/logo_bg_removed.png" 
            className="h-12 w-auto object-contain opacity-80 grayscale hover:grayscale-0 transition-all duration-700" 
            alt="COAVE" 
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <span className="text-2xl font-serif font-bold tracking-[0.2em] text-brand-navy">COAVE</span>
            <div className="w-8 h-px bg-brand-gold/40 mx-auto mt-2" />
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-brand-navy/40 mb-8">
          &copy; {new Date().getFullYear()} Coave Coaching Lab. Designed with elegance.
        </p>
        <div className="flex justify-center gap-6 opacity-40 mb-6">
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Privacy</a>
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Terms</a>
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Sitemap</a>
        </div>
        {onLogin && (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 mx-auto text-[9px] uppercase tracking-widest font-bold text-brand-navy/20 hover:text-brand-navy/60 transition-colors"
          >
            <Lock size={10} /> Admin Login
          </button>
        )}
      </div>
    </footer>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) setShowAdmin(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'content', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setSiteContent({
          hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
          about: { ...DEFAULT_CONTENT.about, ...data.about },
          philosophy: { ...DEFAULT_CONTENT.philosophy, ...data.philosophy },
          mission: { ...DEFAULT_CONTENT.mission, ...data.mission },
          vision: { ...DEFAULT_CONTENT.vision, ...data.vision },
          ceoMessage: { ...DEFAULT_CONTENT.ceoMessage, ...data.ceoMessage },
          values: data.values || DEFAULT_CONTENT.values,
          growthModel: data.growthModel || DEFAULT_CONTENT.growthModel,
          contact: { ...DEFAULT_CONTENT.contact, ...data.contact },
        });
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setShowAdmin(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowAdmin(false);
  };

  if (showAdmin && user) {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="selection:bg-brand-gold selection:text-white">
      <Navbar />
      <main>
        <Hero content={siteContent.hero} />
        <AboutSection 
          content={siteContent.about} 
          onCtaClick={() => scrollToSection('vision')}
        />
        <CEOMessageSection content={siteContent.ceoMessage} />
        <CoachesSection />
        <ProgramsSection />
        <ValuesAndModelSection values={siteContent.values} growthModel={siteContent.growthModel} />
        <PhilosophySection content={siteContent.philosophy} />
        <MissionVisionSection mission={siteContent.mission} vision={siteContent.vision} />
        <TestimonialsSection />
        <ContactSection content={siteContent.contact} />
      </main>
      <Footer onLogin={handleLogin} />
    </div>
  );
}
