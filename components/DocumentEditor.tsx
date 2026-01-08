
import React, { useState } from 'react';
import { ISODocument, ISODocLevel, DocSection, ToneType, CategoryDef, VariableProfile, getStandardFilename } from '../types';
import { generateISODocContent, refineContent } from '../services/geminiService';
import ISODocumentRenderer from './ISODocumentRenderer';
import SyntaxGuide from './SyntaxGuide';
import { 
  RefreshCw, 
  Settings, 
  Trash2, 
  ChevronLeft, 
  Eye, 
  Edit3, 
  Save, 
  X, 
  Zap, 
  Heart,
  Building2,
  BookOpen,
  FileText,
  Variable,
  PlusCircle,
  Lock,
  History,
  ShieldCheck,
  CheckCircle,
  Download,
  FileDown,
  HelpCircle,
  Wand2,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface DocumentEditorProps {
  document: ISODocument;
  allDocuments: ISODocument[];
  categories: CategoryDef[];
  variableProfiles: VariableProfile[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onSave: (doc: ISODocument) => void;
  onRevise: (doc: ISODocument) => void;
  onSaveAsTemplate: (doc: ISODocument) => void;
  onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  document: initialDoc, 
  allDocuments, 
  categories, 
  variableProfiles,
  activeProfileId,
  onProfileChange,
  onSave, 
  onRevise,
  onSaveAsTemplate, 
  onClose 
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
  
  const activeProfile = variableProfiles.find(p => p.id === activeProfileId);
  const isLocked = doc.status === 'approved';

  const handleAIAutoFill = async () => {
    if (!aiPrompt || isLocked) return;
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

  const handleSectionChange = (id: string, field: 'title' | 'content', value: string) => {
    if (isLocked) return;
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

  const handleRefine = async (sectionId: string, action: 'polish' | 'check' | 'tone_official') => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section || !section.content.trim()) return;

    setRefiningSectionId(sectionId);
    setRefineLoading(true);
    try {
      const result = await refineContent(section.content, action);
      setRefineResult(result);
    } catch (e) {
      alert("AI 處理失敗");
    } finally {
      setRefineLoading(false);
    }
  };

  const applyRefinement = (mode: 'replace' | 'append') => {
    if (!refiningSectionId || !refineResult) return;
    
    const section = doc.sections.find(s => s.id === refiningSectionId);
    if (!section) return;

    const newContent = mode === 'replace' 
      ? refineResult 
      : section.content + "\n\n" + refineResult;

    handleSectionChange(refiningSectionId, 'content', newContent);
    setRefineResult(null);
    setRefiningSectionId(null);
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.iso-render-root') as HTMLElement;
    const h2p = (window as any).html2pdf;
    
    if (!element || !h2p) {
      alert("PDF 生成組件尚未就緒，請重新整理頁面。");
      return;
    }
    
    setIsExporting(true);
    const filename = getStandardFilename(doc);
    
    element.classList.add('pdf-export-mode');
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');

    const scrollContainer = element.closest('.overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: element.offsetWidth
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      await h2p().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('PDF 生成失敗，請重新整理頁面後再試一次。');
    } finally {
      setIsExporting(false);
      element.classList.remove('pdf-export-mode');
      document.title = originalTitle;
    }
  };

  const suggestedFilename = getStandardFilename(doc);

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden relative">
      <SyntaxGuide isOpen={isSyntaxGuideOpen} onClose={() => setIsSyntaxGuideOpen(false)} />

      {/* Refinement Result Modal */}
      {refineResult && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-8 border border-slate-200 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center"><Zap size={24} className="text-blue-500 mr-3"/> AI 建議結果</h3>
                <button onClick={() => { setRefineResult(null); setRefiningSectionId(null); }}><X className="text-slate-400 hover:text-slate-900"/></button>
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-12 shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 flex items-center"><Settings className="mr-3 text-blue-600"/> 文件屬性詳細設定</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><X size={28}/></button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">文件編號 (Doc No.)</label>
                  <input className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={doc.docNumber} onChange={e => !isLocked && setDoc({...doc, docNumber: e.target.value})} disabled={isLocked} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">所屬分類</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={doc.category} onChange={e => !isLocked && setDoc({...doc, category: e.target.value})} disabled={isLocked}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">ISO 階層定義</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={doc.level} onChange={e => !isLocked && setDoc({...doc, level: e.target.value as ISODocLevel})} disabled={isLocked}>
                    {Object.values(ISODocLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">權責負責單位</label>
                  <input className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={doc.department} onChange={e => !isLocked && setDoc({...doc, department: e.target.value})} disabled={isLocked} />
                </div>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-600 shadow-xl transition-all">儲存並關閉</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-[380px] bg-white border-r border-slate-200 p-8 flex flex-col h-full overflow-y-auto no-print shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 flex items-center font-black text-[11px] uppercase tracking-widest">
            <ChevronLeft size={18} className="mr-2"/> 離開編輯
          </button>
          <div className="flex space-x-2">
             <button 
              onClick={() => setIsSyntaxGuideOpen(!isSyntaxGuideOpen)} 
              className={`p-2.5 rounded-xl border transition-all shadow-sm ${isSyntaxGuideOpen ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`} 
              title="語法速查指南"
             >
               <HelpCircle size={20}/>
             </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm" title="詳細設定"><Settings size={20}/></button>
            <button onClick={() => setIsPreview(!isPreview)} className={`p-2.5 rounded-xl transition-all shadow-md ${isPreview ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} title="預覽模式">
              {isPreview ? <Edit3 size={20}/> : <Eye size={20}/>}
            </button>
            {!isLocked && <button onClick={() => { onSave(doc); alert('已儲存！'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center transition-all"><Save size={18} className="mr-2"/> 儲存</button>}
          </div>
        </div>

        <div className="space-y-8 flex-1">
          {/* 版本控制按鈕 (僅核准文件顯示) */}
          {isLocked && (
             <div className="bg-blue-900 text-white p-8 rounded-[36px] shadow-2xl shadow-blue-200 relative overflow-hidden">
                <Lock className="absolute -right-4 -top-4 text-white/10 w-24 h-24" />
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-blue-400"/> 此版本已核准封存</h4>
                <p className="text-[10px] text-blue-200 font-medium leading-relaxed mb-6">目前內容已鎖定不可編輯。如需修改，請建立新的修訂版本。</p>
                <button 
                   onClick={() => onRevise(doc)}
                   className="w-full bg-blue-500 hover:bg-white hover:text-blue-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center shadow-lg"
                >
                   <History size={16} className="mr-2"/> 建立修訂版本 (v{ (parseFloat(doc.version) + 1).toFixed(1) })
                </button>
             </div>
          )}

          {/* Company Profile Switcher */}
          <div className="bg-slate-100/80 border border-slate-200 p-6 rounded-[32px] shadow-inner">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center">
              <Building2 size={14} className="mr-2 text-blue-600"/> 目前代入公司設定檔
            </h4>
            <select 
              className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={activeProfileId}
              onChange={e => onProfileChange(e.target.value)}
            >
              {variableProfiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
            </select>
          </div>

          {!isLocked && (
            <div className="bg-white border border-slate-200 p-8 rounded-[36px] shadow-xl">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center mb-6"><Zap className="w-5 h-5 mr-2 text-blue-600"/> AI 輔助撰寫助手</h4>
              
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">內容語氣風格 (Tone)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={aiTone}
                  onChange={e => setAiTone(e.target.value as ToneType)}
                >
                  <option value="standard">ISO 標準 (應、必須、規範性)</option>
                  <option value="hr">HR 溝通 (溫暖、指導性、易讀)</option>
                  <option value="official">官方公文 (嚴謹、 bureaucratic)</option>
                </select>
              </div>

              <textarea 
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-4 text-xs font-bold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none mb-4 h-32 resize-none shadow-inner" 
                placeholder="請簡單描述您想撰寫的內容標題或大綱..." 
                value={aiPrompt} 
                onChange={e => setAiPrompt(e.target.value)}
              />
              <button 
                onClick={handleAIAutoFill} 
                disabled={aiLoading} 
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-slate-200 group"
              >
                {aiLoading ? <RefreshCw className="animate-spin mr-3" size={16}/> : <Zap className="mr-3 group-hover:scale-125 transition-transform" size={16}/>}
                {aiLoading ? '正在生成智能內容...' : '自動生成 ISO 內容'}
              </button>
            </div>
          )}

          {/* 儲存範本區塊 */}
          <div className="bg-pink-50 border border-pink-100 p-8 rounded-[36px]">
            <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-4 flex items-center">
              <Heart size={14} className="mr-2 fill-pink-600"/> 範本庫操作
            </h4>
            <p className="text-[10px] text-pink-700 font-bold mb-6">將目前的文件結構與章節儲存為範本，以便日後重複使用。</p>
            <button 
              onClick={() => onSaveAsTemplate(doc)}
              className="w-full bg-white border border-pink-200 text-pink-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
            >
              <Heart size={16} className="mr-2"/> 儲存為範本
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[36px]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">章節快速導覽</h4>
            <div className="space-y-3">
              {doc.sections.map((s, idx) => (
                <div key={s.id} className="flex items-start text-[11px] font-black text-slate-600 hover:text-blue-600 transition-all cursor-pointer group">
                  <span className="w-8 text-slate-400 font-mono">{idx + 1}.</span>
                  <span className="truncate flex-1">{s.title || '未命名章節'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Main */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        {isPreview ? (
          <div className="p-12 flex flex-col items-center pb-48">
            <div className="no-print flex flex-col space-y-6 mb-12 w-full max-w-[21cm]">
               <div className="flex space-x-6">
                 <div className="flex-1 bg-white p-6 rounded-[32px] border border-slate-300 flex items-center shadow-lg">
                   <FileText size={24} className="text-blue-600 mr-4"/>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">ISO 列印與 PDF 匯出模式</p>
                      <p className="text-sm font-black text-slate-900">自動下載檔名：<span className="text-blue-600 font-mono text-xs">{suggestedFilename}</span></p>
                   </div>
                 </div>
                 <button 
                  onClick={handleDownloadPDF} 
                  disabled={isExporting}
                  className={`${isExporting ? 'bg-slate-400' : 'bg-slate-900 hover:bg-blue-700'} text-white px-12 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center shadow-2xl transition-all h-[72px]`}
                 >
                   {isExporting ? <RefreshCw className="animate-spin mr-3" size={20}/> : <FileDown size={20} className="mr-3"/>}
                   {isExporting ? '正在生成 PDF...' : 'AI 匯出標準 PDF'}
                 </button>
               </div>
               <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center text-blue-700">
                  <Download size={18} className="mr-3 shrink-0"/>
                  <p className="text-[11px] font-bold">系統已優化：點擊按鈕後將直接下載 PDF，並自動完成檔案命名，無需手動選擇印表機。</p>
               </div>
            </div>
            <ISODocumentRenderer data={doc} allDocuments={allDocuments} activeProfile={activeProfile} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-12 pb-48 relative">
            <div className={`bg-white p-16 rounded-[48px] shadow-xl border mb-12 transition-all ${isLocked ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block border-l-4 border-blue-600 pl-4">文件標題 (Document Title)</label>
                {isLocked && <div className="flex items-center text-blue-700 font-black text-[10px] uppercase tracking-widest bg-blue-100 px-4 py-1 rounded-full"><Lock size={12} className="mr-2"/> 已核准版本標題已鎖定</div>}
              </div>
              <input 
                className={`w-full text-5xl font-black border-none focus:ring-0 p-0 placeholder:text-slate-200 transition-colors ${isLocked ? 'text-slate-500 bg-transparent' : 'text-slate-900 bg-white'}`}
                placeholder="輸入文件標題名稱..." 
                value={doc.title} 
                onChange={e => !isLocked && setDoc({...doc, title: e.target.value})} 
                readOnly={isLocked}
              />
              <div className="mt-10 flex items-center space-x-8 text-[11px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-100 pt-6">
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">文件編號: <span className="text-slate-900">{doc.docNumber}</span></span>
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">版次: <span className="text-slate-900">v{doc.version}</span></span>
                {isLocked && <span className="text-emerald-600 flex items-center"><CheckCircle size={14} className="mr-1"/> 已核准版本</span>}
              </div>
            </div>

            <div className="space-y-10">
              {doc.sections.map((s, idx) => (
                <div key={s.id} className={`bg-white rounded-[48px] border shadow-md relative overflow-visible transition-all duration-500 ${isLocked ? 'border-slate-200' : 'border-slate-200 hover:shadow-2xl'}`}>
                  <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/30 rounded-t-[48px] flex items-center justify-between">
                     <div className="flex items-center w-full">
                       <span className="text-xl font-mono text-slate-400 mr-4 font-black">{idx + 1}.</span>
                       <input 
                          className={`bg-transparent border-none focus:ring-0 font-black text-xl w-full p-0 placeholder:text-slate-300 ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}
                          value={s.title} 
                          onChange={e => handleSectionChange(s.id, 'title', e.target.value)} 
                          placeholder="請輸入章節標題..."
                          readOnly={isLocked}
                       />
                     </div>
                     {!isLocked && <button onClick={() => setDoc(prev => ({...prev, sections: prev.sections.filter(sec => sec.id !== s.id)}))} className="text-slate-400 hover:text-rose-500 transition-colors p-2"><Trash2 size={20}/></button>}
                  </div>
                  <div className="p-8 relative">
                    <textarea 
                      className={`w-full min-h-[240px] font-medium text-lg resize-none p-8 leading-relaxed rounded-[24px] transition-all outline-none ${
                        isLocked 
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-transparent' 
                          : 'bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:shadow-inner focus:ring-4 focus:ring-blue-50/50 border border-slate-100 focus:border-blue-200'
                      }`}
                      placeholder="請在此輸入章節詳細內容..." 
                      value={s.content} 
                      readOnly={isLocked}
                      onChange={e => {
                        const val = e.target.value;
                        handleSectionChange(s.id, 'content', val);
                        if (val.endsWith('{{') || val.endsWith('[[')) {
                          setActiveSuggestionSection(s.id);
                        } else {
                          setActiveSuggestionSection(null);
                        }
                      }} 
                    />

                    {!isLocked && (
                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex space-x-2">
                            {refineLoading && refiningSectionId === s.id ? (
                               <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-4 py-2 rounded-full flex items-center animate-pulse"><Zap size={14} className="mr-2"/> AI 思考中...</span>
                            ) : (
                              <>
                                <button onClick={() => handleRefine(s.id, 'polish')} className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center">
                                  <Wand2 size={14} className="mr-2"/> 潤飾
                                </button>
                                <button onClick={() => handleRefine(s.id, 'check')} className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-4 py-2 rounded-full hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center">
                                  <ShieldCheck size={14} className="mr-2"/> 合規檢查
                                </button>
                                <button onClick={() => handleRefine(s.id, 'tone_official')} className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-4 py-2 rounded-full hover:bg-purple-600 hover:text-white transition-all shadow-sm flex items-center">
                                  <MessageSquare size={14} className="mr-2"/> 公文語氣
                                </button>
                              </>
                            )}
                         </div>

                         <button onClick={() => setActiveSuggestionSection(activeSuggestionSection === s.id ? null : s.id)} className="text-[10px] font-black uppercase text-blue-800 bg-blue-100/50 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                           智能變數與參照助手
                         </button>
                      </div>
                    )}

                    {!isLocked && activeSuggestionSection === s.id && (
                      <div className="absolute left-10 bottom-full mb-6 z-50 bg-white border border-slate-300 rounded-[32px] shadow-2xl p-8 w-[340px] animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">智能插入智能助手</h5>
                          <button onClick={() => setActiveSuggestionSection(null)} className="text-slate-400 hover:text-slate-900"><X size={18}/></button>
                        </div>
                        <div className="space-y-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                           {activeProfile && (
                             <div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center border-l-2 border-blue-500 pl-2">
                                 <Variable className="w-4 h-4 mr-2 text-blue-600"/> 公司變數 ({"{{KEY}}"})
                               </p>
                               <div className="flex flex-wrap gap-2">
                                 {Object.keys(activeProfile.variables).map(key => (
                                   <button key={key} onClick={() => insertVariable(s.id, key)} className="text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">{key}</button>
                                 ))}
                               </div>
                             </div>
                           )}
                           <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center border-l-2 border-slate-400 pl-2">
                               <BookOpen className="w-4 h-4 mr-2 text-slate-600"/> 文件內部參照 ([[REF]])
                             </p>
                             <div className="space-y-2">
                               {allDocuments.filter(d => d.id !== doc.id).map(d => (
                                 <button key={d.id} onClick={() => insertReference(s.id, d.id)} className="w-full text-left text-[11px] font-black text-slate-700 hover:text-blue-600 truncate py-2.5 px-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                                   [{d.docNumber}] {d.title}
                                 </button>
                               ))}
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isLocked && (
              <button onClick={() => setDoc(prev => ({...prev, sections: [...prev.sections, {id: Math.random().toString(36).substr(2, 9), title: '新增章節單元', content: ''}]}))} className="w-full mt-12 py-16 border-4 border-dashed border-slate-200 rounded-[48px] text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center space-y-4 group">
                 <PlusCircle size={48} className="group-hover:scale-110 transition-transform"/>
                 <span className="font-black text-xs uppercase tracking-[0.2em]">增加文件章節 / Add Section</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;
