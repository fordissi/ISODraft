
import React, { useState, useMemo } from 'react';
import { ISODocument, CategoryDef, getStandardFilename } from '../types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3, 
  CloudUpload, 
  Download, 
  RefreshCw, 
  ArrowRight,
  Filter,
  Eye,
  History
} from 'lucide-react';

interface DashboardProps {
  documents: ISODocument[];
  categories: CategoryDef[];
  onEdit: (doc: ISODocument) => void;
  onRevise: (doc: ISODocument) => void;
  onCreate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, categories, onEdit, onRevise, onCreate }) => {
  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'approved'>('all');

  const funnelStats = useMemo(() => ({
    drafts: documents.filter(d => d.status === 'draft').length,
    pending: documents.filter(d => d.status === 'review').length,
    approved: documents.filter(d => d.status === 'approved').length,
  }), [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const categoryMatch = activeTab === 'all' || doc.category === activeTab;
      const statusMatch = statusFilter === 'all' || doc.status === statusFilter;
      return categoryMatch && statusMatch;
    });
  }, [documents, activeTab, statusFilter]);

  const handleDownload = (doc: ISODocument) => {
    const filename = getStandardFilename(doc);
    alert(`正在下載系統標準命名 PDF:\n\n檔名: ${filename}\n\n下載後請手動歸檔至對應目錄。`);
  };

  const getCategoryBadge = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return null;
    const colors = { blue: 'bg-blue-50 text-blue-600 border-blue-100', purple: 'bg-purple-50 text-purple-600 border-purple-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', rose: 'bg-rose-50 text-rose-600 border-rose-100', slate: 'bg-slate-50 text-slate-500 border-slate-200' };
    return <span className={`${colors[cat.color]} px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border`}>{cat.name.split(' ')[0]}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col h-full overflow-y-auto pb-20">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center">
            個人文件管理中心 
            <span className="ml-4 bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black">Admin Mode</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">一站式管理品質、人事與行政文件，核准後請手動歸檔至雲端硬碟。</p>
        </div>
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black transition flex items-center space-x-3 shadow-2xl shadow-blue-200 uppercase tracking-widest text-xs group">
          <FileText size={18} className="group-hover:rotate-12 transition-transform"/>
          <span>建立新文件</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <button onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')} className={`p-8 rounded-[40px] border transition-all text-left relative group ${statusFilter === 'draft' ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-400">草稿 (Drafts)</div>
          <div className={`text-6xl font-black mb-2 ${statusFilter === 'draft' ? 'text-white' : 'text-slate-900'}`}>{funnelStats.drafts}</div>
          <Edit3 size={40} className={`absolute top-8 right-8 ${statusFilter === 'draft' ? 'text-slate-800' : 'text-slate-100'}`}/>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'review' ? 'all' : 'review')} className={`p-8 rounded-[40px] border transition-all text-left relative group ${statusFilter === 'review' ? 'bg-amber-500 border-amber-500 shadow-2xl scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-400">待簽核 (Pending)</div>
          <div className={`text-6xl font-black mb-2 ${statusFilter === 'review' ? 'text-white' : 'text-amber-600'}`}>{funnelStats.pending}</div>
          <Clock size={40} className={`absolute top-8 right-8 ${statusFilter === 'review' ? 'text-amber-400' : 'text-slate-100'}`}/>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')} className={`p-8 rounded-[40px] border transition-all text-left relative group ${statusFilter === 'approved' ? 'bg-emerald-600 border-emerald-600 shadow-2xl scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-400">已核准 (Ready)</div>
          <div className={`text-6xl font-black mb-2 ${statusFilter === 'approved' ? 'text-white' : 'text-emerald-600'}`}>{funnelStats.approved}</div>
          <CheckCircle size={40} className={`absolute top-8 right-8 ${statusFilter === 'approved' ? 'text-emerald-500' : 'text-slate-100'}`}/>
        </button>
      </div>

      <div className="flex items-center space-x-1 mb-6 bg-slate-100 p-1.5 rounded-[20px] w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>全部</button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`px-6 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === cat.id ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{cat.name}</button>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 text-white z-10">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">文件標題</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">編號</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">狀態</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">動作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6">
                    <button onClick={() => onEdit(doc)} className="flex flex-col text-left">
                      <div className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{doc.title}</div>
                      <div className="flex items-center mt-1 space-x-2">
                         {getCategoryBadge(doc.category)}
                         <span className="text-[10px] text-slate-400 font-bold uppercase">{doc.department}</span>
                      </div>
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded text-xs inline-block">{doc.docNumber}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase mt-1">v{doc.version}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : doc.status === 'review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                      {doc.status === 'approved' && (
                        <button 
                          onClick={() => onRevise(doc)} 
                          className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center shadow-sm"
                          title="建立新修訂版本"
                        >
                          <History size={14} className="mr-2"/> 新版本
                        </button>
                      )}
                      <button onClick={() => onEdit(doc)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl transition-all shadow-sm"><Eye size={16}/></button>
                      <button onClick={() => handleDownload(doc)} className="bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"><Download size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
