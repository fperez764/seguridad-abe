import { useNavigate } from 'react-router-dom';
import { useAuthStore, type MenuItem } from '../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ExternalLink
} from 'lucide-react';

// Mapeo de iconos (puedes expandirlo según necesites)
const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Reports: <FileText className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const { menu, user, logout } = useAuthStore();

  const handleMenuClick = (item: MenuItem) => {
    if (item.isExternal) {
      // Sistema externo: redirección completa
      window.location.href = item.url;
    } else {
      // Ruta interna: React Router
      navigate(item.url);
    }
  };

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold">Sistema ABE</h2>
        <p className="text-sm text-slate-400 mt-1">
          {user?.ldapUid || 'Usuario'}
        </p>
      </div>

      {/* Menú Dinámico */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.code}>
              <button
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                         hover:bg-slate-700 transition-colors text-left"
              >
                <span className="text-slate-300">
                  {iconMap[item.icon] || <LayoutDashboard className="w-5 h-5" />}
                </span>
                <span className="flex-1">{item.name}</span>
                {item.isExternal && (
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer con Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                   bg-red-600 hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};