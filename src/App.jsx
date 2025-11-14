import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zyducbruxaqpuupioaoe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZHVjYnJ1eGFxcHV1cGlvYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjUyNzEsImV4cCI6MjA3ODY0MTI3MX0.8Dd0ZFogpaPYXft5sdbS5SBaPaNr26qr5Z8-hr1X_9M'
);

function App() {
  const [view, setView] = useState('license');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

// ============================================
// VERSIÓN ULTRA SIMPLIFICADA Y DEBUGGEADA
// Esta versión tiene console.logs en cada paso
// para que podamos ver exactamente qué pasa
// ============================================

const LicenseScreen = () => {
  const [license, setLicense] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'loading', 'register', 'error'
  const [licenseData, setLicenseData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [teamData, setTeamData] = useState({
    teamName: '',
    coachName: '',
    email: '',
    password: ''
  });

  console.log('🔍 Estado actual:', { step, license, licenseData });

  const validateLicense = async () => {
    console.log('1️⃣ Iniciando validación...');
    const cleanLicense = license.trim().toUpperCase();
    
    if (!cleanLicense || cleanLicense.length < 10) {
      console.log('❌ Licencia muy corta');
      setErrorMsg('Por favor introduce una licencia válida');
      return;
    }
    
    if (!cleanLicense.includes('WELLNESS')) {
      console.log('❌ No contiene WELLNESS');
      setErrorMsg('Licencia inválida. Debe contener WELLNESS');
      return;
    }
    
    console.log('2️⃣ Cambiando a estado loading...');
    setStep('loading');
    setErrorMsg('');
    
    try {
      console.log('3️⃣ Buscando en Supabase...');
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', cleanLicense)
        .maybeSingle();

      console.log('4️⃣ Respuesta de Supabase:', { data, error });

      if (!data) {
        console.log('❌ Licencia no encontrada');
        setStep('input');
        setErrorMsg('❌ Licencia no válida. Esta licencia no existe en el sistema.');
        return;
      }

      if (data.status === 'used') {
        console.log('❌ Licencia ya usada');
        setStep('input');
        setErrorMsg('❌ Esta licencia ya ha sido activada anteriormente.');
        return;
      }

      console.log('✅ Licencia válida! Guardando datos...');
      setLicenseData(data);
      
      console.log('5️⃣ Cambiando a estado register...');
      setStep('register');
      console.log('✅ Debería mostrarse el formulario ahora!');
      
    } catch (err) {
      console.error('💥 Error:', err);
      setStep('input');
      setErrorMsg('Error al validar la licencia: ' + err.message);
    }
  };

  const createTeam = async () => {
    console.log('📝 Creando equipo...');
    
    if (!teamData.teamName || !teamData.coachName || !teamData.email || !teamData.password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    if (!licenseData) {
      setErrorMsg('Error: No hay datos de licencia válidos');
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      const cleanLicense = license.trim().toUpperCase();
      
      console.log('1️⃣ Creando registro en teams...');
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            license: cleanLicense,
            team_name: teamData.teamName,
            coach_name: teamData.coachName,
            coach_email: teamData.email,
            coach_password: teamData.password
          }
        ])
        .select()
        .single();

      if (teamError) {
        console.error('❌ Error al crear equipo:', teamError);
        setStep('register');
        if (teamError.code === '23505') {
          setErrorMsg('Este email ya está registrado');
        } else {
          setErrorMsg('Error: ' + teamError.message);
        }
        return;
      }

      console.log('✅ Equipo creado:', newTeam);

      console.log('2️⃣ Marcando licencia como usada...');
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString(),
          user_email: teamData.email,
          team_id: newTeam.id
        })
        .eq('id', licenseData.id);

      if (updateError) {
        console.error('⚠️ Error al actualizar licencia:', updateError);
      } else {
        console.log('✅ Licencia marcada como usada');
      }

      console.log('🎉 TODO COMPLETADO! Redirigiendo...');
      
      // Mostrar mensaje de éxito por 2 segundos
      setErrorMsg(''); // Limpiar error
      setTimeout(() => {
        setView('login');
      }, 1500);
      
    } catch (err) {
      console.error('💥 Error:', err);
      setStep('register');
      setErrorMsg('Error al crear la cuenta: ' + err.message);
    }
  };

  // ============================================
  // RENDERIZADO SEGÚN EL STEP
  // ============================================

  console.log('🎨 Renderizando step:', step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ WellnessHub Pro</h1>
          <p className="text-gray-600">Sistema Profesional de Control de Bienestar</p>
        </div>

        {/* Debug Info (quitar en producción) */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <strong>Debug:</strong> step = {step}
        </div>

        {/* Mensajes de Error */}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMsg}</p>
          </div>
        )}

        {/* PANTALLA 1: INPUT DE LICENCIA */}
        {step === 'input' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Introduce tu clave de licencia
            </label>
            <input
              type="text"
              placeholder="WELLNESS-202511-XXXX-XXXX-XX"
              value={license}
              onChange={(e) => {
                setLicense(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && license) {
                  validateLicense();
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 font-mono text-sm"
            />
            <button
              onClick={() => {
                console.log('🖱️ Click en validar');
                validateLicense();
              }}
              disabled={!license}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              Validar Licencia
            </button>
            <button
              onClick={() => setView('login')}
              className="w-full mt-3 text-blue-600 hover:text-blue-800 font-medium"
            >
              Ya tengo una cuenta
            </button>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">ℹ️ Formato de licencia:</p>
              <code className="text-xs">WELLNESS-YYYYMM-XXXX-XXXX-CC</code>
            </div>
          </div>
        )}

        {/* PANTALLA 2: LOADING */}
        {step === 'loading' && (
          <div className="text-center py-8">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Procesando...</p>
          </div>
        )}

        {/* PANTALLA 3: FORMULARIO DE REGISTRO */}
        {step === 'register' && (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Licencia válida: <code className="font-mono font-bold">{license}</code>
              </p>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">Crea tu Cuenta</h2>
            
            <input
              type="text"
              placeholder="Nombre del Equipo"
              value={teamData.teamName}
              onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Tu Nombre Completo"
              value={teamData.coachName}
              onChange={(e) => setTeamData({ ...teamData, coachName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={teamData.email}
              onChange={(e) => setTeamData({ ...teamData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={teamData.password}
              onChange={(e) => setTeamData({ ...teamData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
            />
            
            <button
              onClick={createTeam}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              🚀 Activar Licencia y Crear Cuenta
            </button>
            
            <button
              onClick={() => {
                console.log('⬅️ Volver a input');
                setStep('input');
                setLicenseData(null);
                setErrorMsg('');
              }}
              className="w-full mt-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* PANTALLA 4: SUCCESS (opcional) */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Cuenta Creada!</h2>
            <p className="text-gray-600 mb-4">Tu licencia ha sido activada exitosamente.</p>
            <p className="text-sm text-gray-500">Redirigiendo al login...</p>
          </div>
        )}

      </div>
    </div>
  );
};

  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
      if (!email || !password) {
        alert('Por favor completa todos los campos');
        return;
      }

      setLoading(true);

      try {
        // Buscar en la tabla de coaches/teams
        const { data: coach } = await supabase
          .from('teams')
          .select('*')
          .eq('coach_email', email)
          .eq('coach_password', password)
          .maybeSingle();

        if (coach) {
          setCurrentUser({ role: 'coach', teamId: coach.id, ...coach });
          setView('coach-dashboard');
          setLoading(false);
          return;
        }

        // Buscar en la tabla de jugadores
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('email', email)
          .eq('password', password);

        if (players && players.length > 0) {
          const player = players[0];
          setCurrentUser({ 
            role: 'player', 
            teamId: player.team_id, 
            playerId: player.id,
            ...player 
          });
          setView('player-form');
          setLoading(false);
          return;
        }

        alert('❌ Email o contraseña incorrectos');
      } catch (err) {
        console.error('Error login:', err);
        alert('Error al iniciar sesión: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ WellnessHub Pro</h1>
            <p className="text-gray-600">Iniciar Sesión</p>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
          <button
            onClick={() => setView('license')}
            className="w-full mt-3 text-blue-600 hover:text-blue-800 font-medium"
          >
            Activar nueva licencia
          </button>
        </div>
      </div>
    );
  };

 const CoachDashboard = () => {
  // Estados
  const [activeTab, setActiveTab] = useState('overview');
  const [players, setPlayers] = useState([]);
  // ... resto del código

  // Funciones
  const loadPlayers = async () => { ... }
  const addPlayer = async () => { ... }
  const deletePlayer = async () => { ... }

  // Render
  return (
    <div>
      {/* Pestañas: Resumen, Jugadores, Configuración */}
    </div>
  );
};
const PlayerForm = () => {
  // Estados
  const [wellnessData, setWellnessData] = useState({ ... });
  const [history, setHistory] = useState([]);

  // Funciones
  const loadHistory = async () => { ... }
  const submitWellness = async () => { ... }

  // Render
  return (
    <div>
      {/* Formulario de bienestar + Historial */}
    </div>
  );
};

  return (
    <div>
      {view === 'license' && <LicenseScreen />}
      {view === 'login' && <LoginScreen />}
      {view === 'coach-dashboard' && <CoachDashboard />}
      {view === 'player-form' && <PlayerForm />}
    </div>
  );
}

export default App;
