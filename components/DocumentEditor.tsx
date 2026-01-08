
import React, { useState } from 'react';
import { ISODocument, ISODocLevel, DocSection, ToneType, CategoryDef, VariableProfile, getStandardFilename, ReviewerEntry, ApproverEntry } from '../types';
import { generateISODocContent, refineContent } from '../services/geminiService';
import ISODocumentRenderer from './ISODocumentRenderer';
import SyntaxGuide from './SyntaxGuide';
import {
  RefreshCw, Settings, Trash2, ChevronLeft, Eye, Edit3, Save, X, Zap, Heart, Building2, BookOpen,
  FileText, Variable, PlusCircle, Lock, History, ShieldCheck, CheckCircle, Download, FileDown,
  HelpCircle, Wand2, MessageSquare, Mail, UserPlus, UserCheck, XCircle, Copy, Check
} from 'lucide-react';

interface DocumentEditorProps {
  document: ISODocument;
  allDocuments: ISODocument[];
  categories: CategoryDef[];
  variableProfiles: VariableProfile[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onSave: (doc: ISODocument) => void;
  onRevise: (doc: ISODocument, type: 'major' | 'minor') => void;
  onSaveAsTemplate: (doc: ISODocument) => void;
  onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: initialDoc, allDocuments, categories, variableProfiles, activeProfileId,
  onProfileChange, onSave, onRevise, onSaveAsTemplate, onClose
}) => {
  const [doc, setDoc] = useState<ISODocument>(initialDoc);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<ToneType>('standard');
  const [isPreview, setIsPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyntaxGuideOpen, setIsSyntaxGuideOpen] = useState(false);
  const [activeSuggestionSection, setActiveSuggestionSection] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Refinement State
  const [refiningSectionId, setRefiningSectionId] = useState<string | null>(null);
  const [refineResult, setRefineResult] = useState<string | null>(null);
  const [refineLoading, setRefineLoading] = useState(false);

  // Approval Workflow State
  const [isSmartSendOpen, setIsSmartSendOpen] = useState(false);
  const [smartSendContent, setSmartSendContent] = useState({ subject: '', body: '', actionHelper: '' });
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [activeSignOffRole, setActiveSignOffRole] = useState<{ type: 'reviewer' | 'approver', id?: string, name: string } | null>(null);
  const [signOffData, setSignOffData] = useState({ date: new Date().toISOString().split('T')[0], note: '' });

  // Revision Modal State
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);

  const activeProfile = variableProfiles.find(p => p.id === activeProfileId);
  const isLocked = doc.status === 'approved';
  const isReadOnly = doc.status !== 'draft';

  // Smart Lock Logic
  const isRevision = doc.version !== '1.0';
  const isDocNumberLocked = isRevision || isReadOnly;
  const isDuplicate = !isDocNumberLocked && allDocuments.some(d => d.docNumber === doc.docNumber && d.id !== doc.id);

  // --- AI Logic ---
  const handleAIAutoFill = async () => {
    if (!aiPrompt || isReadOnly) return;
    setAiLoading(true);
    try {
      const result = await generateISODocContent(aiPrompt, doc.level, doc.category, aiTone, "ISO 規範準則");
      const newSections: DocSection[] = result.sections.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: s.title,
        content: s.content
      }));
      setDoc(prev => ({ ...prev, title: aiPrompt, sections: newSections }));
    } catch (error) { alert("AI 生成失敗。"); } finally { setAiLoading(false); }
  };

  const handleRefine = async (sectionId: string, action: 'polish' | 'check' | 'tone_official') => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section || !section.content.trim()) return;
    setRefiningSectionId(sectionId);
    setRefineLoading(true);
    try {
      const result = await refineContent(section.content, action);
      setRefineResult(result);
    } catch (e) { alert("AI 處理失敗"); } finally { setRefineLoading(false); }
  };

  const applyRefinement = (mode: 'replace' | 'append') => {
    if (!refiningSectionId || !refineResult) return;
    const section = doc.sections.find(s => s.id === refiningSectionId);
    if (!section) return;
    const newContent = mode === 'replace' ? refineResult : section.content + "\n\n" + refineResult;
    handleSectionChange(refiningSectionId, 'content', newContent);
    setRefineResult(null); setRefiningSectionId(null);
  };

  // --- Workflow Logic ---

  const handleSectionChange = (id: string, field: 'title' | 'content', value: string) => {
    if (isReadOnly) return;
    setDoc(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  };

  const insertVariable = (sectionId: string, varKey: string) => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;
    handleSectionChange(sectionId, 'content', section.content + `{{${varKey}}}`);
    setActiveSuggestionSection(null);
  };

  const insertReference = (sectionId: string, docId: string) => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;
    handleSectionChange(sectionId, 'content', section.content + `[[REF:${docId}]]`);
    setActiveSuggestionSection(null);
  };

  // --- Approval Workflow Handlers ---

  const triggerSmartSend = (type: 'review' | 'approve') => {
    const subject = `[審核請求] ISO文件: ${doc.docNumber} ${doc.title} (v${doc.version})`;
    const body = `主管您好，\n\n附件為最新的文件草稿，請協助審核。\n\n文件編號：${doc.docNumber}\n文件名稱：${doc.title}\n作者：${doc.author}\n\n若確認無誤，請回信告知「核准 (Approved)」。\n\n謝謝。`;

    setSmartSendContent({
      subject,
      body,
      actionHelper: type === 'review' ? '通知審核人員 (Reviewers)' : '通知最終核准人 (Final Approver)'
    });

    // Auto-open mail client
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);

    // Open Fallback Modal
    setIsSmartSendOpen(true);
  };

  const handleStartReview = () => {
    if (doc.reviewers.length === 0) {
      alert("請至少新增一位審核人員。");
      return;
    }
    setDoc(prev => ({ ...prev, status: 'review' }));
    triggerSmartSend('review');
  };

  const handleSubmitForFinalApproval = () => {
    setDoc(prev => ({ ...prev, status: 'approving' }));
    triggerSmartSend('approve');
  };

  const openSignOffModal = (role: { type: 'reviewer' | 'approver', id?: string, name: string }) => {
    setActiveSignOffRole(role);
    setSignOffData({ date: new Date().toISOString().split('T')[0], note: '' });
    setIsSignOffModalOpen(true);
  };

  const handleSignOffDecision = (decision: 'approve' | 'reject') => {
    if (!activeSignOffRole) return;

    if (decision === 'reject') {
      if (!confirm('確定要退回此文件嗎？文件狀態將重置為 Draft。')) return;
      setDoc(prev => ({
        ...prev,
        status: 'draft',
        reviewers: prev.reviewers.map(r => ({ ...r, status: 'pending', date: undefined, note: undefined })), // Reset all
        finalApprover: { ...prev.finalApprover, status: 'pending', date: undefined, note: undefined }
      }));
      alert('文件已退回 (Rejected)。請進行修正後重新送審。');
    } else {
      // Approved
      if (activeSignOffRole.type === 'reviewer' && activeSignOffRole.id) {
        setDoc(prev => ({
          ...prev,
          reviewers: prev.reviewers.map(r => r.id === activeSignOffRole.id ? { ...r, status: 'approved', date: signOffData.date, note: signOffData.note } : r)
        }));
      } else if (activeSignOffRole.type === 'approver') {
        setDoc(prev => ({
          ...prev,
          status: 'approved',
          finalApprover: { ...prev.finalApprover, status: 'approved', date: signOffData.date, note: signOffData.note }
        }));
        alert('恭喜！文件已正式發行 (Approved)。');
      }
    }
    setIsSignOffModalOpen(false);
  };

  // Reviewer Management
  const addReviewer = () => {
    const name = prompt("請輸入審核人員姓名：");
    if (name) {
      setDoc(prev => ({
        ...prev,
        reviewers: [...prev.reviewers, { id: Date.now().toString(), name, status: 'pending' }]
      }));
    }
  };

  const removeReviewer = (id: string) => {
    setDoc(prev => ({ ...prev, reviewers: prev.reviewers.filter(r => r.id !== id) }));
  };

  // --- PDF Export ---
  const handleDownloadPDF = async () => {
    const element = document.querySelector('.iso-render-root') as HTMLElement;
    const h2p = (window as any).html2pdf;
    if (!element || !h2p) { alert("PDF 生成組件尚未就緒。"); return; }

    setIsExporting(true);
    const filename = getStandardFilename(doc);
    element.classList.add('pdf-export-mode');
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      await h2p().set({
        margin: 0, filename, image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0, width: element.offsetWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(element).save();
    } catch (error) { alert('PDF 生成失敗。'); }
    finally { setIsExporting(false); element.classList.remove('pdf-export-mode'); document.title = originalTitle; }
  };

  const suggestedFilename = getStandardFilename(doc);
  const allReviewersApproved = doc.reviewers.length > 0 && doc.reviewers.every(r => r.status === 'approved');

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden relative">
      <SyntaxGuide isOpen={isSyntaxGuideOpen} onClose={() => setIsSyntaxGuideOpen(false)} />

      {/* --- Modals --- */}

      {/* Smart Send Modal (Fallback) */}
      {isSmartSendOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center"><Mail className="mr-2 text-blue-600" /> 郵件通知助手</h3>
            <p className="text-xs text-slate-500 mb-6 bg-blue-50 p-3 rounded-xl border border-blue-100">
              系統已嘗試開啟您的預設郵件軟體。若未彈出視窗，請<b>複製下方內容</b>，並手動貼上至 Gmail / Outlook 發送。
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">信件主旨</label>
                <div className="bg-slate-50 p-3 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">{smartSendContent.subject}</div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">信件內容</label>
                <textarea readOnly className="w-full bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-200 h-32 resize-none" value={smartSendContent.body} />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => { navigator.clipboard.writeText(`${smartSendContent.subject}\n\n${smartSendContent.body}`); alert('已複製到剪貼簿！'); }} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs hover:bg-slate-50 flex items-center justify-center">
                <Copy size={14} className="mr-2" /> 複製內容
              </button>
              <button onClick={() => setIsSmartSendOpen(false)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs hover:bg-emerald-700 shadow-lg flex items-center justify-center">
                <Check size={14} className="mr-2" /> 我已手動發送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-Off / Approval Modal */}
      {isSignOffModalOpen && activeSignOffRole && (
        <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 animate-in zoom-in duration-200 border-t-8 border-blue-600">
            <h3 className="text-xl font-black text-slate-900 mb-1">簽核錄入確認</h3>
            <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider font-bold">Sign-off Confirmation</p>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold">簽核人員:</span>
                <span className="text-xs font-black text-slate-900">{activeSignOffRole.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-bold">簽核身分:</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{activeSignOffRole.type}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">核准日期 (Date)</label>
                <input type="date" value={signOffData.date} onChange={e => setSignOffData({ ...signOffData, date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">核准證據 / 備註 (Evidence)</label>
                <textarea placeholder="例如：Email 回覆 OK, 會議確認..." value={signOffData.note} onChange={e => setSignOffData({ ...signOffData, note: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleSignOffDecision('reject')} className="bg-rose-50 text-rose-600 border border-rose-100 py-3 rounded-xl font-black text-xs hover:bg-rose-100 flex items-center justify-center transition-colors">
                <XCircle size={16} className="mr-2" /> 拒絕 (Reject)
              </button>
              <button onClick={() => handleSignOffDecision('approve')} className="bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-emerald-600 shadow-xl flex items-center justify-center transition-all">
                <CheckCircle size={16} className="mr-2" /> 確認通過 (Approve)
              </button>
            </div>
            <button onClick={() => setIsSignOffModalOpen(false)} className="w-full mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-bold">取消操作</button>
          </div>
        </div>
      )}

      {/* Refinement Result Modal */}
      {refineResult && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-8 border border-slate-200 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center"><Zap size={24} className="text-blue-500 mr-3" /> AI 建議結果</h3>
              <button onClick={() => { setRefineResult(null); setRefiningSectionId(null); }}><X className="text-slate-400 hover:text-slate-900" /></button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">{refineResult}</pre>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => applyRefinement('replace')} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-colors shadow-lg">完全替換 (Replace)</button>
              <button onClick={() => applyRefinement('append')} className="flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors">附加在後 (Append)</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Simplified for brevity, kept mostly same) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-12 shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 flex items-center"><Settings className="mr-3 text-blue-600" /> 文件屬性詳細設定</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><X size={28} /></button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10">
              {/* Keep inputs same as original but disable if isReadOnly */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">
                  文件編號 {isDocNumberLocked && <span className="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]"><Lock size={8} className="inline mr-0.5" /> 繼承自舊版</span>}
                </label>
                <input
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold ${isDuplicate ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-slate-300'}`}
                  value={doc.docNumber}
                  onChange={e => !isDocNumberLocked && setDoc({ ...doc, docNumber: e.target.value })}
                  disabled={isDocNumberLocked}
                />
                {isDuplicate && (
                  <p className="text-[10px] text-rose-500 mt-2 font-bold flex items-center animate-in slide-in-from-top-1">
                    <XCircle size={12} className="mr-1" /> ⚠️ 編號重複：系統中已有此編號的文件 (若是修訂舊文件，請至該文件點擊 '建立新版本')
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">作者 (Author)</label>
                <input className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold" value={doc.author} onChange={e => !isReadOnly && setDoc({ ...doc, author: e.target.value })} disabled={isReadOnly} />
              </div>
              {/* ... other settings ... */}
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-600 shadow-xl transition-all">儲存並關閉</button>
          </div>
        </div>
      )}

      {/* Revision Type Modal */}
      {isReviseModalOpen && (
        <div className="fixed inset-0 z-[180] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center"><History className="mr-3 text-blue-600" /> 選擇修訂類型</h3>

            <button
              onClick={() => { onRevise(doc, 'major'); setIsReviseModalOpen(false); }}
              className="w-full bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 p-6 rounded-2xl mb-4 text-left group transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black text-slate-900 group-hover:text-blue-700">Option A: 大改版 (Major Revision)</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">v{(Math.floor(parseFloat(doc.version) || 0) + 1).toFixed(1)}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">適用於流程變更、權責調整。需重新進行完整審核 (Draft → Review → Approve)。</p>
            </button>

            <button
              onClick={() => { onRevise(doc, 'minor'); setIsReviseModalOpen(false); }}
              className="w-full bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 p-6 rounded-2xl text-left group transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700">Option B: 小改版/勘誤 (Minor Revision)</span>
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">v{(parseFloat(doc.version) + 0.1).toFixed(1)}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">適用於錯字修正、排版調整。跳過中間審核，直接進入最終核准 (Approving)。</p>
            </button>

            <button onClick={() => setIsReviseModalOpen(false)} className="w-full mt-6 text-xs font-bold text-slate-400 hover:text-slate-600">取消</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-[380px] bg-white border-r border-slate-200 p-8 flex flex-col h-full overflow-y-auto no-print shadow-sm z-10">
        {/* ... existing header ... */}

        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 flex items-center font-black text-[11px] uppercase tracking-widest">
            <ChevronLeft size={18} className="mr-2" /> 離開
          </button>
          <div className="flex space-x-2">
            <button onClick={() => setIsSyntaxGuideOpen(!isSyntaxGuideOpen)} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"><HelpCircle size={20} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"><Settings size={20} /></button>
            <button onClick={() => setIsPreview(!isPreview)} className={`p-2.5 rounded-xl border ${isPreview ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>{isPreview ? <Edit3 size={20} /> : <Eye size={20} />}</button>
            {!isLocked && <button onClick={() => { onSave(doc); alert('已儲存！'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg"><Save size={18} /></button>}
          </div>
        </div>

        {/* --- Workflow Status Card --- */}
        <div className="bg-white border-2 border-slate-100 p-6 rounded-[32px] shadow-lg mb-8 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] -mr-4 -mt-4 opacity-20 ${doc.status === 'approved' ? 'bg-emerald-500' : doc.status === 'draft' ? 'bg-slate-500' : 'bg-amber-500'}`}></div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">目前狀態 (Status)</h4>
          <div className="flex items-center mb-6">
            <div className={`text-2xl font-black ${doc.status === 'approved' ? 'text-emerald-600' : doc.status === 'draft' ? 'text-slate-700' : 'text-amber-600'}`}>
              {doc.status === 'draft' && '草稿 (Draft)'}
              {doc.status === 'review' && '審核中 (Review)'}
              {doc.status === 'approving' && '核准中 (Approving)'}
              {doc.status === 'approved' && '已發行 (Approved)'}
            </div>
          </div>

          {/* Draft Actions */}
          {doc.status === 'draft' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">審核人員名單</span>
                  <button onClick={addReviewer} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 font-bold flex items-center"><UserPlus size={12} className="mr-1" /> 新增</button>
                </div>
                {doc.reviewers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">尚未指定審核人</p>
                ) : (
                  <div className="space-y-2">
                    {doc.reviewers.map(r => (
                      <div key={r.id} className="flex justify-between items-center text-xs font-bold text-slate-700 bg-white p-2 rounded-xl border border-slate-100">
                        <span>{r.name}</span>
                        <button onClick={() => removeReviewer(r.id)}><X size={14} className="text-slate-300 hover:text-rose-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleStartReview}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 shadow-xl transition-all flex items-center justify-center"
              >
                <Mail size={16} className="mr-2" /> 送出審核 (Start Review)
              </button>
              <button
                onClick={() => setIsReviseModalOpen(true)}
                className="w-full bg-blue-500 hover:bg-white hover:text-blue-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center shadow-lg"
              >
                <History size={16} className="mr-2" /> 建立修訂版本
              </button>
            </div>
          )}

          {/* Review Actions */}
          {doc.status === 'review' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-bold">請確認所有審核人員皆完成簽核，系統將自動解鎖下一步。</p>
              <div className="space-y-2">
                {doc.reviewers.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900">{r.name}</div>
                      <div className={`text-[10px] font-bold uppercase ${r.status === 'approved' ? 'text-emerald-600' : 'text-amber-500'}`}>{r.status}</div>
                    </div>
                    {r.status === 'pending' && (
                      <button onClick={() => openSignOffModal({ type: 'reviewer', id: r.id, name: r.name })} className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 p-2 rounded-xl transition-colors">
                        <UserCheck size={18} />
                      </button>
                    )}
                    {r.status === 'approved' && <CheckCircle size={18} className="text-emerald-500" />}
                  </div>
                ))}
              </div>
              {allReviewersApproved && (
                <button
                  onClick={handleSubmitForFinalApproval}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all animate-in slide-in-from-bottom-2 fade-in"
                >
                  呈送最終核准 (Final Approval)
                </button>
              )}
            </div>
          )}

          {/* Approving Actions */}
          {doc.status === 'approving' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-blue-400 mb-1 block">最終核准人</label>
                <div className="text-sm font-black text-blue-900">{doc.finalApprover.name}</div>
              </div>
              <button onClick={() => openSignOffModal({ type: 'approver', name: doc.finalApprover.name })} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all flex items-center justify-center">
                <ShieldCheck size={18} className="mr-2" /> 錄入核准決策
              </button>
            </div>
          )}

          {/* Approved View */}
          {doc.status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-800 text-xs font-bold leading-relaxed">
              此文件已完成簽核程序並正式發行。所有內容已鎖定。如需變更，請建立新的修訂版本。
            </div>
          )}
        </div>

        {/* Existing AI Sidebar Tools (Display only if editable) */}
        {!isReadOnly && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* AI Helper UI (Same as before) */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI 撰寫助手</h4>
              <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 text-xs mb-3 h-20 outline-none" placeholder="輸入主題..." />
              <button onClick={handleAIAutoFill} disabled={aiLoading} className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase transition-all">
                {aiLoading ? '生成中...' : '生成內容'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        {isPreview ? (
          <div className="p-12 flex flex-col items-center pb-48">
            {/* PDF Export Header */}
            <div className="no-print w-full max-w-[21cm] mb-8 flex justify-end">
              <button onClick={handleDownloadPDF} disabled={isExporting} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center hover:bg-blue-700 transition-all">
                <FileDown size={18} className="mr-2" /> 下載正式 PDF
              </button>
            </div>
            <ISODocumentRenderer data={doc} allDocuments={allDocuments} activeProfile={activeProfile} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-12 pb-48 relative">
            {/* Document Title Header */}
            <div className={`bg-white p-16 rounded-[48px] shadow-xl border mb-12 transition-all ${isReadOnly ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block border-l-4 border-blue-600 pl-4">文件標題</label>
                {isReadOnly && <div className="flex items-center text-blue-700 font-black text-[10px] uppercase bg-blue-100 px-3 py-1 rounded-full"><Lock size={12} className="mr-1" /> 唯讀模式</div>}
              </div>
              <input
                className={`w-full text-5xl font-black border-none focus:ring-0 p-0 placeholder:text-slate-200 bg-transparent ${isReadOnly ? 'text-slate-500' : 'text-slate-900'}`}
                value={doc.title}
                onChange={e => !isReadOnly && setDoc({ ...doc, title: e.target.value })}
                readOnly={isReadOnly}
              />

              {/* Metadata Row */}
              <div className="mt-10 flex items-center space-x-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-100 pt-6">
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl">NO: {doc.docNumber}</span>
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl">VER: {doc.version}</span>
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl">{doc.status}</span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {doc.sections.map((s, idx) => (
                <div key={s.id} className={`bg-white rounded-[48px] border shadow-md relative overflow-visible transition-all ${isReadOnly ? 'border-slate-200' : 'border-slate-200 hover:shadow-2xl'}`}>
                  <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/30 rounded-t-[48px] flex items-center justify-between">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-mono text-slate-400 mr-4 font-black">{idx + 1}.</span>
                      <input className={`bg-transparent border-none focus:ring-0 font-black text-xl w-full p-0 ${isReadOnly ? 'text-slate-500' : 'text-slate-900'}`}
                        value={s.title} onChange={e => handleSectionChange(s.id, 'title', e.target.value)} readOnly={isReadOnly}
                      />
                    </div>
                    {!isReadOnly && <button onClick={() => setDoc(prev => ({ ...prev, sections: prev.sections.filter(sec => sec.id !== s.id) }))} className="text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>}
                  </div>
                  <div className="p-8 relative">
                    <textarea
                      className={`w-full min-h-[240px] font-medium text-lg resize-none p-8 leading-relaxed rounded-[24px] outline-none ${isReadOnly ? 'bg-transparent text-slate-500 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-50/50'}`}
                      value={s.content} onChange={e => handleSectionChange(s.id, 'content', e.target.value)} readOnly={isReadOnly}
                    />

                    {/* Section Tools: Polish, Check, Tone (Only in Draft) */}
                    {!isReadOnly && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex space-x-2">
                        <button onClick={() => handleRefine(s.id, 'polish')} className="bg-slate-100 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors"><Wand2 size={12} className="mr-1 inline" /> 潤飾</button>
                        <button onClick={() => handleRefine(s.id, 'check')} className="bg-slate-100 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors"><ShieldCheck size={12} className="mr-1 inline" /> 檢查</button>
                        {/* Add more tools as needed */}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <button onClick={() => setDoc(prev => ({ ...prev, sections: [...prev.sections, { id: Math.random().toString(36).substr(2, 9), title: '新增章節', content: '' }] }))} className="w-full mt-12 py-16 border-4 border-dashed border-slate-200 rounded-[48px] text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-all flex flex-col items-center group">
                <PlusCircle size={48} className="group-hover:scale-110 transition-transform mb-4" />
                <span className="font-black text-xs uppercase tracking-[0.2em]">增加章節 (Add Section)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;
