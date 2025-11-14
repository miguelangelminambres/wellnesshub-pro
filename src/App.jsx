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

 const LicenseScreen = () => {
  const [license, setLicense] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [validLicenseData, setValidLicenseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [teamData, setTeamData] = useState({
    teamName: '',
    coachName: '',
    email: '',
    password: ''
  });

  const validateLicense = async () => {
    const cleanLicense = license.trim().toUpperCase();
    
    // Limpiar mensajes anteriores
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!cleanLicense || cleanLicense.length < 10) {
      setErrorMessage('Por favor introduce una licencia válida');
      return;
    }
    
    if (!cleanLicense.includes('WELLNESS')) {
      setErrorMessage('Licencia inválida. Debe contener WELLNESS');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Verificar si la licencia existe en la tabla licenses
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', cleanLicense)
        .maybeSingle();

      console.log('Búsqueda de licencia:', { licenseData, licenseError });

      // Si no existe la licencia
      if (!licenseData) {
        setLoading(false);
        setErrorMessage('❌ Licencia no válida. Esta licencia no existe en el sistema.');
        return;
      }

      // Si la licencia ya fue usada
      if (licenseData.status === 'used') {
        setLoading(false);
        setErrorMessage('❌ Esta licencia ya ha sido activada anteriormente.');
        return;
      }

      // ✅ Licencia válida y disponible
      setValidLicenseData(licenseData);
      setLoading(false);
      setSuccessMessage('✅ ¡Licencia válida! Completa tu registro.');
      
      // Mostrar formulario después de un pequeño delay para que se vea el mensaje
      setTimeout(() => {
        setShowRegister(true);
      }, 500);
      
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
      setErrorMessage('Error al validar la licencia: ' + err.message);
    }
  };

  const createTeam = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!teamData.teamName || !teamData.coachName || !teamData.email || !teamData.password) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (!validLicenseData) {
      setErrorMessage('Error: No hay datos de licencia válidos');
      return;
    }

    setLoading(true);

    try {
      const cleanLicense = license.trim().toUpperCase();
      
      // 1. Crear el equipo
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
        console.error('Error al crear equipo:', teamError);
        if (teamError.code === '23505') {
          setErrorMessage('Este email ya está registrado');
        } else {
          setErrorMessage('Error: ' + teamError.message);
        }
        setLoading(false);
        return;
      }

      console.log('Equipo creado:', newTeam);

      // 2. Marcar la licencia como usada
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString(),
          user_email: teamData.email,
          team_id: newTeam.id
        })
        .eq('id', validLicenseData.id);

      if (updateError) {
        console.error('Error al actualizar licencia:', updateError);
      }

      setSuccessMessage('🎉 ¡Licencia activada! Tu cuenta ha sido creada exitosamente.');
      
      // Esperar 2 segundos para mostrar el mensaje de éxito y luego redirigir
      setTimeout(() => {
        setView('login');
      }, 2000);
      
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage('Error al crear la cuenta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ WellnessHub Pro</h1>
          <p className="text-gray-600">Sistema Profesional de Control de Bienestar</p>
        </div>

        {/* Mensajes de Error/Éxito */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
            <p className="text-sm text-green-800 font-semibold">{successMessage}</p>
          </div>
        )}

        {!showRegister ? (
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
                setErrorMessage(''); // Limpiar error al escribir
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && license) {
                  validateLicense();
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 font-mono text-sm"
            />
            <button
              onClick={validateLicense}
              disabled={loading || !license}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validando...
                </span>
              ) : (
                'Validar Licencia'
              )}
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
        ) : (
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
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={teamData.password}
              onChange={(e) => setTeamData({ ...teamData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
            />
            
            <button
              onClick={createTeam}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                '🚀 Activar Licencia y Crear Cuenta'
              )}
            </button>
            
            <button
              onClick={() => {
                setShowRegister(false);
                setValidLicenseData(null);
                setSuccessMessage('');
              }}
              className="w-full mt-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              ← Volver
            </button>
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
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard del Entrenador</h1>
            <p className="text-gray-600 mb-2">Bienvenido, <span className="font-bold">{currentUser?.coach_name}</span></p>
            <p className="text-gray-600 mb-4">Equipo: <span className="font-bold">{currentUser?.team_name}</span></p>
            <p className="text-sm text-gray-500 mb-4">Licencia: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{currentUser?.license}</code></p>
            <button
              onClick={() => {
                setCurrentUser(null);
                setView('login');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PlayerForm = () => {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold mb-4">Formulario del Jugador</h1>
            <p className="text-gray-600 mb-4">Bienvenido, <span className="font-bold">{currentUser?.name}</span></p>
            <button
              onClick={() => {
                setCurrentUser(null);
                setView('login');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
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
