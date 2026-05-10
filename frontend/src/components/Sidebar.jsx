import { Plus, BookOpen, Trash2, PanelLeftClose, Loader2, FileText } from "lucide-react";

const Sidebar = ({ sessions, onNewSession, onSelectSession, onDelete, onViewPdf, isOpen, onToggle, isUploading }) => {
  const onDeleteSession = (sessionId) => {
    onDelete(sessionId);
  };

  return (
    <div className={`h-full bg-glass border-r border-default transition-[width] duration-250 ease-out-expo overflow-hidden flex flex-col ${isOpen ? 'w-72' : 'w-0'}`}>

      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b border-default">
        <h1 className="font-bold text-accent tracking-tight font-serif">Lumina</h1>
        <button onClick={onToggle} className="text-muted hover:text-primary transition active:scale-[0.97]" aria-label="Close sidebar">
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <button
          onClick={onNewSession}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-on-accent py-2 px-4 rounded-lg transition active:scale-[0.97] duration-150 ease-out-expo mb-4 shadow-theme-lg"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus size={20} /> New Study Session
            </>
          )}
        </button>

        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          Your Sessions
        </p>
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="group flex items-center justify-between p-3 rounded-md hover:bg-secondary cursor-pointer text-secondary hover:text-primary transition active:scale-[0.98] duration-150 ease-out-expo"
              onClick={() => onSelectSession(session.id)}
            >
              <span className="truncate text-base font-medium text-primary font-serif">{session.session_name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPdf(session.id);
                  }}
                  className="p-1 hover:text-accent transition active:scale-[0.9]"
                  title="View PDF"
                  aria-label="View PDF"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1 hover:text-destructive transition active:scale-[0.9]"
                  aria-label="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
