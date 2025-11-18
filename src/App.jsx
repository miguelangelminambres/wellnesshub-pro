import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseValidated, setLicenseValidated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [teamId, setTeamId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');
  const [players, setPlayers] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Form states para jugador
  const [sleepQuality, setSleepQuality] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [mood, setMood] = useState(5);
  const [muscleGroup, setMuscleGroup] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    const savedLicense = localStorage.getItem('wellnessHubLicense');
    if (savedLicense) {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('license', savedLicense)
        .single();

      if (data) {
        setLicenseKey(savedLicense);
        setLicenseValidated(true);
      }
    }
    setLoading(false);
  };

  const validateLicense = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('license', licenseKey)
      .single();

    if (error || !data) {
      setLoading(false);
      setLicenseValidated(false);
      setTimeout(() => alert('Licencia inválida o no encontrada'), 100);
      return;
    }

    localStorage.setItem('wellnessHubLicense', licenseKey);
    setLicenseValidated(true);
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!licenseKey) {
      setLoading(false);
      setTimeout(() => alert('Error: No se encontró la licencia'), 100);
      return;
    }

    // Intentar login como COACH primero
    const { data: coachData, error: coachError } = await supabase
      .from('teams')
      .select('*')
      .eq('coach_email', userEmail)
      .eq('coach_password', userPassword)
      .eq('license', licenseKey)
      .single();

    if (coachData) {
      // Login exitoso como COACH
      setUserRole('coach');
      setTeamId(coachData.id);
      setTeamName(coachData.team_name);
      setCoachName(coachData.coach_name);
      setLoading(false);
      loadCoachData(coachData.id);
      return;
    }

    // Si no es coach, intentar como JUGADOR
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*, teams!inner(license)')
      .eq('email', userEmail)
      .eq('password', userPassword)
      .single();

    if (playerData && playerData.teams.license === licenseKey) {
      // Login exitoso como JUGADOR
      setUserRole('player');
      setTeamId(playerData.team_id);
      setPlayerName(playerData.name);
      setLoading(false);

      // Cargar datos del equipo
      const { data: teamData } = await supabase
        .from('teams')
        .select('team_name')
        .eq('id', playerData.team_id)
        .single();
      
      if (teamData) {
        setTeamName(teamData.team_name);
      }
      return;
    }

    // Si llegamos aquí, el login falló
    setLoading(false);
    setTimeout(() => alert('Email o contraseña incorrectos'), 100);
  };

  const loadCoachData = async (teamId) => {
    // Cargar jugadores
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');

    if (playersData) {
      setPlayers(playersData);
    }

    // Cargar logs de bienestar
    const { data: logsData } = await supabase
      .from('wellness_logs')
      .select(`
        *,
        players (name)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (logsData) {
      setWellnessLogs(logsData);
    }
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const { error } = await supabase
      .from('players')
      .insert([{
        team_id: teamId,
        name: newPlayerName,
        email: `${newPlayerName.toLowerCase().replace(/\s/g, '')}@temp.com`,
        password: 'temp123',
        position: 'Sin asignar',
        number: null
      }]);

    if (!error) {
      setNewPlayerName('');
      loadCoachData(teamId);
    }
  };

  const submitWellnessLog = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Buscar el ID del jugador actual
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('name', playerName)
      .single();

    if (!playerData) {
      setLoading(false);
      setTimeout(() => alert('Error: No se encontró el jugador'), 100);
      return;
    }

    const { error } = await supabase
      .from('wellness_logs')
      .insert([{
        team_id: teamId,
        player_id: playerData.id,
        sleep_quality: sleepQuality,
        muscle_soreness: muscleSoreness,
        stress_level: stressLevel,
        energy_level: energyLevel,
        mood: mood,
        muscle_group: muscleSoreness > 3 ? muscleGroup : null,
        notes: notes
      }]);

    setLoading(false);

    if (!error) {
      setTimeout(() => alert('Registro guardado exitosamente'), 100);
      // Reset form
      setSleepQuality(5);
      setMuscleSoreness(5);
      setStressLevel(5);
      setEnergyLevel(5);
      setMood(5);
      setMuscleGroup('');
      setNotes('');
    } else {
      setTimeout(() => alert('Error al guardar el registro'), 100);
    }
  };

  const logout = () => {
    setUserRole(null);
    setTeamId(null);
    setUserEmail('');
    setUserPassword('');
    setPlayers([]);
    setWellnessLogs([]);
  };

  const getValueColor = (value) => {
    if (value >= 8) return 'text-green-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  // Pantalla de validación de licencia
  if (!licenseValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">WellnessHub Pro</h1>
          <p className="text-gray-600 mb-6">Sistema de Bienestar para Equipos</p>
          
          <form onSubmit={validateLicense}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave de Licencia
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Ingrese su clave de licencia"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Validar Licencia
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Pantalla de login
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">WellnessHub Pro</h1>
          <p className="text-gray-600 mb-6">Iniciar Sesión</p>
          
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard del Entrenador
  if (userRole === 'coach') {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">WellnessHub Pro</h1>
              <p className="text-sm text-gray-600">{teamName} - {coachName}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('resumen')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'resumen'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📊 Resumen
              </button>
              <button
                onClick={() => setActiveTab('jugadores')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'jugadores'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Jugadores
              </button>
              <button
                onClick={() => setActiveTab('bienestar')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'bienestar'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                💪 Bienestar
              </button>
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'configuracion'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ⚙️ Configuración
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Resumen Tab */}
              {activeTab === 'resumen' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Resumen del Equipo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{players.length}</div>
                      <div className="text-sm text-gray-600">Jugadores Totales</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{wellnessLogs.length}</div>
                      <div className="text-sm text-gray-600">Registros de Bienestar</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {wellnessLogs.filter(log => 
                          new Date(log.created_at).toDateString() === new Date().toDateString()
                        ).length}
                      </div>
                      <div className="text-sm text-gray-600">Registros Hoy</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">Últimos Registros</h3>
                  {wellnessLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="bg-white border rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{log.players?.name || 'Jugador'}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500">😴</div>
                          <div className={`font-bold ${getValueColor(log.sleep_quality)}`}>
                            {log.sleep_quality}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">💪</div>
                          <div className={`font-bold ${getValueColor(11 - log.muscle_soreness)}`}>
                            {log.muscle_soreness}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">😰</div>
                          <div className={`font-bold ${getValueColor(11 - log.stress_level)}`}>
                            {log.stress_level}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">⚡</div>
                          <div className={`font-bold ${getValueColor(log.energy_level)}`}>
                            {log.energy_level}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">😊</div>
                          <div className={`font-bold ${getValueColor(log.mood)}`}>
                            {log.mood}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jugadores Tab */}
              {activeTab === 'jugadores' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Gestión de Jugadores</h2>
                  
                  <form onSubmit={addPlayer} className="mb-6 flex gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Nombre del nuevo jugador"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Añadir
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => (
                      <div key={player.id} className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-lg">{player.name}</h3>
                        <p className="text-sm text-gray-600">{player.position}</p>
                        {player.number && (
                          <p className="text-sm text-gray-500">#{player.number}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bienestar Tab */}
              {activeTab === 'bienestar' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Registros de Bienestar</h2>
                  {wellnessLogs.map((log) => (
                    <div key={log.id} className="bg-white border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium text-lg">{log.players?.name || 'Jugador'}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">😴 Sueño</div>
                          <div className={`text-2xl font-bold ${getValueColor(log.sleep_quality)}`}>
                            {log.sleep_quality}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">💪 Dolor</div>
                          <div className={`text-2xl font-bold ${getValueColor(11 - log.muscle_soreness)}`}>
                            {log.muscle_soreness}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">😰 Estrés</div>
                          <div className={`text-2xl font-bold ${getValueColor(11 - log.stress_level)}`}>
                            {log.stress_level}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">⚡ Energía</div>
                          <div className={`text-2xl font-bold ${getValueColor(log.energy_level)}`}>
                            {log.energy_level}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">😊 Ánimo</div>
                          <div className={`text-2xl font-bold ${getValueColor(log.mood)}`}>
                            {log.mood}
                          </div>
                        </div>
                      </div>

                      {log.muscle_group && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2 text-sm">
                          💪 Grupo Muscular: {log.muscle_group}
                        </div>
                      )}

                      {log.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                          <span className="font-medium">Notas:</span> "{log.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Configuración Tab */}
              {activeTab === 'configuracion' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Configuración</h2>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium">Equipo: {teamName}</p>
                    <p className="text-sm text-gray-600 mt-2">Entrenador: {coachName}</p>
                    <p className="text-sm text-gray-600 mt-1">Licencia: {licenseKey}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard del Jugador
  if (userRole === 'player') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">WellnessHub Pro</h1>
              <p className="text-sm text-gray-600">{teamName} - {playerName}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Registro de Bienestar</h2>
            
            <form onSubmit={submitWellnessLog}>
              {/* Calidad del Sueño */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  😴 Calidad del Sueño: {sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Dolor Muscular */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💪 Dolor Muscular: {muscleSoreness}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={muscleSoreness}
                  onChange={(e) => setMuscleSoreness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Grupo Muscular (solo si dolor > 3) */}
              {muscleSoreness > 3 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupo Muscular Afectado
                  </label>
                  <select
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Piernas">🦵 Piernas</option>
                    <option value="Brazos">💪 Brazos</option>
                    <option value="Espalda">🔙 Espalda</option>
                    <option value="Core">⭕ Core</option>
                    <option value="Cuello">👔 Cuello</option>
                    <option value="Hombros">🤷 Hombros</option>
                  </select>
                </div>
              )}

              {/* Nivel de Estrés */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  😰 Nivel de Estrés: {stressLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Nivel de Energía */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚡ Nivel de Energía: {energyLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Estado de Ánimo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  😊 Estado de Ánimo: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Notas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cualquier comentario adicional..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
