
import React, { useEffect, useState } from 'react';
import { ISODocument, ISODocLevel, VariableProfile } from '../types';
import mermaid from 'mermaid';

// Initialize Mermaid with ISO-friendly defaults
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter',
  flowchart: { htmlLabels: true, curve: 'basis' }
});

interface ISODocumentRendererProps {
  data: ISODocument;
  allDocuments: ISODocument[];
  activeProfile?: VariableProfile;
}

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (e) {
        if (isMounted) setError('無法預覽流程圖：語法錯誤');
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (error) return <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded-xl my-4 font-mono">{error}</div>;
  return <div className="mermaid-container my-8 w-full flex justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const ISODocumentRenderer: React.FC<ISODocumentRendererProps> = ({ data, allDocuments, activeProfile }) => {
  const approvalDate = data.approvalLog?.timestamp ? data.approvalLog.timestamp.split('T')[0] : "---";
  
  // 動態取得文件階層的英文標籤
  const getDocTypeLabel = (level: ISODocLevel) => {
    if (level.includes('Level 1')) return "Quality Manual / 品質手冊";
    if (level.includes('Level 2')) return "Standard Operating Procedure / 程序書";
    if (level.includes('Level 3')) return "Work Instruction / 作業指導書";
    if (level.includes('Level 4')) return "Form / Record / 表單與紀錄";
    return "Standard Document / 標準文件";
  };

  // 取得公司名稱首字作為 Logo 佔位符
  const companyInitial = activeProfile?.profileName ? activeProfile.profileName.charAt(0).toUpperCase() : "I";

  const processContent = (content: string) => {
    if (!content) return "";
    let processed = content;
    if (activeProfile) {
      Object.entries(activeProfile.variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processed = processed.replace(regex, `<span class="bg-blue-50 text-blue-900 font-black px-1 rounded-sm border-b border-blue-200">${value || key}</span>`);
      });
    }
    const refRegex = /\[\[REF:(.*?)\]\]/g;
    processed = processed.replace(refRegex, (match, docId) => {
      const targetDoc = allDocuments.find(d => d.id === docId);
      if (targetDoc) {
        return `<span class="inline-flex items-center text-slate-900 font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 mx-1">
          ${targetDoc.title} (${targetDoc.docNumber})
        </span>`;
      }
      return `<span class="text-rose-600 font-bold italic">[未連結文件]</span>`;
    });
    return processed;
  };

  const renderMarkdownBlocks = (content: string) => {
    const processedContent = processContent(content);
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    
    // Split by mermaid blocks
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = mermaidRegex.exec(processedContent)) !== null) {
      const before = processedContent.substring(lastIndex, match.index);
      if (before.trim().length > 0) parts.push({ type: 'text', content: before });
      parts.push({ type: 'mermaid', content: match[1] });
      lastIndex = mermaidRegex.lastIndex;
    }
    const after = processedContent.substring(lastIndex);
    if (after.trim().length > 0) parts.push({ type: 'text', content: after });

    return parts.map((part, partIndex) => {
      if (part.type === 'mermaid') {
        return <MermaidDiagram key={`mermaid-${partIndex}`} chart={part.content} />;
      }

      // Text processing with Table support
      const lines = part.content.split('\n');
      const elements: React.ReactNode[] = [];
      let tableBuffer: string[] = [];

      const flushTable = () => {
        if (tableBuffer.length === 0) return;
        
        // Simple Table Parser
        // Determine if it has a header row (second row contains ---)
        const hasHeader = tableBuffer.length >= 2 && tableBuffer[1].includes('---');
        
        // Parse rows
        const rows = tableBuffer.map(row => 
          row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
        );

        // Determine alignments from the second row (e.g., :--- | :---: | ---:)
        const alignments = hasHeader ? tableBuffer[1].trim().replace(/^\||\|$/g, '').split('|').map(col => {
            const c = col.trim();
            if (c.startsWith(':') && c.endsWith(':')) return 'center';
            if (c.endsWith(':')) return 'right';
            return 'left';
        }) : [];

        const headerRow = hasHeader ? rows[0] : null;
        const bodyRows = hasHeader ? rows.slice(2) : rows; // Skip header and separator if present

        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              {headerRow && (
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider">
                  <tr>
                    {headerRow.map((cell, i) => (
                      <th key={i} className={`px-4 py-3 border-b border-slate-300 text-${alignments[i] || 'left'} whitespace-nowrap`}>
                         <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-200">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`px-4 py-3 text-slate-700 text-${alignments[ci] || 'left'} border-r border-slate-100 last:border-r-0`}>
                         <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableBuffer = [];
      };

      lines.forEach((line, i) => {
        const trimmed = line.trim();
        
        // Table detection: Line starts with |
        if (trimmed.startsWith('|')) {
          tableBuffer.push(trimmed);
        } else {
          flushTable();
          
          if (!trimmed) return;
          
          let html = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          // Reference highlights are handled in processContent but kept here for robustness
          
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(<li key={`li-${i}`} className="ml-6 list-disc text-slate-900 font-medium mb-1" dangerouslySetInnerHTML={{__html: html.substring(2)}} />);
          } else if (trimmed.match(/^\d+\.\s/)) {
            const match = trimmed.match(/^(\d+)\.\s+(.*)/);
            elements.push(<div key={`ol-${i}`} className="flex ml-2 mb-2"><span className="font-bold mr-2 text-slate-700">{match![1]}.</span><span className="font-medium text-slate-900" dangerouslySetInnerHTML={{__html: match![2]}}/></div>);
          } else if (trimmed.startsWith('> ')) {
            // Blockquote
            elements.push(<blockquote key={`bq-${i}`} className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-slate-50 text-slate-700 italic rounded-r-lg" dangerouslySetInnerHTML={{__html: html.substring(2)}} />);
          } else if (trimmed.startsWith('### ')) {
            // H3 Header
            elements.push(<h3 key={`h3-${i}`} className="text-sm font-black mt-6 mb-3 text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-3" dangerouslySetInnerHTML={{__html: html.substring(4)}} />);
          } else if (trimmed.startsWith('## ')) {
            // H2 Header
            elements.push(<h2 key={`h2-${i}`} className="text-base font-black mt-8 mb-4 text-slate-900" dangerouslySetInnerHTML={{__html: html.substring(3)}} />);
          } else {
            // Paragraph
            elements.push(<p key={`p-${i}`} className="mb-3 text-slate-900 font-medium leading-relaxed text-justify" dangerouslySetInnerHTML={{__html: html}} />);
          }
        }
      });
      flushTable(); // Flush if the part ends with a table

      return <div key={`text-${partIndex}`}>{elements}</div>;
    });
  };

  const signatures = [
    { role: "制定 (Author)", name: data.author, date: data.createdAt.split('T')[0], isSigned: true },
    { role: "審核 (Reviewer)", name: data.approvalLog ? data.approvalLog.reviewerName : (data.reviewerEmail || "---"), date: approvalDate, isSigned: !!data.approvalLog },
    { role: "核准 (Approver)", name: data.approvalLog ? "Management" : "---", date: approvalDate, isSigned: !!data.approvalLog }
  ];

  return (
    <div className="iso-render-root flex flex-col items-center">
      {/* Page 1: Control Sheet */}
      <div className="iso-page">
        <div className="w-full border-2 border-slate-900 flex mb-8 h-28 shrink-0">
          <div className="w-1/4 p-4 border-r-2 border-slate-900 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-2xl mb-1 shadow-sm">{companyInitial}</div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900 leading-tight">
              {activeProfile?.profileName || 'YourCompany'}
            </span>
          </div>
          <div className="w-2/4 p-4 border-r-2 border-slate-900 flex flex-col justify-center items-center text-center">
            <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.15em] mb-1">{getDocTypeLabel(data.level)}</span>
            <h1 className="text-2xl font-black leading-tight uppercase tracking-tight text-slate-900">{data.title}</h1>
          </div>
          <div className="w-1/4 p-3 text-[9px] font-mono flex flex-col justify-center space-y-1 text-slate-900">
            <div className="flex justify-between"><strong>Doc No:</strong> <span className="font-bold underline">{data.docNumber}</span></div>
            <div className="flex justify-between"><strong>Version:</strong> <span className="font-bold underline">{data.version}</span></div>
          </div>
        </div>

        <div className="mb-10">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">核准簽署 / APPROVAL SIGNATURES</h4>
          <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
            <thead><tr className="bg-slate-100"><th className="border border-slate-900 px-3 py-2 text-left text-slate-900">職務 / Role</th><th className="border border-slate-900 px-3 py-2 text-left text-slate-900">姓名 / Name</th><th className="border border-slate-900 px-3 py-2 text-left text-slate-900">日期 / Date</th><th className="border border-slate-900 px-3 py-2 text-center text-slate-900">簽核 / Signature</th></tr></thead>
            <tbody>{signatures.map((sig, i) => (<tr key={i}><td className="border border-slate-900 px-3 py-3 font-bold text-slate-900">{sig.role}</td><td className="border border-slate-900 px-3 py-3 text-slate-900">{sig.name}</td><td className="border border-slate-900 px-3 py-3 text-slate-900">{sig.date}</td><td className="border border-slate-900 px-3 py-3 text-center italic font-serif text-slate-900">{sig.isSigned ? <span className="text-blue-900 font-bold">/ Digitally Verified /</span> : <span className="text-slate-500">Pending</span>}</td></tr>))}</tbody>
          </table>
        </div>

        <div className="mb-10">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">修訂紀錄 / REVISION HISTORY</h4>
          <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
            <thead><tr className="bg-slate-100"><th className="border border-slate-900 px-2 py-2 text-center w-12 text-slate-900">Rev</th><th className="border border-slate-900 px-2 py-2 text-center w-24 text-slate-900">Date</th><th className="border border-slate-900 px-2 py-2 text-left text-slate-900">Description</th><th className="border border-slate-900 px-2 py-2 text-center w-20 text-slate-900">Author</th></tr></thead>
            <tbody>{data.revisions.length > 0 ? data.revisions.map((rev) => (<tr key={rev.id}><td className="border border-slate-900 px-2 py-2 text-center font-bold text-slate-900">{rev.version}</td><td className="border border-slate-900 px-2 py-2 text-center text-slate-900">{rev.date}</td><td className="border border-slate-900 px-2 py-2 text-slate-900 font-medium">{rev.description}</td><td className="border border-slate-900 px-2 py-2 text-center text-slate-900">{rev.author}</td></tr>)) : (<tr><td colSpan={4} className="border border-slate-900 px-2 py-6 text-center text-slate-800 italic font-medium">Initial release.</td></tr>)}</tbody>
          </table>
        </div>

        <div className="mt-auto border-t-2 border-slate-900 pt-4 flex justify-between items-center text-[8px] font-black text-slate-900 uppercase tracking-widest">
           <span>Control Document - {activeProfile?.profileName || 'YourCompany'}</span>
           <span>Page 1 / 2</span>
        </div>
      </div>

      {/* Page 2: Content Body */}
      <div className="iso-page">
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-8 text-[9px] font-black text-slate-900 uppercase shrink-0">
           <span>{data.title}</span>
           <span>Doc No: {data.docNumber} | v{data.version}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-10">
            {data.sections.map((section) => (
              <div key={section.id} className="section-block">
                <h2 className="text-sm font-black border-b-2 border-slate-900 pb-1 mb-3 uppercase tracking-tight flex items-center text-slate-900">
                   <div className="bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center mr-3 text-[10px]">{section.title.split('.')[0]}</div>
                   {section.title}
                </h2>
                <div className="pl-9 text-xs leading-[1.75] text-justify font-bold text-slate-900">
                  {renderMarkdownBlocks(section.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto border-t-2 border-slate-900 pt-4 flex justify-between items-center text-[8px] font-black text-slate-900 uppercase tracking-widest shrink-0">
           <span>Control Document - {activeProfile?.profileName || 'YourCompany'}</span>
           <span>Page 2 / 2</span>
        </div>
      </div>
    </div>
  );
};

export default ISODocumentRenderer;
