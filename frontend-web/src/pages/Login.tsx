import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Lock, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  // Estados del formulario
  const [step, setStep] = useState<1 | 2>(1);
  const [ldapUid, setLdapUid] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStep1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.loginStep1(ldapUid, password);
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setStep(2); // Pasar al paso del OTP
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al validar credenciales LDAP');
    } finally {
      setLoading(false);
    }
  };

const handleStep2 = async (e: React.FormEvent<HTMLFormElement>) =>  {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.loginStep2(tempToken, otp);
      // Guardar en Zustand
      setToken(data.access_token);
      setUser(data.user);
      // Redirigir al Dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código OTP inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Sistema de Seguridad ABE</h2>
          <p className="text-slate-500 mt-1">
            {step === 1 ? 'Ingrese sus credenciales corporativas' : 'Ingrese el código enviado a su correo'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario LDAP</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={ldapUid}
                  onChange={(e) => setLdapUid(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="juan.perez"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código OTP (6 dígitos)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar e Ingresar'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-slate-500 text-sm hover:text-slate-700"
            >
              ← Volver a credenciales
            </button>
          </form>
        )}
      </div>
    </div>
  );
};