
import React, { useState, useMemo } from 'react';
import { ISODocument, ISODocLevel, CategoryDef } from '../types';
import { 
  Layers, 
  Users, 
  Briefcase, 
  ArrowLeft, 
  Zap, 
  Star, 
  Filter, 
  LayoutGrid, 
  Heart,
  ChevronRight,
  FileText,
  Search,
  BookOpen,
  PenTool,
  ClipboardCheck
} from 'lucide-react';

interface TemplateGalleryProps {
  userTemplates: ISODocument[];
  categories: CategoryDef[];
  onSelect: (template: Partial<ISODocument>) => void;
  onBack: () => void;
}

type FilterCategory = 'all' | 'custom' | 'level1' | 'level2' | 'level3' | 'level4' | string;

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ userTemplates, categories, onSelect, onBack }) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const systemTemplates = [
    {
      title: '全公司品質管理手冊 (Quality Manual)',
      category: 'iso',
      icon: <Layers className="text-blue-600" size={24} />,
      description: 'ISO 9001:2015 高階架構 (HLS)，定義組織背景、領導承諾與營運全貌。',
      level: ISODocLevel.LEVEL_1,
      sections: [
        { 
          id: '1', 
          title: '1.0 組織背景 (Context)', 
          content: '本章節分析組織內部與外部議題 (SWOT)。\n\n| 分析面向 | 優勢 (Strengths) | 劣勢 (Weaknesses) | 機會 (Opportunities) | 威脅 (Threats) |\n| :--- | :--- | :--- | :--- | :--- |\n| **內部因素** | 技術領先、團隊資深 | 自動化程度不足 | - | - |\n| **外部因素** | - | - | 市場需求擴大 | 原物料價格波動 |' 
        },
        { 
          id: '2', 
          title: '2.0 品質政策 (Policy)', 
          content: '> **品質政策聲明：**\n> 本公司承諾持續改善品質管理系統，滿足客戶需求並符合法規要求。\n\n**核心目標：**\n1. 客戶滿意度達 95% 以上。\n2. 產品不良率低於 0.1%。' 
        },
        { 
          id: '3', 
          title: '3.0 組織全景 (Organization)', 
          content: '本公司之高階管理架構如下：\n\n```mermaid\ngraph TD\n  CEO[總經理] --> MR[管理代表]\n  CEO --> DeptA[業務部]\n  CEO --> DeptB[生產部]\n  CEO --> DeptC[品管部]\n  CEO --> DeptD[行政部]\n  DeptB --> Line1[製造一課]\n  DeptB --> Line2[製造二課]\n```' 
        },
        {
          id: '4',
          title: '4.0 規劃與營運 (Planning & Operation)',
          content: '本公司依據 PDCA 循環進行風險管理與資源分配，確保產品實現過程受控。詳細流程參照各階程序書。'
        }
      ]
    },
    {
      title: '標準作業程序書 (SOP Template)',
      category: 'iso',
      icon: <BookOpen className="text-blue-500" size={24} />,
      description: '標準 Level 2 程序書框架，內建標準流程圖 (Flowchart) 與權責定義。',
      level: ISODocLevel.LEVEL_2,
      sections: [
        { id: '1', title: '1.0 目的 (Purpose)', content: '本程序旨在規範 {{PROCESS_NAME}} 之作業流程，確保作業品質穩定並符合規範。' },
        { id: '2', title: '2.0 範圍 (Scope)', content: '適用於本公司 {{DEPARTMENT}} 執行之所有相關作業。' },
        { 
          id: '3', 
          title: '3.0 流程圖 (Process Flow)', 
          content: '```mermaid\ngraph TD\n  Start((作業開始)) --> Step1[10. 接收需求/工單]\n  Step1 --> Step2[20. 執行準備確認]\n  Step2 --> Check{30. 資料/條件是否完整?}\n  Check -- 是 (Yes) --> Step3[40. 執行主要作業]\n  Check -- 否 (No) --> Error[異常回報/退回]\n  Error --> Step1\n  Step3 --> QC[50. 自主檢查]\n  QC --> End((作業結束))\n```' 
        },
        { id: '4', title: '4.0 定義 (Definitions)', content: '- **專案負責人 (PM)**: 負責統籌專案進度。\n- **N.C.**: 不符合事項 (Non-Conformity)。' },
        { id: '5', title: '5.0 作業內容 (Description)', content: '### 5.1 接收需求\n權責單位應確認需求單之完整性...\n\n### 5.2 執行作業\n依據作業指導書進行操作，並記錄於...\n\n### 5.3 異常處理\n若發生異常，應立即停止作業並通報主管。' },
        { id: '6', title: '6.0 相關文件 (References)', content: '- [[REF:WI-001]] 機台操作規範\n- [[REF:FORM-002]] 異常矯正紀錄表' }
      ]
    },
    {
      title: '機台/系統操作規範 (Work Instruction)',
      category: 'iso',
      icon: <PenTool className="text-emerald-600" size={24} />,
      description: '針對單一任務的詳細步驟說明，包含故障排除對策表。',
      level: ISODocLevel.LEVEL_3,
      sections: [
        { id: '1', title: '1.0 作業前準備', content: '1. 確認電源已開啟。\n2. 穿戴適當的個人防護裝備 (PPE)：\n   - 安全眼鏡\n   - 防靜電手套\n3. 檢查機台面板是否顯示 "READY"。' },
        { id: '2', title: '2.0 操作步驟 (Steps)', content: '1. 將原料放入進料口 A。\n2. 按下綠色 "START" 按鈕。\n3. 觀察螢幕數據，溫度應維持在 150°C ± 5°C。\n4. 作業完成後，按下紅色 "STOP" 按鈕。' },
        { 
          id: '3', 
          title: '3.0 故障排除 (Troubleshooting)', 
          content: '| 問題現象 | 可能原因 | 簡易排除對策 |\n| :--- | :--- | :--- |\n| 無法啟動 | 電源線鬆脫 | 檢查電源插座與保險絲 |\n| 溫度過高 | 散熱風扇故障 | 清潔風扇濾網，若無效請報修 |\n| 異音產生 | 軸承潤滑不足 | 依保養手冊進行上油 |' 
        },
        { id: '4', title: '4.0 注意事項 (Notices)', content: '> **警告：** 機台運作中嚴禁將手伸入護蓋內。\n> **注意：** 每日作業結束後務必執行 5S 清潔。' }
      ]
    },
    {
      title: '對外正式公文範本 (Official Letter)',
      category: 'admin',
      icon: <Briefcase className="text-slate-600" size={24} />,
      description: '標準行政發文格式 (函)，包含受文者、主旨、說明與擬辦區塊。',
      level: ISODocLevel.LEVEL_4,
      sections: [
        { 
          id: '1', 
          title: '發文資訊', 
          content: '| 發文日期 | {{DATE}} | 發文字號 | {{DOC_ID}} |\n| :--- | :--- | :--- | :--- |\n| **速別** | 普通件 | **密等及解密條件** | 普通 |\n| **附件** | 如文 | | |' 
        },
        { id: '2', title: '主旨 (Subject)', content: '關於 {{SUBJECT}} 一案，請查照。' },
        { id: '3', title: '說明 (Explanation)', content: '一、依據 {{REFERENCE_DOC}} 辦理。\n二、本案旨在說明...\n三、隨函檢附相關資料一份，請 貴單位惠予協助辦理。' },
        { id: '4', title: '擬辦 (Action)', content: '擬請同意後，公告實施。' },
        { id: '5', title: '正本/副本', content: '**正本：** {{RECIPIENT}}\n**副本：** 管理部、稽核室' }
      ]
    },
    {
      title: '通用查檢紀錄表 (General Checklist)',
      category: 'iso',
      icon: <ClipboardCheck className="text-amber-500" size={24} />,
      description: '可列印的點檢表單，包含標準 Markdown 表格與簽核欄位。',
      level: ISODocLevel.LEVEL_4,
      sections: [
        { 
          id: '1', 
          title: '表頭資訊', 
          content: '| 專案/設備名稱 | {{TARGET_NAME}} | 檢查日期 | {{DATE}} |\n| :--- | :--- | :--- | :--- |\n| **檢查人員** | {{AUTHOR}} | **督導主管** | |' 
        },
        { 
          id: '2', 
          title: '查檢內容 (Checklist)', 
          content: '| 項次 | 檢查項目 | 檢查標準 | 結果 (Pass/Fail) | 備註 |\n| :---: | :--- | :--- | :---: | :--- |\n| 1 | 環境清潔 | 無雜物堆積、地面乾燥 | [ ] | |\n| 2 | 設備歸零 | 儀表顯示為 0 | [ ] | |\n| 3 | 安全防護 | 護蓋功能正常 | [ ] | |\n| 4 | 原料確認 | 料號與工單相符 | [ ] | |\n| 5 | 工具歸位 | 使用後工具已歸位 | [ ] | |' 
        },
        { id: '3', title: '異常紀錄', content: '若有不合格項目，請簡述異常狀況：\n\n\n' },
        { id: '4', title: '簽核欄位', content: '> 本表單需保存 3 年。\n\n**經辦人簽名：** ____________________\n\n**主管覆核：** ____________________' }
      ]
    }
  ];

  const allTemplates = useMemo(() => {
    return [
      ...systemTemplates.map(t => ({ ...t, isSystem: true, id: t.title })),
      ...userTemplates.map(t => ({ 
        title: t.title, 
        category: t.category, 
        icon: <Heart className="text-pink-500" size={24} />, 
        description: `使用者範本: ${t.docNumber}`, 
        level: t.level, 
        sections: t.sections,
        isSystem: false,
        id: t.id
      }))
    ];
  }, [userTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'all': return true;
        case 'custom': return !t.isSystem;
        case 'level1': return t.level === ISODocLevel.LEVEL_1;
        case 'level2': return t.level === ISODocLevel.LEVEL_2;
        case 'level3': return t.level === ISODocLevel.LEVEL_3;
        case 'level4': return t.level === ISODocLevel.LEVEL_4;
        default: 
          return t.category === activeFilter;
      }
    });
  }, [allTemplates, activeFilter, searchQuery]);

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 no-print overflow-y-auto">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-10 transition-colors">
          <ArrowLeft size={16} className="mr-2"/> 返回儀表板
        </button>

        <div className="mb-8">
           <h2 className="text-2xl font-black text-slate-900 leading-tight">範本庫</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Template Library</p>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeFilter === 'all' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="mr-3"><LayoutGrid size={16}/></span>
            全部範本
          </button>
          
          <button
            onClick={() => setActiveFilter('custom')}
            className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeFilter === 'custom' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="mr-3"><Heart size={16} className="text-pink-500"/></span>
            我的範本
          </button>

          <div className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">按階層篩選</div>
          {[
            { id: 'level1', label: 'Level 1: 政策' },
            { id: 'level2', label: 'Level 2: 程序' },
            { id: 'level3', label: 'Level 3: 指導' },
            { id: 'level4', label: 'Level 4: 表單' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeFilter === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="mr-3"><ChevronRight size={14}/></span>
              {item.label}
            </button>
          ))}

          <div className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">按類別篩選</div>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeFilter === cat.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="mr-3">
                {cat.id === 'iso' ? <Layers size={16}/> : cat.id === 'hr' ? <Users size={16}/> : <BookOpen size={16}/>}
              </span>
              {cat.name}
            </button>
          ))}
        </nav>

        <div className="mt-10 p-6 bg-blue-50 rounded-[32px] border border-blue-100">
           <Star size={24} className="text-blue-500 mb-3"/>
           <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-relaxed">建立您的專屬標準。儲存任何文件為範本，一鍵重複使用。</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="bg-white border-b border-slate-200 px-10 py-6 sticky top-0 z-10 flex items-center justify-between">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
            <input 
              type="text" 
              placeholder="搜尋範本標題或內容描述..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               顯示 {filteredTemplates.length} 個範本
             </div>
             <button onClick={() => onSelect({})} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
               空白文件
             </button>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
          {filteredTemplates.map((tpl) => (
            <div 
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-blue-400 cursor-pointer transition-all group relative overflow-hidden flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  {tpl.icon}
                </div>
                {tpl.isSystem ? (
                  <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">System</span>
                ) : (
                  <span className="bg-pink-100 text-pink-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center">
                    <Heart size={8} className="mr-1 fill-pink-500"/> Custom
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{tpl.title}</h3>
              <p className="text-xs text-slate-400 font-bold font-medium leading-relaxed mb-6 flex-1">{tpl.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">文件階層</span>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{tpl.level.split(':')[0]}</span>
                </div>
                <div className="bg-slate-900 text-white w-10 h-10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:w-28 transition-all overflow-hidden relative">
                   <Zap size={16} className="absolute"/>
                   <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap text-[9px] font-black uppercase tracking-widest ml-2">立即開始</span>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-8 rounded-full text-slate-200 mb-6">
                <Filter size={64}/>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">無符合條件的範本</h3>
              <p className="text-slate-400 font-bold max-w-sm">請嘗試不同的搜尋關鍵字或分類過濾條件。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
