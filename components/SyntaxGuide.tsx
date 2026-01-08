
import React, { useState } from 'react';
import { X, Copy, Check, FileText, Grid, GitMerge } from 'lucide-react';

interface SyntaxGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyntaxGuide: React.FC<SyntaxGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'table' | 'mermaid'>('markdown');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const Snippet = ({ id, label, code, desc }: { id: string, label: string, code: string, desc?: string }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 group hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <button 
          onClick={() => handleCopy(code, id)}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="複製代碼"
        >
          {copiedId === id ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
      {desc && <p className="mt-2 text-[10px] text-slate-500 font-medium">{desc}</p>}
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[150] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-900 text-lg flex items-center">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-xs">?</span>
          語法速查指南
        </h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all">
          <X size={20}/>
        </button>
      </div>

      <div className="flex p-2 gap-2 border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('markdown')} 
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center ${activeTab === 'markdown' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FileText size={14} className="mr-2"/> 基礎格式
        </button>
        <button 
          onClick={() => setActiveTab('table')} 
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center ${activeTab === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Grid size={14} className="mr-2"/> 表格
        </button>
        <button 
          onClick={() => setActiveTab('mermaid')} 
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center ${activeTab === 'mermaid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <GitMerge size={14} className="mr-2"/> 流程圖
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'markdown' && (
          <div className="space-y-2">
            <Snippet id="md-bold" label="粗體強調" code="**這是一段重要的文字**" desc="用於強調關鍵名詞或重點。" />
            <Snippet id="md-list" label="項目清單" code="- 項目一&#10;- 項目二&#10;  - 子項目 A" />
            <Snippet id="md-num" label="編號清單" code="1. 第一步驟&#10;2. 第二步驟&#10;3. 第三步驟" />
            <Snippet id="md-quote" label="引用與備註" code="> **注意：** 此區塊用於標示警告或重要規範。" />
            <Snippet id="md-link" label="超連結" code="[顯示文字](https://example.com)" />
          </div>
        )}

        {activeTab === 'table' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-4 font-bold">表格適用於 Level 4 表單設計。</p>
            <Snippet 
              id="tbl-basic" 
              label="標準表格" 
              code="| 欄位 A | 欄位 B | 備註 |&#10;| :--- | :---: | ---: |&#10;| 靠左內容 | 居中內容 | 靠右 |&#10;| 內容 1 | 內容 2 | 內容 3 |" 
              desc=":--- 代表靠左，:---: 居中，---: 靠右。"
            />
            <Snippet 
              id="tbl-check" 
              label="查檢表範例" 
              code="| 檢查項目 | 合格 | 不合格 | 備註 |&#10;| :--- | :---: | :---: | :--- |&#10;| 外觀檢查 | [ ] | [ ] | 無刮痕 |&#10;| 功能測試 | [ ] | [ ] | 電壓正常 |" 
            />
          </div>
        )}

        {activeTab === 'mermaid' && (
          <div className="space-y-2">
             <p className="text-xs text-slate-500 mb-4 font-bold">流程圖必須包裹在 ```mermaid 代碼塊中。</p>
            <Snippet 
              id="m-iso" 
              label="ISO 標準作業流程" 
              code="```mermaid&#10;graph TD&#10;  Start((作業開始)) --> Step1[1. 接收需求]&#10;  Step1 --> Check{資料是否完整?}&#10;  Check -- 是 --> Step2[2. 進行處理]&#10;  Check -- 否 --> Return[退回補件]&#10;  Return --> Step1&#10;  Step2 --> End((作業結束))&#10;```" 
              desc="包含開始/結束(圓角)、處理步驟(方框)與決策判斷(菱形)。"
            />
            <Snippet 
              id="m-basic" 
              label="簡單順序圖" 
              code="```mermaid&#10;graph LR&#10;  A[部門 A] -->|交付文件| B[部門 B]&#10;  B -->|審核回報| A&#10;```" 
              desc="graph LR 代表由左至右 (Left to Right)。"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SyntaxGuide;
