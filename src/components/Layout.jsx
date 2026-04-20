import { useState, useContext } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  History, 
  BarChart3, 
  ArrowRightLeft, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Punto de Venta', path: '/pos', icon: ShoppingCart },
    { name: 'Productos', path: '/products', icon: Package },
    { name: 'Categorías', path: '/categories', icon: Tags },
    { name: 'Ventas', path: '/sales', icon: History },
    { name: 'Stock', path: '/stock', icon: ArrowRightLeft },
    { name: 'Reportes', path: '/reports', icon: BarChart3 },
  ];

  if (user?.rol === 'admin') {
    menuItems.push({ name: 'Usuarios', path: '/users', icon: Users });
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile sidebar toggle */}
      <button 
        className="md:hidden fixed z-50 top-4 right-4 bg-surface p-2 rounded-md border border-slate-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-40 w-64 h-full bg-surface border-r border-slate-800 transition-transform duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-center border-b border-slate-800">
           <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">KioscoPOS</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${
                  isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-textMuted hover:bg-slate-800 hover:text-textLight'
                }`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-textLight'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-300">
              {user?.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-textLight truncate">{user?.nombre}</p>
              <p className="text-xs text-textMuted capitalize">{user?.rol}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors border border-transparent hover:border-danger/20"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full h-full p-4 md:p-8">
         <Outlet />
      </main>
    </div>
  );
};

export default Layout;
