import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zyducbruxaqpuupioaoe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZHVjYnJ1eGFxcHV1cGlvYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjUyNzEsImV4cCI6MjA3ODY0MTI3MX0.8Dd0ZFogpaPYXft5sdbS5SBaPaNr26qr5Z8-hr1X_9M'
);

function App() {
  const [view, setView] = useState('license');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const LicenseScreen = () => {
    const [license, setLicense] = useState('');
    const [step, setStep] = useState('input');
    const [licenseData, setLicenseData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [teamData, setTeamData] = useState({
      teamName: '',
      coachName: '',
      email: '',
      password: ''
    });

    const validateLicense = async () => {
      const cleanLicense = license.trim().toUpperCase();
      
      if (!cleanLicense || cleanLicense.length < 10) {
        setErrorMsg('Por favor introduce una licencia válida');
        return;
      }
      
      if (!cleanLicense.includes('WELLNESS')) {
        setErrorMsg('Licencia inválida. Debe contener WELLNESS');
        return;
      }
      
      setStep('loading');
      setErrorMsg('');
      
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key', cleanLicense)
          .maybeSingle();

        if (!data) {
          setStep('input');
          setErrorMsg('❌ Licencia no válida. Esta licencia no existe en el sistema.');
          return;
        }

        if (data.status === 'used') {
          setStep('input');
          setErrorMsg('❌ Esta licencia ya ha sido activada anteriormente.');
          return;
        }

        setLicenseData(data);
        setStep('register');
        
      } catch (err) {
        console.error('Error:', err);
        setStep('input');
        setErrorMsg('Error al validar la licencia: ' + err.message);
      }
    };

    const createTeam = async () => {
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
          setStep('register');
          if (teamError.code === '23505') {
            setErrorMsg('Este email ya está registrado');
          } else {
            setErrorMsg('Error: ' + teamError.message);
          }
          return;
        }

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
          console.error('Error al actualizar licencia:', updateError);
        }

        setStep('success');
        setTimeout(() => {
          setView('login');
        }, 1500);
        
      } catch (err) {
        console.error('Error:', err);
        setStep('register');
        setErrorMsg('Error al crear la cuenta: ' + err.message);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ WellnessHub Pro</h1>
            <p className="text-gray-600">Sistema Profesional de Control de Bienestar</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
          )}

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
                onClick={validateLicense}
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

          {step === 'loading' && (
            <div className="text-center py-8">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Procesando...</p>
            </div>
          )}

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
    const [activeTab, setActiveTab] = useState('overview');
    const [players, setPlayers] = useState([]);
    const [wellnessLogs, setWellnessLogs] = useState([]);
    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [newPlayer, setNewPlayer] = useState({
      name: '',
      email: '',
      password: '',
      position: '',
      number: ''
    });
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [loadingWellness, setLoadingWellness] = useState(false);

    useEffect(() => {
      if (currentUser?.id) {
        loadPlayers();
        loadWellnessLogs();
      }
    }, [currentUser]);

    const loadPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error('Error al cargar jugadores:', err);
        alert('Error al cargar los jugadores');
      } finally {
        setLoadingPlayers(false);
      }
    };

    const loadWellnessLogs = async () => {
      setLoadingWellness(true);
      try {
        const { data, error } = await supabase
          .from('wellness_logs')
          .select(`
            *,
            players (
              name,
              number,
              position
            )
          `)
          .eq('team_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setWellnessLogs(data || []);
      } catch (err) {
        console.error('Error al cargar registros de bienestar:', err);
      } finally {
        setLoadingWellness(false);
      }
    };

    const addPlayer = async () => {
      if (!newPlayer.name || !newPlayer.email || !newPlayer.password) {
        alert('Por favor completa los campos obligatorios: Nombre, Email y Contraseña');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('players')
          .insert([
            {
              team_id: currentUser.id,
              name: newPlayer.name,
              email: newPlayer.email,
              password: newPlayer.password,
              position: newPlayer.position || null,
              number: newPlayer.number || null
            }
          ])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            alert('Este email ya está registrado');
          } else {
            throw error;
          }
          return;
        }

        alert('✅ Jugador agregado exitosamente');
        setPlayers([data, ...players]);
        setNewPlayer({ name: '', email: '', password: '', position: '', number: '' });
        setShowAddPlayer(false);
      } catch (err) {
        console.error('Error al agregar jugador:', err);
        alert('Error al agregar el jugador: ' + err.message);
      }
    };

    const deletePlayer = async (playerId, playerName) => {
      if (!confirm(`¿Seguro que quieres eliminar a ${playerName}?`)) return;

      try {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId);

        if (error) throw error;

        setPlayers(players.filter(p => p.id !== playerId));
        alert('✅ Jugador eliminado');
      } catch (err) {
        console.error('Error al eliminar jugador:', err);
        alert('Error al eliminar el jugador');
      }
    };

    const getColorForValue = (value) => {
      if (value <= 3) return 'text-red-600 bg-red-100';
      if (value <= 7) return 'text-yellow-600 bg-yellow-100';
      return 'text-green-600 bg-green-100';
    };

    const getMuscleGroupLabel = (group) => {
      const labels = {
        'legs': 'Piernas',
        'arms': 'Brazos',
        'back': 'Espalda',
        'shoulders': 'Hombros',
        'neck': 'Cuello',
        'core': 'Core/Abdomen',
        'general': 'General'
      };
      return labels[group] || group;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ⚽ {currentUser?.team_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Entrenador: {currentUser?.coach_name} • {players.length} jugadores
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Cerrar sesión?')) {
                    setCurrentUser(null);
                    setView('login');
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Resumen
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'players'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Jugadores ({players.length})
              </button>
              <button
                onClick={() => setActiveTab('wellness')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'wellness'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💚 Bienestar ({wellnessLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Configuración
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Jugadores
                        </dt>
                        <dd className="text-3xl font-bold text-gray-900">
                          {players.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <span className="text-2xl">💚</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Registros de Bienestar
                        </dt>
                        <dd className="text-3xl font-bold text-gray-900">
                          {wellnessLogs.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <span className="text-2xl">🔑</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Licencia Activa
                        </dt>
                        <dd className="text-xs font-mono text-gray-900 mt-1">
                          {currentUser?.license}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  ¡Bienvenido, {currentUser?.coach_name}! 👋
                </h2>
                <p className="text-gray-600 mb-4">
                  Gestiona tu equipo, agrega jugadores y monitorea su bienestar desde este panel.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('players')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Ver Jugadores
                  </button>
                  <button
                    onClick={() => setActiveTab('wellness')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Ver Bienestar
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('players');
                      setTimeout(() => setShowAddPlayer(true), 100);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    + Agregar Jugador
                  </button>
                </div>
              </div>

              {players.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Últimos Jugadores Registrados
                  </h3>
                  <div className="space-y-3">
                    {players.slice(0, 5).map(player => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {player.number || '?'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{player.name}</p>
                            <p className="text-sm text-gray-500">{player.position || 'Sin posición'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(player.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestión de Jugadores
                </h2>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">+</span> Agregar Jugador
                </button>
              </div>

              {showAddPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4">Agregar Nuevo Jugador</h3>
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg mb-3"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg mb-3"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña *"
                      value={newPlayer.password}
                      onChange={(e) => setNewPlayer({ ...newPlayer, password: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg mb-3"
                    />
                    <input
                      type="text"
                      placeholder="Posición (ej: Delantero)"
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg mb-3"
                    />
                    <input
                      type="number"
                      placeholder="Número de camiseta"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg mb-4"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={addPlayer}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setShowAddPlayer(false);
                          setNewPlayer({ name: '', email: '', password: '', position: '', number: '' });
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingPlayers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Cargando jugadores...</p>
                </div>
              ) : players.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-6xl mb-4">🏃</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay jugadores todavía
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza agregando tu primer jugador al equipo
                  </p>
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    + Agregar Primer Jugador
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jugador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Alta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {players.map((player) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {player.number || '?'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{player.position || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{player.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(player.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deletePlayer(player.id, player.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wellness' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Registros de Bienestar del Equipo
                </h2>
                <div className="flex gap-2">
                  <select
                    value={selectedPlayer || ''}
                    onChange={(e) => setSelectedPlayer(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Todos los jugadores</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={loadWellnessLogs}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    🔄 Actualizar
                  </button>
                </div>
              </div>

              {loadingWellness ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Cargando registros...</p>
                </div>
              ) : wellnessLogs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay registros todavía
                  </h3>
                  <p className="text-gray-600">
                    Los jugadores aún no han completado ningún registro de bienestar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wellnessLogs
                    .filter(log => !selectedPlayer || log.player_id === selectedPlayer)
                    .map((log) => (
                    <div key={log.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {log.players?.number || '?'}
                          </div>
                          <div className="ml-3">
                            <p className="font-bold text-gray-900">{log.players?.name}</p>
                            <p className="text-sm text-gray-500">{log.players?.position || 'Sin posición'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(log.created_at).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Sueño</div>
                          <div className={`text-xl font-bold px-3 py-2 rounded ${getColorForValue(log.sleep_quality)}`}>
                            {log.sleep_quality}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Dolor</div>
                          <div className={`text-xl font-bold px-3 py-2 rounded ${getColorForValue(11 - log.muscle_soreness)}`}>
                            {log.muscle_soreness}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Estrés</div>
                          <div className={`text-xl font-bold px-3 py-2 rounded ${getColorForValue(11 - log.stress_level)}`}>
                            {log.stress_level}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Energía</div>
                          <div className={`text-xl font-bold px-3 py-2 rounded ${getColorForValue(log.energy_level)}`}>
                            {log.energy_level}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Ánimo</div>
                          <div className={`text-xl font-bold px-3 py-2 rounded ${getColorForValue(log.mood)}`}>
                            {log.mood}
                          </div>
                        </div>
                      </div>

                      {log.muscle_group && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            💪 Dolor en: {getMuscleGroupLabel(log.muscle_group)}
                          </span>
                        </div>
                      )}

                      {log.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600 italic">"{log.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Configuración de la Cuenta
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Equipo
                  </label>
                  <input
                    type="text"
                    value={currentUser?.team_name}
                    disabled
                    className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrenador
                  </label>
                  <input
                    type="text"
                    value={currentUser?.coach_name}
                    disabled
                    className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentUser?.coach_email}
                    disabled
                    className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Licencia
                  </label>
                  <input
                    type="text"
                    value={currentUser?.license}
                    disabled
                    className="w-full px-4 py-3 border rounded-lg bg-gray-50 font-mono text-sm"
                  />
                </div>

                <div className="pt-6 border-t">
                  <button
                    onClick={() => {
                      if (confirm('¿Cerrar sesión?')) {
                        setCurrentUser(null);
                        setView('login');
                      }
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PlayerForm = () => {
    const [wellnessData, setWellnessData] = useState({
      sleep_quality: 5,
      muscle_soreness: 5,
      stress_level: 5,
      energy_level: 5,
      mood: 5,
      muscle_group: '',
      notes: ''
    });
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);

    useEffect(() => {
      if (currentUser?.playerId) {
        loadHistory();
      }
    }, [currentUser]);

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('wellness_logs')
          .select('*')
          .eq('player_id', currentUser.playerId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    const submitWellness = async () => {
      setSubmitting(true);
      setJustSubmitted(false);
      
      try {
        const now = new Date();
        
        const { data, error } = await supabase
          .from('wellness_logs')
          .insert([
            {
              player_id: currentUser.playerId,
              team_id: currentUser.teamId,
              sleep_quality: wellnessData.sleep_quality,
              muscle_soreness: wellnessData.muscle_soreness,
              stress_level: wellnessData.stress_level,
              energy_level: wellnessData.energy_level,
              mood: wellnessData.mood,
              muscle_group: wellnessData.muscle_group || null,
              notes: wellnessData.notes || null,
              created_at: now.toISOString()
            }
          ])
          .select()
          .single();

        if (error) throw error;

        setJustSubmitted(true);
        setHistory([data, ...history]);
        
        setWellnessData({
          sleep_quality: 5,
          muscle_soreness: 5,
          stress_level: 5,
          energy_level: 5,
          mood: 5,
          muscle_group: '',
          notes: ''
        });

        setTimeout(() => setJustSubmitted(false), 3000);
      } catch (err) {
        console.error('Error al enviar datos:', err);
        alert('Error al enviar los datos: ' + err.message);
      } finally {
        setSubmitting(false);
      }
    };

    const getColorForValue = (value) => {
      if (value <= 3) return 'text-red-600 bg-red-100';
      if (value <= 7) return 'text-yellow-600 bg-yellow-100';
      return 'text-green-600 bg-green-100';
    };

    const getMuscleGroupLabel = (group) => {
      const labels = {
        'legs': 'Piernas',
        'arms': 'Brazos',
        'back': 'Espalda',
        'shoulders': 'Hombros',
        'neck': 'Cuello',
        'core': 'Core/Abdomen',
        'general': 'General'
      };
      return labels[group] || group;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏃 Panel del Jugador
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentUser?.name}
                  {currentUser?.number && ` • #${currentUser.number}`}
                  {currentUser?.position && ` • ${currentUser.position}`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Cerrar sesión?')) {
                    setCurrentUser(null);
                    setView('login');
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {justSubmitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
              <p className="text-green-800 font-semibold text-center">
                ✅ ¡Registro enviado exitosamente a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}!
              </p>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📊 Registro Diario de Bienestar
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    😴 Calidad del Sueño
                  </label>
                  <span className={`text-2xl font-bold px-3 py-1 rounded ${getColorForValue(wellnessData.sleep_quality)}`}>
                    {wellnessData.sleep_quality}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.sleep_quality}
                  onChange={(e) => setWellnessData({ ...wellnessData, sleep_quality: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy malo</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    💪 Dolor Muscular
                  </label>
                  <span className={`text-2xl font-bold px-3 py-1 rounded ${getColorForValue(11 - wellnessData.muscle_soreness)}`}>
                    {wellnessData.muscle_soreness}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.muscle_soreness}
                  onChange={(e) => setWellnessData({ ...wellnessData, muscle_soreness: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sin dolor</span>
                  <span>Dolor severo</span>
                </div>
                
                {wellnessData.muscle_soreness > 3 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Dónde sientes el dolor?
                    </label>
                    <select
                      value={wellnessData.muscle_group}
                      onChange={(e) => setWellnessData({ ...wellnessData, muscle_group: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecciona una zona</option>
                      <option value="legs">🦵 Piernas</option>
                      <option value="arms">💪 Brazos</option>
                      <option value="back">🔙 Espalda</option>
                      <option value="shoulders">🤸 Hombros</option>
                      <option value="neck">🗣️ Cuello</option>
                      <option value="core">⚡ Core/Abdomen</option>
                      <option value="general">🌐 General</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    😰 Nivel de Estrés
                  </label>
                  <span className={`text-2xl font-bold px-3 py-1 rounded ${getColorForValue(11 - wellnessData.stress_level)}`}>
                    {wellnessData.stress_level}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.stress_level}
                  onChange={(e) => setWellnessData({ ...wellnessData, stress_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Relajado</span>
                  <span>Muy estresado</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    ⚡ Nivel de Energía
                  </label>
                  <span className={`text-2xl font-bold px-3 py-1 rounded ${getColorForValue(wellnessData.energy_level)}`}>
                    {wellnessData.energy_level}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.energy_level}
                  onChange={(e) => setWellnessData({ ...wellnessData, energy_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sin energía</span>
                  <span>Máxima energía</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    😊 Estado de Ánimo
                  </label>
                  <span className={`text-2xl font-bold px-3 py-1 rounded ${getColorForValue(wellnessData.mood)}`}>
                    {wellnessData.mood}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.mood}
                  onChange={(e) => setWellnessData({ ...wellnessData, mood: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mal humor</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notas Adicionales (Opcional)
                </label>
                <textarea
                  placeholder="¿Algo que quieras comentar?"
                  value={wellnessData.notes}
                  onChange={(e) => setWellnessData({ ...wellnessData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={submitWellness}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Enviando...' : '✓ Enviar Datos de Bienestar'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📈 Mi Historial
            </h2>
            
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4 text-sm">Cargando historial...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aún no has registrado datos de bienestar.</p>
                <p className="text-sm mt-2">¡Completa el formulario arriba para empezar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(log.created_at).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 text-center mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Sueño</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getColorForValue(log.sleep_quality)}`}>
                          {log.sleep_quality}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Dolor</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getColorForValue(11 - log.muscle_soreness)}`}>
                          {log.muscle_soreness}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Estrés</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getColorForValue(11 - log.stress_level)}`}>
                          {log.stress_level}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Energía</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getColorForValue(log.energy_level)}`}>
                          {log.energy_level}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Ánimo</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getColorForValue(log.mood)}`}>
                          {log.mood}
                        </div>
                      </div>
                    </div>

                    {log.muscle_group && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          💪 {getMuscleGroupLabel(log.muscle_group)}
                        </span>
                      </div>
                    )}
                    
                    {log.notes && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 italic">"{log.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
