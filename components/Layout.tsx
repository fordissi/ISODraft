
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center no-print">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xl">I</div>
          <h1 className="text-xl font-bold tracking-tight">ISO-Draft <span className="text-blue-400">Pro</span></h1>
        </div>
        <div className="flex space-x-6 text-sm font-medium">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`hover:text-blue-400 transition ${activeView === 'dashboard' ? 'text-blue-400' : ''}`}
          >
            儀表板
          </button>
          <button 
            onClick={() => onNavigate('editor')}
            className={`hover:text-blue-400 transition ${activeView === 'editor' ? 'text-blue-400' : ''}`}
          >
            文件編輯器
          </button>
          <button 
            onClick={() => onNavigate('templates')}
            className={`hover:text-blue-400 transition ${activeView === 'templates' ? 'text-blue-400' : ''}`}
          >
            範本庫
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className={`hover:text-blue-400 transition ${activeView === 'settings' ? 'text-blue-400' : ''}`}
          >
            系統設定
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-400">AI Assistant Online</div>
          <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600"></div>
        </div>
      </nav>
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;
