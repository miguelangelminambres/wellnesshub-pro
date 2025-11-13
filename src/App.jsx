import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

// CONFIGURACIÓN DE SUPABASE
const supabase = createClient(
  'https://zyducbruxaqpuupioaoe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZHVjYnJ1eGFxcHV1cGlvYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjUyNzEsImV4cCI6MjA3ODY0MTI3MX0.8Dd0ZFogpaPYXft5sdbS5SBaPaNr26qr5Z8-hr1X_9M'
);

const WellnessHubPro = () => {
  const [view, setView] = useState('license');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // License Activation Screen
  const LicenseScreen = () => {
    const [license, setLicense] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [teamData, setTeamData] = useState({
      teamName: '',
      coachName: '',
      email: '',
      password: ''
    });

    const validateLicense = async () => {
      if (!license.startsWith('WELLNESS-')) {
        alert('Licencia inválida. Usa el formato: WELLNESS-XXXX-XXXX-XXXX');
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('teams')
        .select('license')
        .eq('license', license)
        .single();

      setLoading(false);

      if (data) {
        alert('Esta licencia ya está en uso. Por favor contacta a soporte.');
        return;
      }

      setShowRegister(true);
    };

    const createTeam = async () => {
      if (!teamData.teamName || !teamData.coachName || !teamData.email || !teamData.password) {
        alert('Por favor completa todos los campos');
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('teams')
          .insert([
            {
              license: license,
              team_name: teamData.teamName,
              coach_name: teamData.coachName,
              coach_email: teamData.email,
              coach_password: teamData.password
            }
          ])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            alert('Este email ya está registrado');
          } else {
            alert('Error al crear la cuenta: ' + error.message);
          }
          return;
        }

        alert('¡Licencia activada! Tu cuenta ha sido creada.');
        setView('login');
      } catch (err) {
        alert('Error: ' + err.message);
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

          {!showRegister ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introduce tu clave de licencia
              </label>
              <input
                type="text"
                placeholder="WELLNESS-XXXX-XXXX-XXXX"
                value={license}
                onChange={(e) => setLicense(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button
                onClick={validateLicense}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Validando...' : 'Validar Licencia'}
              </button>
              <button
                onClick={() => setView('login')}
                className="w-full mt-3 text-blue-600 hover:text-blue-800 font-medium"
              >
                Ya tengo una cuenta
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Crea tu Cuenta</h2>
              <input
                type="text"
                placeholder="Nombre del Equipo"
                value={teamData.teamName}
                onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
              />
              <input
                type="text"
                placeholder="Tu Nombre Completo"
                value={teamData.coachName}
                onChange={(e) => setTeamData({ ...teamData, coachName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
              />
              <input
                type="email"
                placeholder="Email"
                value={teamData.email}
                onChange={(e) => setTeamData({ ...teamData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={teamData.password}
                onChange={(e) => setTeamData({ ...teamData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              />
              <button
                onClick={createTeam}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Login Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
      setLoading(true);

      try {
        const { data: coach } = await supabase
          .from('teams')
          .select('*')
          .eq('coach_email', email)
          .eq('coach_password', password)
          .single();

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

        alert('Email o contraseña incorrectos');
      } catch (err) {
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
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

  // Coach Dashboard
  const CoachDashboard = () => {
    const [players, setPlayers] = useState([]);
    const [todayRecords, setTodayRecords] = useState([]);

    useEffect(() => {
      loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', currentUser.teamId);

        if (playersError) throw playersError;

        const today = new Date().toISOString().split('T')[0];
        const { data: recordsData, error: recordsError } = await supabase
          .from('wellness_records')
          .select('*')
          .eq('date', today);

        if (recordsError) throw recordsError;

        const playersWithRecords = playersData.map(player => {
          const todayRecord = recordsData.find(r => r.player_id === player.id);
          return { ...player, todayRecord };
        });

        setPlayers(playersData);
        setTodayRecords(playersWithRecords);
      } catch (err) {
        alert('Error al cargar datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const getStatus = (record) => {
      if (!record) return 'pending';
      const values = [record.sleep, record.fatigue, record.mood, record.rpe];
      if (values.some(v => v <= 4)) return 'risk';
      if (values.some(v => v <= 6)) return 'warning';
      return 'good';
    };

    const stats = {
      total: players.length,
      registered: todayRecords.filter(p => p.todayRecord).length,
      risk: todayRecords.filter(p => getStatus(p.todayRecord) === 'risk').length,
      warning: todayRecords.filter(p => getStatus(p.todayRecord) === 'warning').length
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">⚽ {currentUser.team_name}</h1>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setView('login');
                }}
                className="text-red-600 hover:text-red-800"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setView('coach-dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium whitespace-nowrap"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setView('players')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              👥 Jugadores
            </button>
            <button
              onClick={() => setView('history')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              📈 Historial
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">⏳ Cargando...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-gray-600">Total Jugadores</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-3xl font-bold text-green-600">{stats.registered}</div>
                  <div className="text-gray-600">Registros Hoy</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-3xl font-bold text-red-600">{stats.risk}</div>
                  <div className="text-gray-600">⚠️ En Riesgo</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-3xl font-bold text-yellow-600">{stats.warning}</div>
                  <div className="text-gray-600">⚡ Precaución</div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-4">Estado de la Plantilla - Hoy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayRecords.map(player => {
                  const status = getStatus(player.todayRecord);
                  const statusColors = {
                    pending: 'bg-gray-100 border-gray-300',
                    good: 'bg-green-50 border-green-300',
                    warning: 'bg-yellow-50 border-yellow-300',
                    risk: 'bg-red-50 border-red-300'
                  };
                  const statusIcons = {
                    pending: '⏳',
                    good: '✅',
                    warning: '⚡',
                    risk: '⚠️'
                  };

                  return (
                    <div key={player.id} className={`p-4 rounded-xl border-2 ${statusColors[status]}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{player.name}</h3>
                          <span className="text-sm text-gray-600">{player.email}</span>
                        </div>
                        <span className="text-2xl">{statusIcons[status]}</span>
                      </div>
                      {player.todayRecord ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>😴 Sueño:</span>
                            <span className="font-semibold">{player.todayRecord.sleep}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>💪 Fatiga:</span>
                            <span className="font-semibold">{player.todayRecord.fatigue}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>😊 Ánimo:</span>
                            <span className="font-semibold">{player.todayRecord.mood}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🏃 RPE:</span>
                            <span className="font-semibold">{player.todayRecord.rpe}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⚖️ Peso:</span>
                            <span className="font-semibold">{player.todayRecord.weight} kg</span>
                          </div>
                          {player.todayRecord.pain_areas?.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-red-600 font-semibold">🩹 Dolores:</span>
                              <div className="text-xs mt-1">
                                {player.todayRecord.pain_areas.map((p, i) => (
                                  <div key={i}>{p.area} ({p.intensity}/10)</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Sin registro hoy</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Players Management
  const PlayersManagement = () => {
    const [players, setPlayers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
      name: '',
      email: '',
      password: ''
    });

    useEffect(() => {
      loadPlayers();
    }, []);

    const loadPlayers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', currentUser.teamId);

        if (error) throw error;
        setPlayers(data);
      } catch (err) {
        alert('Error al cargar jugadores: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const addPlayer = async () => {
      if (players.length >= 30) {
        alert('Has alcanzado el límite de 30 jugadores');
        return;
      }
      if (!newPlayer.name || !newPlayer.email || !newPlayer.password) {
        alert('Completa todos los campos');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('players')
          .insert([
            {
              team_id: currentUser.teamId,
              name: newPlayer.name,
              email: newPlayer.email,
              password: newPlayer.password
            }
          ])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            alert('Este email ya existe en el equipo');
          } else {
            throw error;
          }
          return;
        }

        alert('Jugador agregado correctamente');
        setNewPlayer({ name: '', email: '', password: '' });
        setShowAddForm(false);
        loadPlayers();
      } catch (err) {
        alert('Error al agregar jugador: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const deletePlayer = async (playerId) => {
      if (!confirm('¿Seguro que quieres eliminar este jugador?')) return;

      setLoading(true);
      try {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId);

        if (error) throw error;

        alert('Jugador eliminado');
        loadPlayers();
      } catch (err) {
        alert('Error al eliminar jugador: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">⚽ {currentUser.team_name}</h1>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setView('login');
                }}
                className="text-red-600 hover:text-red-800"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setView('coach-dashboard')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setView('players')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium whitespace-nowrap"
            >
              👥 Jugadores
            </button>
            <button
              onClick={() => setView('history')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              📈 Historial
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Jugadores ({players.length}/30)
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                disabled={loading}
              >
                + Agregar Jugador
              </button>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold mb-3">Nuevo Jugador</h3>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mb-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mb-2"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newPlayer.password}
                  onChange={(e) => setNewPlayer({ ...newPlayer, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addPlayer}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Creando...' : 'Crear Jugador'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">⏳ Cargando...</div>
            ) : (
              <div className="space-y-3">
                {players.map(player => (
                  <div key={player.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-bold text-gray-800">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setView('history');
                        }}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
                      >
                        Ver Historial
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // History View
  const HistoryView = () => {
    const [players, setPlayers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [records, setRecords] = useState([]);

    useEffect(() => {
      loadPlayers();
    }, []);

    useEffect(() => {
      if (selected) {
        loadPlayerRecords(selected.id);
      }
    }, [selected]);

    const loadPlayers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', currentUser.teamId);

        if (error) throw error;
        setPlayers(data);
        
        if (selectedPlayer) {
          setSelected(selectedPlayer);
        } else if (data.length > 0) {
          setSelected(data[0]);
        }
      } catch (err) {
        alert('Error al cargar jugadores: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadPlayerRecords = async (playerId) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('wellness_records')
          .select('*')
          .eq('player_id', playerId)
          .order('date', { ascending: false });

        if (error) throw error;
        setRecords(data);
      } catch (err) {
        alert('Error al cargar registros: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const chartData = records
      .slice(0, 14)
      .reverse()
      .map(r => ({
        fecha: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        Sueño: r.sleep,
        Fatiga: r.fatigue,
        Ánimo: r.mood,
        RPE: r.rpe
      }));

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">⚽ {currentUser.team_name}</h1>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setView('login');
                }}
                className="text-red-600 hover:text-red-800"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setView('coach-dashboard')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setView('players')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap"
            >
              👥 Jugadores
            </button>
            <button
              onClick={() => setView('history')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium whitespace-nowrap"
            >
              📈 Historial
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Selecciona un Jugador</h2>
            <select
              value={selected?.id || ''}
              onChange={(e) => {
                const player = players.find(p => p.id === e.target.value);
                setSelected(player);
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">⏳ Cargando...</div>
          ) : selected ? (
            <>
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Evolución - {selected.name}
                </h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Sueño" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Fatiga" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="Ánimo" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="RPE" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hay datos suficientes</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Registros Históricos ({records.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2">Sueño</th>
                        <th className="px-4 py-2">Fatiga</th>
                        <th className="px-4 py-2">Ánimo</th>
                        <th className="px-4 py-2">RPE</th>
                        <th className="px-4 py-2">Peso</th>
                        <th className="px-4 py-2">Dolores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{new Date(record.date).toLocaleDateString('es-ES')}</td>
                          <td className="px-4 py-2 text-center">{record.sleep}</td>
                          <td className="px-4 py-2 text-center">{record.fatigue}</td>
                          <td className="px-4 py-2 text-center">{record.mood}</td>
                          <td className="px-4 py-2 text-center">{record.rpe}</td>
                          <td className="px-4 py-2 text-center">{record.weight}</td>
                          <td className="px-4 py-2 text-center">
                            {record.pain_areas?.length > 0 ? `${record.pain_areas.length} zona(s)` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  };

  // Player Wellness Form
  const PlayerForm = () => {
    const [hasRegisteredToday, setHasRegisteredToday] = useState(false);
    const [formData, setFormData] = useState({
      sleep: 5,
      fatigue: 5,
      mood: 5,
      rpe: 5,
      weight: '',
      painAreas: []
    });

    const [showBodyMap, setShowBodyMap] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);
    const [painIntensity, setPainIntensity] = useState(5);

    useEffect(() => {
      checkTodayRecord();
    }, []);

    const checkTodayRecord = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('wellness_records')
          .select('*')
          .eq('player_id', currentUser.playerId)
          .eq('date', today)
          .single();

        if (data) {
          setHasRegisteredToday(true);
        }
      } catch (err) {
        // No record found for today - that's ok
      } finally {
        setLoading(false);
      }
    };

    const bodyAreas = [
      'Cuello', 'Hombro Izq', 'Hombro Der', 'Espalda Alta', 'Espalda Baja',
      'Pecho', 'Abdomen', 'Cadera Izq', 'Cadera Der', 'Ingle Izq', 'Ingle Der',
      'Muslo Izq', 'Muslo Der', 'Rodilla Izq', 'Rodilla Der',
      'Pantorrilla Izq', 'Pantorrilla Der', 'Tobillo Izq', 'Tobillo Der'
    ];

    const addPainArea = () => {
      if (selectedArea) {
        setFormData({
          ...formData,
          painAreas: [...formData.painAreas, { area: selectedArea, intensity: painIntensity }]
        });
        setSelectedArea(null);
        setPainIntensity(5);
        setShowBodyMap(false);
      }
    };

    const removePainArea = (index) => {
      setFormData({
        ...formData,
        painAreas: formData.painAreas.filter((_, i) => i !== index)
      });
    };

    const submitForm = async () => {
      if (!formData.weight) {
        alert('Por favor introduce tu peso corporal');
        return;
      }

      setLoading(true);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('wellness_records')
          .insert([
            {
              player_id: currentUser.playerId,
              date: today,
              sleep: formData.sleep,
              fatigue: formData.fatigue,
              mood: formData.mood,
              rpe: formData.rpe,
              weight: parseFloat(formData.weight),
              pain_areas: formData.painAreas
            }
          ])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            alert('Ya has registrado tus datos hoy');
          } else {
            throw error;
          }
          return;
        }

        alert('¡Registro completado! Gracias.');
        setHasRegisteredToday(true);
      } catch (err) {
        alert('Error al guardar registro: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (hasRegisteredToday) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Registro Completado!</h2>
            <p className="text-gray-600 mb-6">Ya has enviado tu registro de wellness hoy. Nos vemos mañana.</p>
            <button
              onClick={() => {
                setCurrentUser(null);
                setView('login');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
          <div className="text-white text-2xl">⏳ Cargando...</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">⚽ Registro Diario</h1>
                <p className="text-gray-600">{currentUser.name}</p>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setView('login');
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Salir
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  😴 Calidad del Sueño
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({...formData, sleep: n})}
                      className={`flex-1 py-3 rounded-lg font-bold transition ${
                        formData.sleep === n 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy malo</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  💪 Fatiga Muscular
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({...formData, fatigue: n})}
                      className={`flex-1 py-3 rounded-lg font-bold transition ${
                        formData.fatigue === n 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sin fatiga</span>
                  <span>Muy fatigado</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  😊 Estado de Ánimo
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({...formData, mood: n})}
                      className={`flex-1 py-3 rounded-lg font-bold transition ${
                        formData.mood === n 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy bajo</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  🏃 RPE (Percepción del Esfuerzo)
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({...formData, rpe: n})}
                      className={`flex-1 py-3 rounded-lg font-bold transition ${
                        formData.rpe === n 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy fácil</span>
                  <span>Máximo esfuerzo</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  ⚖️ Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-2">
                  🩹 Zonas de Dolor
                </label>
                <button
                  onClick={() => setShowBodyMap(true)}
                  className="w-full bg-purple-100 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-200"
                >
                  + Agregar Zona de Dolor
                </button>
                {formData.painAreas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.painAreas.map((pain, i) => (
                      <div key={i} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                        <span className="font-semibold">{pain.area}: {pain.intensity}/10</span>
                        <button
                          onClick={() => removePainArea(i)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={submitForm}
                disabled={loading}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg disabled:bg-gray-400"
              >
                {loading ? '⏳ Enviando...' : '✅ Enviar Registro'}
              </button>
            </div>
          </div>
        </div>

        {showBodyMap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Selecciona la Zona</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {bodyAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`py-2 rounded-lg font-semibold transition ${
                      selectedArea === area
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {selectedArea && (
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Intensidad del Dolor</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        onClick={() => setPainIntensity(n)}
                        className={`flex-1 py-2 rounded font-bold ${
                          painIntensity === n
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={addPainArea}
                  disabled={!selectedArea}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowBodyMap(false);
                    setSelectedArea(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {view === 'license' && <LicenseScreen />}
      {view === 'login' && <LoginScreen />}
      {view === 'coach-dashboard' && <CoachDashboard />}
      {view === 'players' && <PlayersManagement />}
      {view === 'history' && <HistoryView />}
      {view === 'player-form' && <PlayerForm />}
    </div>
  );
};

export default WellnessHubPro;
