
import React, { useState } from 'react';
import { CategoryDef, VariableProfile, ISODocLevel } from '../types';
import { 
  Plus, 
  Trash2, 
  Settings as SettingsIcon, 
  Layers, 
  ShieldCheck,
  PlusCircle,
  Building2,
  Variable,
  Check,
  X
} from 'lucide-react';

interface SettingsProps {
  categories: CategoryDef[];
  onAddCategory: (cat: CategoryDef) => void;
  onDeleteCategory: (id: string) => void;
  variableProfiles: VariableProfile[];
  onUpdateProfiles: (profiles: VariableProfile[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, 
  onAddCategory, 
  onDeleteCategory,
  variableProfiles,
  onUpdateProfiles
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(variableProfiles[0]?.id || null);
  
  const [isAddingVar, setIsAddingVar] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: CategoryDef = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      color: 'blue',
      type: 'custom'
    };
    onAddCategory(newCat);
    setNewCatName('');
  };

  const handleAddProfile = () => {
    const newProfile: VariableProfile = {
      id: `profile-${Date.now()}`,
      profileName: '新公司設定',
      variables: { 'COMPANY_NAME': '新公司名稱' }
    };
    onUpdateProfiles([...variableProfiles, newProfile]);
    setSelectedProfileId(newProfile.id);
  };

  const handleDeleteProfile = (id: string) => {
    if (variableProfiles.length <= 1) {
      alert('系統必須保留至少一個設定檔。');
      return;
    }
    const filtered = variableProfiles.filter(p => p.id !== id);
    onUpdateProfiles(filtered);
    setSelectedProfileId(filtered[0]?.id || null);
  };

  const updateProfile = (id: string, updates: Partial<VariableProfile>) => {
    const nextProfiles = variableProfiles.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    onUpdateProfiles(nextProfiles);
  };

  const submitNewVar = () => {
    if (!newVarKey.trim() || !selectedProfileId) return;
    const sanitizedKey = newVarKey.trim().toUpperCase().replace(/\s+/g, '_');
    const profile = variableProfiles.find(p => p.id === selectedProfileId);
    
    if (profile) {
      if (profile.variables[sanitizedKey] !== undefined) {
        alert('此變數名稱已存在。');
        return;
      }
      const newVars = { ...profile.variables, [sanitizedKey]: '' };
      updateProfile(selectedProfileId, { variables: newVars });
      setNewVarKey('');
      setIsAddingVar(false);
    }
  };

  const handleRemoveVar = (profileId: string, key: string) => {
    const profile = variableProfiles.find(p => p.id === profileId);
    if (profile) {
      const newVars = { ...profile.variables };
      delete newVars[key];
      updateProfile(profileId, { variables: newVars });
    }
  };

  const currentProfile = variableProfiles.find(p => p.id === selectedProfileId);

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <header>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center">
            <SettingsIcon className="mr-4 text-blue-600" size={36}/>
            系統設定
          </h2>
          <p className="text-slate-600 font-medium mt-2">管理多公司變數定義與文件分類規範。</p>
        </header>

        {/* 多公司變數管理區塊 */}
        <section className="bg-white rounded-[40px] border border-slate-300 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <Building2 className="mr-3 text-blue-500" size={24}/>
              多公司變數管理
            </h3>
            <button 
              onClick={handleAddProfile} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center transition-all shadow-lg shadow-blue-200"
            >
              <PlusCircle size={16} className="mr-2"/> 新增設定檔
            </button>
          </div>
          
          <div className="flex h-[600px]">
            {/* 左側清單 */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/80 p-4 space-y-2 overflow-y-auto">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">公司設定檔清單</p>
              {variableProfiles.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`w-full text-left px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    selectedProfileId === p.id 
                      ? 'bg-slate-900 text-white shadow-xl translate-x-1' 
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  {p.profileName}
                </button>
              ))}
            </div>
            
            {/* 右側變數內容 */}
            <div className="flex-1 p-10 overflow-y-auto bg-white">
              {currentProfile ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* 設定檔標題與刪除 */}
                  <div className="flex justify-between items-end bg-slate-100 p-8 rounded-[32px] border border-slate-200">
                    <div className="flex-1 mr-8">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">公司顯示名稱 (Profile Name)</label>
                      <input 
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={currentProfile.profileName}
                        onChange={e => updateProfile(currentProfile.id, { profileName: e.target.value })}
                      />
                    </div>
                    <button 
                      onClick={() => handleDeleteProfile(currentProfile.id)} 
                      className="text-rose-500 hover:text-white hover:bg-rose-500 p-4 rounded-2xl transition-all border border-rose-200 bg-white shadow-sm"
                      title="刪除設定檔"
                    >
                      <Trash2 size={24}/>
                    </button>
                  </div>

                  {/* 變數列表 */}
                  <div>
                    <div className="flex justify-between items-center mb-6 px-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">全局替換變數 (鍵值對)</h4>
                      {!isAddingVar ? (
                        <button 
                          onClick={() => setIsAddingVar(true)} 
                          className="text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all border border-blue-100"
                        >
                          <Plus size={16} className="mr-1"/> 新增鍵值對
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 animate-in slide-in-from-right-2">
                          <input 
                            autoFocus
                            placeholder="輸入變數名(如: CEO)"
                            className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-[11px] font-black uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 w-48 shadow-inner"
                            value={newVarKey}
                            onChange={e => setNewVarKey(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitNewVar()}
                          />
                          <button onClick={submitNewVar} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Check size={16}/></button>
                          <button onClick={() => setIsAddingVar(false)} className="bg-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-300 transition-colors shadow-sm"><X size={16}/></button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(currentProfile.variables).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-4 bg-slate-50/50 p-5 rounded-3xl border border-slate-200 group hover:border-blue-400 hover:bg-white hover:shadow-xl transition-all">
                          <div className="w-1/3">
                            <code className="text-[11px] font-black text-blue-800 bg-blue-100/50 px-3 py-2 rounded-xl border border-blue-200 block truncate text-center">
                              {"{{" + key + "}}"}
                            </code>
                          </div>
                          <div className="flex-1 flex items-center space-x-3">
                            <input 
                              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                              placeholder="輸入取代後的文字內容..."
                              value={value}
                              onChange={e => {
                                const newVars = { ...currentProfile.variables, [key]: e.target.value };
                                updateProfile(currentProfile.id, { variables: newVars });
                              }}
                            />
                            <button 
                              onClick={() => handleRemoveVar(currentProfile.id, key)} 
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                              title="刪除變數"
                            >
                              <Trash2 size={20}/>
                            </button>
                          </div>
                        </div>
                      ))}
                      {Object.keys(currentProfile.variables).length === 0 && (
                        <div className="text-center py-16 bg-slate-50 rounded-[40px] border border-dashed border-slate-300">
                           <Variable className="mx-auto text-slate-300 mb-4" size={48}/>
                           <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">目前沒有自定義變數鍵值</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Building2 size={80} className="opacity-10 mb-6"/>
                   <p className="font-black text-xs uppercase tracking-widest">請從左側清單選擇公司設定檔以開始管理</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 分類管理 */}
        <section className="bg-white rounded-[40px] border border-slate-300 shadow-sm p-10">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center">
            <Layers className="mr-3 text-slate-500" size={24}/>
            文件分類管理
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-6 rounded-[24px] border border-slate-200 bg-slate-50 group hover:bg-white hover:shadow-lg hover:border-blue-200 transition-all">
                <span className="text-xs font-black uppercase tracking-widest text-slate-800">{cat.name}</span>
                {cat.type === 'custom' && (
                  <button onClick={() => onDeleteCategory(cat.id)} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all">
                    <Trash2 size={20}/>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 pt-10 border-t border-slate-200 flex items-end space-x-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-4">新增分類名稱</label>
              <input 
                type="text" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="例如：環境安全文件 (EHS)..."
                className="w-full bg-white border border-slate-300 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <button onClick={handleAddCategory} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest h-[60px] hover:bg-blue-600 transition-all shadow-xl">新增分類</button>
          </div>
        </section>

        {/* ISO 定義區塊 */}
        <section className="bg-slate-900 rounded-[40px] shadow-2xl p-12 text-white relative overflow-hidden">
          <h3 className="text-2xl font-black mb-10 flex items-center relative z-10">
            <ShieldCheck className="mr-3 text-blue-400" size={32}/>
            ISO 文件階層定義參考
          </h3>
          <div className="grid grid-cols-1 gap-5 relative z-10">
            {[
              { level: 'Level 1', title: '品質手冊 (Manual)', desc: '組織品質管理系統之最高指導方針、願景、政策。', color: 'text-blue-400' },
              { level: 'Level 2', title: '程序書 (Procedures)', desc: '針對各部門作業流程之具體規範（人、事、時、地、物）。', color: 'text-purple-400' },
              { level: 'Level 3', title: '作業指導書 (Instructions)', desc: '更細部、針對單一職務或設備之操作說明。', color: 'text-emerald-400' },
              { level: 'Level 4', title: '表單與紀錄 (Forms & Records)', desc: '執行作業後之證據留存，為稽核時之客觀證據。', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-start p-7 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className={`text-[11px] font-black uppercase tracking-widest w-24 shrink-0 mt-1 transition-colors group-hover:text-white ${item.color}`}>{item.level}</div>
                <div className="ml-6">
                  <div className="font-black text-xl mb-2">{item.title}</div>
                  <div className="text-slate-300 text-sm font-medium leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
