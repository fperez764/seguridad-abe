// src/App.tsx
import { useEffect } from 'react'; //  Asegúrate de importar useEffect
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useUserMenu } from './hooks/useUserMenu';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';

function App() {
  const { token } = useAuthStore();
  
  //  Obtenemos los datos del menú (antes solo pedíamos isLoading y error)
  const { data: menuItems, isLoading, error } = useUserMenu(); 
  
  //  Obtenemos la función para actualizar el menú en el Store
  const setMenu = useAuthStore((state) => state.setMenu);

  //  MAGIA: Cuando lleguen los datos del backend, los guardamos en el Store
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      console.log("Menú recibido y guardado en Store:", menuItems);
      setMenu(menuItems);
    }
  }, [menuItems, setMenu]);

  // Si no hay token, mostrar el Login
  if (!token) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-xl text-slate-600">Cargando entorno...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-red-600">Error al cargar permisos. Contacte a TI.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Aquí irán las rutas internas protegidas */}
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800">Panel Principal</h1>
      <p className="mt-4 text-slate-600">
        Seleccione una opción del menú lateral para comenzar.
      </p>
    </div>
  );
}

export default App;