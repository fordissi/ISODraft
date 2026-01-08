
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocumentEditor from './components/DocumentEditor';
import TemplateGallery from './components/TemplateGallery';
import Settings from './components/Settings';
import { ISODocument, ISODocLevel, CategoryDef, VariableProfile } from './types';
import { FileSearch } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'templates' | 'settings'>('dashboard');

  const [categories, setCategories] = useState<CategoryDef[]>([
    { id: 'iso', name: '品質文件 (ISO)', color: 'blue', type: 'system' },
    { id: 'hr', name: '人事規章 (HR)', color: 'purple', type: 'system' },
    { id: 'admin', name: '行政發文 (Admin)', color: 'slate', type: 'system' },
  ]);

  const [variableProfiles, setVariableProfiles] = useState<VariableProfile[]>([
    {
      id: 'default',
      profileName: '預設公司',
      variables: {
        'COMPANY_NAME': '範例科技有限公司',
        'TAX_ID': '88888888',
        'CEO': '王大明'
      }
    }
  ]);

  const [activeProfileId, setActiveProfileId] = useState<string>('default');

  const [documents, setDocuments] = useState<ISODocument[]>([
    {
      id: '1',
      title: '品質管理手冊',
      docNumber: 'QM-01',
      version: 'A.0',
      level: ISODocLevel.LEVEL_1,
      category: 'iso',
      department: '管理部',
      author: 'Admin',
      createdAt: '2023-10-01',
      status: 'approved',
      reviewers: [
        { id: 'r1', name: '陳經理', status: 'approved', date: '2023-10-02', note: 'Email 確認 OK' }
      ],
      finalApprover: {
        name: '吳總經理',
        status: 'approved',
        date: '2023-10-03',
        note: '簽呈核准'
      },
      sections: [
        { id: 's1', title: '範圍', content: '本手冊涵蓋 {{COMPANY_NAME}} 所有產品之生產與銷售流程。' },
        { id: 's2', title: '引用標準', content: 'ISO 9001:2015 品質管理系統。' }
      ],
      revisions: [
        { id: 'r1', version: 'A.0', date: '2023-10-01', description: '初版發行', author: 'Admin' }
      ]
    }
  ]);

  const [userTemplates, setUserTemplates] = useState<ISODocument[]>([]);
  const [editingDoc, setEditingDoc] = useState<ISODocument | null>(null);

  const handleEdit = (doc: ISODocument) => {
    setEditingDoc(doc);
    setActiveView('editor');
  };

  const handleCreateNew = (template?: Partial<ISODocument>) => {
    const newDoc: ISODocument = {
      id: Date.now().toString(),
      title: template?.title || '新文件草案',
      docNumber: template?.docNumber || 'DOC-TEMP',
      version: '1.0',
      level: template?.level || ISODocLevel.LEVEL_2,
      category: template?.category || categories[0].id,
      department: template?.department || '未分類',
      author: '使用者',
      reviewers: [],
      finalApprover: { name: '管理代表', status: 'pending' },
      createdAt: new Date().toISOString(),
      status: 'draft',
      sections: JSON.parse(JSON.stringify(template?.sections || [
        { id: '1', title: '1.0 目的', content: '請在此輸入文件目的...' },
        { id: '2', title: '2.0 範圍', content: '請在此輸入適用範圍...' }
      ])),
      revisions: []
    };
    setEditingDoc(newDoc);
    setActiveView('editor');
  };

  const handleCreateRevision = (oldDoc: ISODocument, type: 'major' | 'minor' = 'major') => {
    const currentVerNum = parseFloat(oldDoc.version) || 0;
    let nextVer = '';
    let nextStatus: 'draft' | 'approving' = 'draft';

    if (type === 'major') {
      nextVer = (Math.floor(currentVerNum) + 1).toFixed(1); // 1.5 -> 2.0
      nextStatus = 'draft';
    } else {
      nextVer = (currentVerNum + 0.1).toFixed(1); // 1.0 -> 1.1
      nextStatus = 'approving'; // Fast-track to final approval
    }

    const newRev: ISODocument = {
      ...JSON.parse(JSON.stringify(oldDoc)),
      id: Date.now().toString(),
      version: nextVer,
      status: nextStatus, // draft or approving
      createdAt: new Date().toISOString(),
      approvalLog: undefined,
      reviewers: [], // Always reset reviewers for new version
      finalApprover: { name: oldDoc.finalApprover.name, status: 'pending' }, // Keep approver name
      revisions: [
        ...oldDoc.revisions,
        {
          id: Date.now().toString() + "-rev",
          version: oldDoc.version,
          date: new Date().toISOString().split('T')[0],
          description: type === 'minor' ? '行政勘誤 / Typo Correction' : `基於版本 ${oldDoc.version} 建立之修訂版`,
          author: '使用者'
        }
      ]
    };
    setEditingDoc(newRev);
    setActiveView('editor');
  };

  const handleSave = (doc: ISODocument) => {
    setDocuments(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) {
        return prev.map(d => d.id === doc.id ? doc : d);
      }
      return [doc, ...prev];
    });
  };

  const handleSaveAsTemplate = (doc: ISODocument) => {
    const templateDoc: ISODocument = {
      ...doc,
      id: `tpl-${Date.now()}`,
      isTemplate: true,
      status: 'draft',
      createdAt: new Date().toISOString(),
      revisions: [],
      approvalLog: undefined
    };
    setUserTemplates(prev => [templateDoc, ...prev]);
    alert('已成功新增至範本庫！');
  };

  const handleAddCategory = (cat: CategoryDef) => {
    setCategories(prev => [...prev, cat]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            documents={documents}
            categories={categories}
            onEdit={handleEdit}
            onRevise={handleCreateRevision}
            onCreate={() => setActiveView('templates')}
          />
        );
      case 'templates':
        return (
          <TemplateGallery
            userTemplates={userTemplates}
            categories={categories}
            onSelect={handleCreateNew}
            onBack={() => setActiveView('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            variableProfiles={variableProfiles}
            onUpdateProfiles={setVariableProfiles}
          />
        );
      case 'editor':
        if (!editingDoc) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10">
              <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-200 text-center max-w-md">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
                  <FileSearch size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">未選擇任何文件</h3>
                <p className="text-slate-500 font-medium mb-8">請先從儀表板選擇現有文件，或前往範本庫建立新文件。</p>
                <div className="flex flex-col space-y-3">
                  <button onClick={() => setActiveView('dashboard')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">回到儀表板</button>
                  <button onClick={() => setActiveView('templates')} className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">前往範本庫</button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <DocumentEditor
            document={editingDoc}
            allDocuments={documents}
            categories={categories}
            variableProfiles={variableProfiles}
            activeProfileId={activeProfileId}
            onProfileChange={setActiveProfileId}
            onSave={handleSave}
            onRevise={handleCreateRevision}
            onSaveAsTemplate={handleSaveAsTemplate}
            onClose={() => {
              setEditingDoc(null);
              setActiveView('dashboard');
            }}
          />
        );
      default:
        // Fixed: Added onRevise prop to satisfy DashboardProps requirements
        return <Dashboard documents={documents} categories={categories} onEdit={handleEdit} onRevise={handleCreateRevision} onCreate={() => setActiveView('templates')} />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={(v) => {
      if (v === 'editor' && !editingDoc) {
        setActiveView('editor');
      } else {
        setActiveView(v as any);
      }
    }}>
      {renderContent()}
    </Layout>
  );
};

export default App;
