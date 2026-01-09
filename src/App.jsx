import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [view, setView] = useState('license');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {view === 'license' && <LicenseScreen setView={setView} setCurrentUser={setCurrentUser} setLoading={setLoading} />}
      {view === 'login' && <LoginScreen setView={setView} setCurrentUser={setCurrentUser} setLoading={setLoading} />}
      {view === 'coach-dashboard' && <CoachDashboard currentUser={currentUser} setView={setView} setCurrentUser={setCurrentUser} />}
      {view === 'player-panel' && <PlayerPanel currentUser={currentUser} setView={setView} />}
    </div>
  );
}

// ============================================
// PANTALLA DE LICENCIA
// ============================================
const LicenseScreen = ({ setView, setCurrentUser, setLoading }) => {
  const [license, setLicense] = useState('');
  const [step, setStep] = useState('input');
  const [licenseData, setLicenseData] = useState(null);
  const [teamData, setTeamData] = useState({
    teamName: '',
    coachName: '',
    email: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const validateLicense = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const cleanLicense = license.trim().toUpperCase();

      if (!cleanLicense || cleanLicense.length < 10) {
        setErrorMsg('Por favor introduce una licencia válida');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', cleanLicense)
        .single();

      if (error || !data) {
        setErrorMsg('❌ Licencia no válida');
        setLoading(false);
        return;
      }

      if (data.status !== 'active') {
        setErrorMsg('❌ Esta licencia ya ha sido utilizada');
        setLoading(false);
        return;
      }

      setLicenseData(data);
      setStep('register');
      setLoading(false);
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
      setLoading(false);
    }
  };

  const registerTeam = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      if (!teamData.teamName || !teamData.coachName || !teamData.email || !teamData.password) {
        setErrorMsg('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      const { data: existingTeam } = await supabase
        .from('teams')
        .select('email')
        .eq('email', teamData.email);

      if (existingTeam && existingTeam.length > 0) {
        setErrorMsg('❌ Este email ya está registrado');
        setLoading(false);
        return;
      }

      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            name: teamData.teamName,
            coach_name: teamData.coachName,
            email: teamData.email,
            password: teamData.password,
            license: licenseData.license_key
          }
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      await supabase
        .from('licenses')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          user_email: teamData.email,
          team_id: newTeam.id
        })
        .eq('license_key', licenseData.license_key);

      alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión.');
      setView('login');
      setLoading(false);
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">WellnessHub Pro</h1>
          <p className="text-gray-600">Monitoreo de Bienestar Deportivo</p>
        </div>

        {step === 'input' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Licencia
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              onClick={validateLicense}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Validar Licencia
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => setView('login')}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                ¿Ya tienes cuenta? Inicia sesión →
              </button>
            </div>
          </>
        )}

        {step === 'register' && (
          <>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ Licencia válida. Completa tu registro:
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nombre del equipo"
                value={teamData.teamName}
                onChange={(e) => setTeamData({...teamData, teamName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Nombre del entrenador"
                value={teamData.coachName}
                onChange={(e) => setTeamData({...teamData, coachName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={teamData.email}
                onChange={(e) => setTeamData({...teamData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={teamData.password}
                onChange={(e) => setTeamData({...teamData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              onClick={registerTeam}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Completar Registro
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// PANTALLA DE LOGIN
// ============================================
const LoginScreen = ({ setView, setCurrentUser, setLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);

      if (!email || !password) {
        alert('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      const { data: coaches } = await supabase
        .from('teams')
        .select('*')
        .eq('email', email)
        .eq('password', password);

      if (coaches && coaches.length > 0) {
        const coach = coaches[0];
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
        setView('player-panel');
        setLoading(false);
        return;
      }

      alert('❌ Email o contraseña incorrectos');
      setLoading(false);
    } catch (err) {
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">WellnessHub Pro</h1>
          <p className="text-gray-600">Iniciar Sesión</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium mb-4"
        >
          Iniciar Sesión
        </button>

        <div className="text-center">
          <button
            onClick={() => setView('license')}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            ¿No tienes cuenta? Activa tu licencia →
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FUNCIONES DE CÁLCULO ACWR
// ============================================
const calculateACWR = (playerId, wellnessLogs) => {
  const playerLogs = wellnessLogs
    .filter(log => log.player_id === playerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (playerLogs.length < 7) {
    return { acwr: null, acuteLoad: 0, chronicLoad: 0, status: 'insufficient', message: 'Datos insuficientes (mínimo 7 días)' };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Calcular carga de cada registro (RPE × duración)
  const getLoad = (log) => {
    const rpe = log.rpe || 5;
    const duration = log.session_duration || 60;
    return rpe * duration;
  };

  // Carga aguda (últimos 7 días)
  const acuteLogs = playerLogs.filter(log => new Date(log.created_at) >= sevenDaysAgo);
  const acuteLoad = acuteLogs.reduce((sum, log) => sum + getLoad(log), 0);

  // Carga crónica (últimos 28 días, promediado a 7 días)
  const chronicLogs = playerLogs.filter(log => new Date(log.created_at) >= twentyEightDaysAgo);
  const totalChronicLoad = chronicLogs.reduce((sum, log) => sum + getLoad(log), 0);
  const weeksOfData = Math.min(4, Math.ceil(chronicLogs.length / 7) || 1);
  const chronicLoad = totalChronicLoad / weeksOfData;

  // Calcular ACWR
  if (chronicLoad === 0) {
    return { acwr: null, acuteLoad, chronicLoad: 0, status: 'no-chronic', message: 'Sin datos crónicos suficientes' };
  }

  const acwr = acuteLoad / chronicLoad;
  const acwrRounded = Math.round(acwr * 100) / 100;

  // Determinar zona de riesgo
  let status, message, color;
  if (acwrRounded < 0.8) {
    status = 'low';
    message = 'Infraentrenado - Pérdida de forma';
    color = 'blue';
  } else if (acwrRounded <= 1.3) {
    status = 'optimal';
    message = 'Zona óptima - Bajo riesgo';
    color = 'green';
  } else if (acwrRounded <= 1.5) {
    status = 'warning';
    message = 'Precaución - Riesgo moderado';
    color = 'yellow';
  } else {
    status = 'danger';
    message = 'Alto riesgo de lesión';
    color = 'red';
  }

  return {
    acwr: acwrRounded,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    status,
    message,
    color,
    logsCount: {
      acute: acuteLogs.length,
      chronic: chronicLogs.length
    }
  };
};

const getACWRColor = (status) => {
  switch (status) {
    case 'low': return 'bg-blue-100 border-blue-400 text-blue-800';
    case 'optimal': return 'bg-green-100 border-green-400 text-green-800';
    case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    case 'danger': return 'bg-red-100 border-red-400 text-red-800';
    default: return 'bg-gray-100 border-gray-400 text-gray-800';
  }
};

const getACWRBadgeColor = (status) => {
  switch (status) {
    case 'low': return 'bg-blue-500';
    case 'optimal': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'danger': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

// ============================================
// DASHBOARD DEL ENTRENADOR
// ============================================
const CoachDashboard = ({ currentUser, setView, setCurrentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [players, setPlayers] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [acwrData, setAcwrData] = useState([]);
  const [showACWRHelp, setShowACWRHelp] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    password: '',
    number: '',
    position: ''
  });

  useEffect(() => {
    if (currentUser?.id) {
      loadPlayers();
      loadWellnessLogs();
      
      // Mostrar modal de novedades si no lo ha visto
      const hasSeenNews = localStorage.getItem('wellnesshub_news_v2_seen');
      if (!hasSeenNews) {
        setShowNewsModal(true);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (wellnessLogs.length > 0 && players.length > 0) {
      generateAlerts();
      calculateAllACWR();
    }
  }, [wellnessLogs, players]);

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', currentUser.id)
      .order('created_at', { ascending: false });
    setPlayers(data || []);
  };

  const loadWellnessLogs = async () => {
    const { data } = await supabase
      .from('wellness_logs')
      .select('*, players(*)')
      .eq('team_id', currentUser.id)
      .order('created_at', { ascending: false });
    setWellnessLogs(data || []);
  };

  // Calcular ACWR para todos los jugadores
  const calculateAllACWR = () => {
    const acwrResults = players.map(player => {
      const result = calculateACWR(player.id, wellnessLogs);
      return {
        player,
        ...result
      };
    });

    // Ordenar: primero los de mayor riesgo
    acwrResults.sort((a, b) => {
      const priority = { danger: 0, warning: 1, low: 2, optimal: 3, insufficient: 4, 'no-chronic': 5 };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });

    setAcwrData(acwrResults);
  };

  // 🚨 SISTEMA DE ALERTAS INTELIGENTES (mejorado con ACWR)
  const generateAlerts = () => {
    const newAlerts = [];

    players.forEach(player => {
      const playerLogs = wellnessLogs.filter(log => log.player_id === player.id);
      
      if (playerLogs.length === 0) return;

      const recentLogs = playerLogs.slice(0, 3);
      const latestLog = playerLogs[0];

      // ALERTA ACWR
      const acwrResult = calculateACWR(player.id, wellnessLogs);
      if (acwrResult.status === 'danger') {
        newAlerts.push({
          type: 'critical',
          icon: '🔴',
          player: player.name,
          number: player.number,
          message: `ACWR ${acwrResult.acwr} - Alto riesgo de lesión`,
          detail: `Carga aguda: ${acwrResult.acuteLoad} UA | Carga crónica: ${acwrResult.chronicLoad} UA`
        });
      } else if (acwrResult.status === 'warning') {
        newAlerts.push({
          type: 'warning',
          icon: '⚠️',
          player: player.name,
          number: player.number,
          message: `ACWR ${acwrResult.acwr} - Zona de precaución`,
          detail: 'Considerar reducir la carga de entrenamiento'
        });
      } else if (acwrResult.status === 'low') {
        newAlerts.push({
          type: 'info',
          icon: '🔵',
          player: player.name,
          number: player.number,
          message: `ACWR ${acwrResult.acwr} - Infraentrenado`,
          detail: 'Aumentar progresivamente la carga'
        });
      }

      // ALERTA: Dolor muscular alto persistente
      const highPainCount = recentLogs.filter(log => log.muscle_soreness >= 7).length;
      if (highPainCount >= 2) {
        newAlerts.push({
          type: 'critical',
          icon: '💪',
          player: player.name,
          number: player.number,
          message: `Dolor muscular alto (${latestLog.muscle_soreness}/10) - ${highPainCount} registros recientes`,
          detail: latestLog.muscle_group || 'Zona no especificada'
        });
      }

      // ALERTA: Estrés muy alto
      if (latestLog.stress_level >= 8) {
        newAlerts.push({
          type: 'warning',
          icon: '😰',
          player: player.name,
          number: player.number,
          message: `Nivel de estrés muy alto (${latestLog.stress_level}/10)`,
          detail: 'Considera hablar con el jugador'
        });
      }

      // ALERTA: Sueño malo
      if (latestLog.sleep_quality <= 3) {
        newAlerts.push({
          type: 'warning',
          icon: '😴',
          player: player.name,
          number: player.number,
          message: `Calidad de sueño muy baja (${latestLog.sleep_quality}/10)`,
          detail: 'Puede afectar el rendimiento'
        });
      }

      // ALERTA: Energía muy baja
      if (latestLog.energy_level <= 3) {
        newAlerts.push({
          type: 'info',
          icon: '🔋',
          player: player.name,
          number: player.number,
          message: `Nivel de energía bajo (${latestLog.energy_level}/10)`,
          detail: 'Monitorear en los próximos entrenamientos'
        });
      }
    });

    // Ordenar por criticidad
    newAlerts.sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });

    setAlerts(newAlerts);
  };

  const addPlayer = async () => {
    try {
      if (!newPlayer.name || !newPlayer.email || !newPlayer.password) {
        alert('Por favor completa los campos obligatorios (nombre, email, contraseña)');
        return;
      }

      const { data: existingPlayer } = await supabase
        .from('players')
        .select('email')
        .eq('email', newPlayer.email);

      if (existingPlayer && existingPlayer.length > 0) {
        alert('❌ Este email ya está registrado');
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .insert([
          {
            team_id: currentUser.id,
            name: newPlayer.name,
            email: newPlayer.email,
            password: newPlayer.password,
            number: newPlayer.number ? parseInt(newPlayer.number) : null,
            position: newPlayer.position || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPlayers([data, ...players]);
      setNewPlayer({ name: '', email: '', password: '', number: '', position: '' });
      setShowAddPlayer(false);
      alert('✅ Jugador añadido correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const deletePlayer = async (playerId, playerName) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar a ${playerName}?\n\n` +
      `⚠️ ADVERTENCIA: Se eliminarán también todos sus registros de bienestar.`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      setPlayers(players.filter(p => p.id !== playerId));
      setWellnessLogs(wellnessLogs.filter(log => log.player_id !== playerId));

      alert(`✅ ${playerName} ha sido eliminado correctamente`);
    } catch (err) {
      alert('❌ Error al eliminar jugador: ' + err.message);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setView('login');
  };

  const closeNewsModal = () => {
    localStorage.setItem('wellnesshub_news_v2_seen', 'true');
    setShowNewsModal(false);
  };

  const getValueColor = (value) => {
    if (value >= 8) return 'text-green-600 font-bold';
    if (value >= 5) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = selectedPlayer === 'all'
    ? wellnessLogs
    : wellnessLogs.filter(log => log.player_id === selectedPlayer);

  const getAlertColor = (type) => {
    switch(type) {
      case 'critical': return 'bg-red-50 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-300 text-blue-800';
      default: return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getSessionTypeLabel = (type) => {
    const types = {
      training: '🏃 Entrenamiento',
      match: '⚽ Partido',
      recovery: '🧘 Recuperación',
      rest: '😴 Descanso',
      gym: '💪 Gimnasio'
    };
    return types[type] || type;
  };

  // ============================================
  // FUNCIÓN EXPORTAR A EXCEL
  // ============================================
  const exportToExcel = (dataType) => {
    let csvContent = '';
    let fileName = '';
    
    if (dataType === 'wellness') {
      // Exportar datos de bienestar
      const logsToExport = selectedPlayer === 'all' ? wellnessLogs : filteredLogs;
      
      if (logsToExport.length === 0) {
        alert('No hay datos para exportar');
        return;
      }
      
      // Cabeceras
      csvContent = 'Fecha,Hora,Jugador,Dorsal,Posición,Tipo Sesión,Duración (min),RPE,Carga (UA),Sueño,Dolor,Estrés,Energía,Ánimo,Zona Dolor,Notas\n';
      
      // Datos
      logsToExport.forEach(log => {
        const fecha = new Date(log.created_at).toLocaleDateString('es-ES');
        const hora = new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const jugador = log.players?.name || 'Desconocido';
        const dorsal = log.players?.number || '-';
        const posicion = log.players?.position || '-';
        const tipoSesion = log.session_type || 'training';
        const duracion = log.session_duration || 60;
        const rpe = log.rpe || 5;
        const carga = rpe * duracion;
        const notas = (log.notes || '').replace(/"/g, '""').replace(/,/g, ';');
        const zonaDolor = (log.muscle_group || '').replace(/,/g, ';');
        
        csvContent += `${fecha},${hora},"${jugador}",${dorsal},"${posicion}",${tipoSesion},${duracion},${rpe},${carga},${log.sleep_quality},${log.muscle_soreness},${log.stress_level},${log.energy_level},${log.mood},"${zonaDolor}","${notas}"\n`;
      });
      
      fileName = `bienestar_${currentUser.name}_${new Date().toISOString().split('T')[0]}.csv`;
      
    } else if (dataType === 'acwr') {
      // Exportar datos de ACWR
      if (acwrData.length === 0) {
        alert('No hay datos de ACWR para exportar');
        return;
      }
      
      // Cabeceras
      csvContent = 'Jugador,Dorsal,Posición,ACWR,Estado,Carga Aguda (7d),Carga Crónica (28d),Registros Agudos,Registros Crónicos\n';
      
      // Datos
      acwrData.forEach(data => {
        const estado = data.status === 'danger' ? 'ALTO RIESGO' :
                       data.status === 'warning' ? 'PRECAUCIÓN' :
                       data.status === 'optimal' ? 'ÓPTIMO' :
                       data.status === 'low' ? 'INFRAENTRENADO' : 'SIN DATOS';
        
        csvContent += `"${data.player.name}",${data.player.number || '-'},"${data.player.position || '-'}",${data.acwr || 'N/A'},${estado},${data.acuteLoad},${data.chronicLoad},${data.logsCount?.acute || 0},${data.logsCount?.chronic || 0}\n`;
      });
      
      fileName = `acwr_${currentUser.name}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // Crear y descargar archivo
    const BOM = '\uFEFF'; // Para que Excel reconozca los acentos
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Contar alertas críticas de ACWR
  const criticalACWRCount = acwrData.filter(d => d.status === 'danger').length;
  const warningACWRCount = acwrData.filter(d => d.status === 'warning').length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* MODAL DE NOVEDADES */}
        {showNewsModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={closeNewsModal}
          >
            {/* Botón X flotante - SIEMPRE VISIBLE */}
            <button
              onClick={closeNewsModal}
              className="fixed top-4 right-4 z-[60] w-12 h-12 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white text-2xl font-bold shadow-lg transition-colors"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              ✕
            </button>

            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[85vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
                <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                <h2 className="text-xl sm:text-2xl font-bold pr-8">¡Novedades en WellnessHub Pro!</h2>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">Nueva funcionalidad disponible</p>
              </div>

              <div className="p-4 sm:p-6">
                {/* Novedad ACWR */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="text-2xl sm:text-3xl">📈</div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-800">Control de Carga (ACWR)</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">
                        Nueva pestaña <strong>"ACWR"</strong> que calcula automáticamente el riesgo de lesión 
                        de cada jugador basándose en su carga de entrenamiento. ¡Previene lesiones antes de que ocurran!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aviso importante */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="text-xl sm:text-2xl">⚠️</div>
                    <div>
                      <h4 className="font-bold text-yellow-800 text-sm sm:text-base">Importante: Avisa a tus jugadores</h4>
                      <p className="text-yellow-700 text-xs sm:text-sm mt-1">
                        Para que el ACWR funcione correctamente, los jugadores deben introducir la 
                        <strong> duración real de cada sesión</strong> (en minutos). 
                      </p>
                      <p className="text-yellow-700 text-xs sm:text-sm mt-2">
                        👉 <strong>Comunícales la duración</strong> de cada entrenamiento o partido para que la registren correctamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cómo funciona */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">¿Cómo funciona?</h4>
                  <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>✅ El jugador registra: <strong>tipo de sesión + duración + esfuerzo percibido</strong></li>
                    <li>✅ El sistema calcula automáticamente la carga y el ACWR</li>
                    <li>✅ Tú ves qué jugadores están en riesgo de lesión</li>
                  </ul>
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-2 sm:gap-3">
                  <button
                    onClick={() => { closeNewsModal(); setActiveTab('acwr'); }}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    📈 Ver panel ACWR
                  </button>
                  <button
                    onClick={closeNewsModal}
                    className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                  >
                    ✓ Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-4xl">⚽</div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{currentUser.name}</h1>
                  <p className="text-gray-600">Entrenador: {currentUser.coach_name} • {players.length} jugadores</p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full md:w-auto"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6 overflow-x-auto">
          <div className="flex border-b min-w-max md:min-w-0">
            {[
              { id: 'overview', icon: '📊', label: 'Resumen', count: alerts.length > 0 ? alerts.length : undefined },
              { id: 'acwr', icon: '📈', label: 'ACWR', count: criticalACWRCount > 0 ? criticalACWRCount : undefined, critical: criticalACWRCount > 0 },
              { id: 'players', icon: '👥', label: 'Jugadores', count: players.length },
              { id: 'wellness', icon: '💚', label: 'Bienestar', count: wellnessLogs.length },
              { id: 'settings', icon: '⚙️', label: 'Configuración' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label} 
                {tab.count !== undefined && (
                  <span className={`ml-1 ${tab.critical ? 'text-red-600 font-bold' : ''}`}>
                    ({tab.count})
                  </span>
                )}
                {tab.critical && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          {/* RESUMEN CON ALERTAS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">📊 Resumen General</h3>
              
              {/* SISTEMA DE ALERTAS */}
              {alerts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      🚨 Alertas del Equipo
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                        {alerts.length}
                      </span>
                    </h4>
                    <button
                      onClick={() => setAlerts([])}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Limpiar alertas
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className={`border-2 rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                        <div className="flex items-start space-x-3">
                          <div className="text-3xl">{alert.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-blue-600">#{alert.number || '-'}</span>
                              <span className="font-semibold">{alert.player}</span>
                            </div>
                            <div className="font-medium mb-1">{alert.message}</div>
                            <div className="text-sm opacity-75">{alert.detail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {alerts.length > 5 && (
                      <button
                        onClick={() => setActiveTab('acwr')}
                        className="w-full text-center py-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver todas las alertas ({alerts.length}) →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {alerts.length === 0 && wellnessLogs.length > 0 && (
                <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-green-800 font-semibold">¡Todo en orden!</div>
                  <div className="text-green-600 text-sm mt-1">No hay alertas críticas en este momento</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-3xl font-bold text-blue-600">{players.length}</div>
                  <div className="text-gray-600">Jugadores</div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-3xl font-bold text-green-600">{wellnessLogs.length}</div>
                  <div className="text-gray-600">Registros</div>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {wellnessLogs.filter(log => {
                      const today = new Date();
                      const logDate = new Date(log.created_at);
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                  <div className="text-gray-600">Hoy</div>
                </div>

                <div className={`p-6 rounded-lg border ${criticalACWRCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="text-3xl mb-2">📈</div>
                  <div className={`text-3xl font-bold ${criticalACWRCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {criticalACWRCount}
                  </div>
                  <div className="text-gray-600">En riesgo (ACWR)</div>
                </div>
              </div>

              {wellnessLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg">No hay registros todavía</p>
                  <p className="text-sm mt-2">Los jugadores deben iniciar sesión y completar su formulario de bienestar</p>
                </div>
              ) : (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Últimos Registros</h4>
                  <div className="space-y-3">
                    {wellnessLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-blue-600">#{log.players?.number || '-'}</span>
                            <div>
                              <div className="font-medium">{log.players?.name}</div>
                              <div className="text-sm text-gray-500">
                                {getSessionTypeLabel(log.session_type)} • {log.session_duration || 60} min • RPE: {log.rpe || 5}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL ACWR */}
          {activeTab === 'acwr' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">📈 Control de Carga (ACWR)</h3>
                  <button
                    onClick={() => setShowACWRHelp(true)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    ❓ ¿Qué es ACWR?
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToExcel('acwr')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📥 Exportar Excel
                  </button>
                  <button
                    onClick={() => { loadWellnessLogs(); }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🔄 Actualizar
                  </button>
                </div>
              </div>

              {/* MODAL DE AYUDA ACWR */}
              {showACWRHelp && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowACWRHelp(false)}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">📈 Guía ACWR</h2>
                        <button
                          onClick={() => setShowACWRHelp(false)}
                          className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 text-xl font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Qué es */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2">¿Qué es el ACWR?</h3>
                        <p className="text-gray-600">
                          El <strong>Acute:Chronic Workload Ratio</strong> (Ratio de Carga Aguda:Crónica) es una métrica 
                          utilizada en el deporte profesional para <strong>predecir el riesgo de lesiones</strong> basándose 
                          en la relación entre la carga de entrenamiento reciente y la carga histórica del jugador.
                        </p>
                      </div>

                      {/* Fórmula */}
                      <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2">📐 Fórmula</h3>
                        <div className="text-center py-4">
                          <div className="text-2xl font-mono font-bold text-gray-800">
                            ACWR = Carga Aguda (7 días) ÷ Carga Crónica (28 días)
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-semibold text-gray-700">Carga Aguda</div>
                            <div className="text-gray-600">Suma de la carga de los últimos 7 días</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-semibold text-gray-700">Carga Crónica</div>
                            <div className="text-gray-600">Promedio semanal de los últimos 28 días</div>
                          </div>
                        </div>
                      </div>

                      {/* Cálculo de carga */}
                      <div className="mb-6 bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2">⚡ Cálculo de Carga (UA)</h3>
                        <div className="text-center py-2">
                          <div className="text-xl font-mono font-bold text-blue-800">
                            Carga (UA) = RPE × Duración (min)
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>UA</strong> = Unidades Arbitrarias. Ejemplo: Entrenamiento de 90 min con RPE 7 = 630 UA
                        </p>
                      </div>

                      {/* Zonas de riesgo */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-600 mb-3">🚦 Zonas de Riesgo</h3>
                        <div className="space-y-3">
                          <div className="flex items-center p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                            <div className="w-16 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                              &lt; 0.8
                            </div>
                            <div>
                              <div className="font-semibold text-blue-800">Infraentrenado</div>
                              <div className="text-sm text-blue-600">El jugador está perdiendo forma física. Necesita más carga.</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-green-100 rounded-lg border-2 border-green-300">
                            <div className="w-16 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                              0.8-1.3
                            </div>
                            <div>
                              <div className="font-semibold text-green-800">Zona Óptima ✓</div>
                              <div className="text-sm text-green-600">"Sweet spot" - Menor riesgo de lesión. Carga bien gestionada.</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                            <div className="w-16 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                              1.3-1.5
                            </div>
                            <div>
                              <div className="font-semibold text-yellow-800">Precaución ⚠️</div>
                              <div className="text-sm text-yellow-700">Riesgo moderado. Vigilar al jugador y considerar reducir intensidad.</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-red-100 rounded-lg border-2 border-red-300">
                            <div className="w-16 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                              &gt; 1.5
                            </div>
                            <div>
                              <div className="font-semibold text-red-800">Alto Riesgo 🔴</div>
                              <div className="text-sm text-red-600">Pico de carga peligroso. Alto riesgo de lesión. Reducir carga inmediatamente.</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recomendaciones */}
                      <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-600 mb-2">💡 Recomendaciones</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• No aumentar la carga semanal más de un <strong>10-15%</strong> respecto a la semana anterior</li>
                          <li>• Después de periodos de descanso, reintroducir carga <strong>progresivamente</strong></li>
                          <li>• Combinar ACWR con datos de <strong>wellness</strong> (sueño, fatiga, estrés) para decisiones más precisas</li>
                          <li>• Necesitas mínimo <strong>7 días de datos</strong> para un ACWR fiable</li>
                        </ul>
                      </div>

                      {/* Botón cerrar */}
                      <button
                        onClick={() => setShowACWRHelp(false)}
                        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Leyenda */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Zonas de Riesgo ACWR</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span>&lt; 0.8 Infraentrenado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>0.8 - 1.3 Óptimo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span>1.3 - 1.5 Precaución</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>&gt; 1.5 Alto riesgo</span>
                  </div>
                </div>
              </div>

              {/* Resumen rápido */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                  <div className="text-3xl font-bold text-red-600">{acwrData.filter(d => d.status === 'danger').length}</div>
                  <div className="text-sm text-gray-600">Alto riesgo</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{acwrData.filter(d => d.status === 'warning').length}</div>
                  <div className="text-sm text-gray-600">Precaución</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-3xl font-bold text-green-600">{acwrData.filter(d => d.status === 'optimal').length}</div>
                  <div className="text-sm text-gray-600">Óptimo</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-600">{acwrData.filter(d => d.status === 'low').length}</div>
                  <div className="text-sm text-gray-600">Infraentrenado</div>
                </div>
              </div>

              {/* Lista de jugadores con ACWR */}
              {acwrData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-lg">No hay datos de ACWR todavía</p>
                  <p className="text-sm mt-2">Los jugadores necesitan al menos 7 días de registros</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acwrData.map((data, index) => (
                    <div key={index} className={`border-2 rounded-lg p-4 ${getACWRColor(data.status)}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getACWRBadgeColor(data.status)}`}>
                            {data.acwr !== null ? data.acwr : '?'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xl font-bold text-blue-600">#{data.player.number || '-'}</span>
                              <span className="text-lg font-semibold">{data.player.name}</span>
                            </div>
                            <div className="text-sm opacity-75">{data.player.position || 'Sin posición'}</div>
                            <div className="text-sm font-medium mt-1">{data.message}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-white bg-opacity-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Carga Aguda (7d)</div>
                            <div className="text-xl font-bold">{data.acuteLoad} UA</div>
                            {data.logsCount && (
                              <div className="text-xs text-gray-500">{data.logsCount.acute} registros</div>
                            )}
                          </div>
                          <div className="bg-white bg-opacity-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Carga Crónica (28d)</div>
                            <div className="text-xl font-bold">{data.chronicLoad} UA</div>
                            {data.logsCount && (
                              <div className="text-xs text-gray-500">{data.logsCount.chronic} registros</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* JUGADORES */}
          {activeTab === 'players' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h3 className="text-xl font-semibold">👥 Gestión de Jugadores</h3>
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {showAddPlayer ? '❌ Cancelar' : '➕ Añadir Jugador'}
                </button>
              </div>

              {showAddPlayer && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-4">Nuevo Jugador</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña *"
                      value={newPlayer.password}
                      onChange={(e) => setNewPlayer({...newPlayer, password: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Número (dorsal)"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Posición"
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 col-span-1 md:col-span-2"
                    />
                  </div>
                  <button
                    onClick={addPlayer}
                    className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    ✅ Guardar Jugador
                  </button>
                </div>
              )}

              {players.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                  No hay jugadores registrados. Añade el primero.
                </div>
              ) : (
                <>
                  {/* VISTA DESKTOP - Tabla */}
                  <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACWR</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {players.map((player) => {
                          const playerACWR = acwrData.find(d => d.player.id === player.id);
                          return (
                            <tr key={player.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-lg font-bold text-blue-600">#{player.number || '-'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium">{player.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{player.position || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {playerACWR && playerACWR.acwr !== null ? (
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getACWRBadgeColor(playerACWR.status)}`}>
                                    {playerACWR.acwr}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Sin datos</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => deletePlayer(player.id, player.name)}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
                                >
                                  🗑️ Eliminar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* VISTA MÓVIL - Tarjetas */}
                  <div className="md:hidden space-y-4">
                    {players.map((player) => {
                      const playerACWR = acwrData.find(d => d.player.id === player.id);
                      return (
                        <div key={player.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold text-blue-600">#{player.number || '-'}</span>
                              <div>
                                <div className="font-semibold text-lg">{player.name}</div>
                                <div className="text-sm text-gray-500">{player.position || 'Sin posición'}</div>
                              </div>
                            </div>
                            {playerACWR && playerACWR.acwr !== null && (
                              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getACWRBadgeColor(playerACWR.status)}`}>
                                {playerACWR.acwr}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => deletePlayer(player.id, player.name)}
                            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                          >
                            🗑️ Eliminar Jugador
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BIENESTAR */}
          {activeTab === 'wellness' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h3 className="text-xl font-semibold">💚 Registros de Bienestar ({filteredLogs.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToExcel('wellness')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📥 Exportar Excel
                  </button>
                  <button
                    onClick={loadWellnessLogs}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🔄 Actualizar
                  </button>
                </div>
              </div>

              {players.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Filtrar por jugador:</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los jugadores</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        #{player.number || '-'} {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filteredLogs.length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-lg text-center text-gray-500">
                  <div className="text-6xl mb-4">💚</div>
                  <p className="text-lg">No hay registros de bienestar</p>
                  <p className="text-sm mt-2">Los jugadores deben iniciar sesión y completar su formulario</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-blue-600">#{log.players?.number || '-'}</span>
                          <div>
                            <div className="font-semibold text-lg">{log.players?.name}</div>
                            <div className="text-sm text-gray-500">{log.players?.position}</div>
                          </div>
                        </div>
                      </div>

                      {/* Info de sesión */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {getSessionTypeLabel(log.session_type)}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          ⏱️ {log.session_duration || 60} min
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          RPE: {log.rpe || 5}/10
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                          Carga: {(log.rpe || 5) * (log.session_duration || 60)} UA
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <div>{formatDate(log.created_at)}</div>
                        <div className="font-mono">{formatTime(log.created_at)}</div>
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                          <span className="text-sm font-medium">💪 Dolor en: {log.muscle_group}</span>
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
            </div>
          )}

          {/* CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">⚙️ Configuración</h3>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo</label>
                  <div className="text-lg">{currentUser.name}</div>
                </div>
                
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrenador</label>
                  <div className="text-lg">{currentUser.coach_name}</div>
                </div>
                
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-lg">{currentUser.email}</div>
                </div>
                
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Licencia</label>
                  <div className="text-lg font-mono">{currentUser.license}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PANEL DEL JUGADOR (con campos ACWR)
// ============================================
const PlayerPanel = ({ currentUser, setView }) => {
  const [formData, setFormData] = useState({
    sleep_quality: 5,
    muscle_soreness: 5,
    stress_level: 5,
    energy_level: 5,
    mood: 5,
    muscle_group: '',
    notes: '',
    // Nuevos campos para ACWR
    session_type: 'training',
    session_duration: 90,
    rpe: 5
  });
  const [history, setHistory] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTime, setSuccessTime] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('wellness_logs')
      .select('*')
      .eq('player_id', currentUser.playerId)
      .order('created_at', { ascending: false })
      .limit(30);
    setHistory(data || []);
  };

  const submitWellness = async () => {
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const { data, error } = await supabase
        .from('wellness_logs')
        .insert([
          {
            player_id: currentUser.playerId,
            team_id: currentUser.teamId,
            ...formData,
            created_at: now.toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setHistory([data, ...history]);
      setSuccessTime(timeString);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);

      // Resetear solo algunos campos
      setFormData({
        ...formData,
        muscle_group: '',
        notes: ''
      });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const logout = () => {
    setView('login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getValueColor = (value) => {
    if (value >= 8) return 'text-green-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">⚽</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  #{currentUser.number || '-'} {currentUser.name}
                </h1>
                <p className="text-gray-600">{currentUser.position || 'Jugador'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full md:w-auto"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="mb-6 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-pulse">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold">¡Registro enviado exitosamente a las {successTime}!</div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">📝 Registro Diario de Bienestar</h2>
          
          <div className="space-y-6">
            {/* SECCIÓN: DATOS DE SESIÓN (Nuevo) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-4">🏃 Datos de la Sesión</h3>
              
              {/* Tipo de sesión */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tipo de sesión:</label>
                <select
                  value={formData.session_type}
                  onChange={(e) => setFormData({...formData, session_type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="training">🏃 Entrenamiento</option>
                  <option value="match">⚽ Partido</option>
                  <option value="recovery">🧘 Recuperación activa</option>
                  <option value="gym">💪 Gimnasio</option>
                  <option value="rest">😴 Descanso total</option>
                </select>
              </div>

              {/* Duración */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  ⏱️ Duración: <span className="text-xl font-bold text-blue-600">{formData.session_duration} min</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={formData.session_duration}
                  onChange={(e) => setFormData({...formData, session_duration: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 min</span>
                  <span>90 min</span>
                  <span>180 min</span>
                </div>
              </div>

              {/* RPE */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  💪 Esfuerzo Percibido: <span className={`text-2xl font-bold ${getValueColor(11 - formData.rpe)}`}>{formData.rpe}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.rpe}
                  onChange={(e) => setFormData({...formData, rpe: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 - Muy fácil</span>
                  <span>5 - Moderado</span>
                  <span>10 - Máximo</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN: BIENESTAR */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-4">💚 Estado de Bienestar</h3>

              {/* Sueño */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  😴 Calidad del Sueño: <span className={`text-2xl font-bold ${getValueColor(formData.sleep_quality)}`}>{formData.sleep_quality}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleep_quality}
                  onChange={(e) => setFormData({...formData, sleep_quality: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy mal</span>
                  <span>Excelente</span>
                </div>
              </div>

              {/* Dolor Muscular */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  💪 Dolor Muscular: <span className={`text-2xl font-bold ${getValueColor(11 - formData.muscle_soreness)}`}>{formData.muscle_soreness}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.muscle_soreness}
                  onChange={(e) => setFormData({...formData, muscle_soreness: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sin dolor</span>
                  <span>Dolor severo</span>
                </div>
              </div>

              {/* Selector de Grupo Muscular */}
              {formData.muscle_soreness > 3 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium mb-2">¿Dónde sientes el dolor?</label>
                  <select
                    value={formData.muscle_group}
                    onChange={(e) => setFormData({...formData, muscle_group: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una zona</option>
                    <option value="🦵 Piernas">🦵 Piernas</option>
                    <option value="💪 Brazos">💪 Brazos</option>
                    <option value="🔙 Espalda">🔙 Espalda</option>
                    <option value="🤸 Hombros">🤸 Hombros</option>
                    <option value="🗣️ Cuello">🗣️ Cuello</option>
                    <option value="⚡ Core/Abdomen">⚡ Core/Abdomen</option>
                    <option value="🌐 General">🌐 General</option>
                  </select>
                </div>
              )}

              {/* Estrés */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  😰 Nivel de Estrés: <span className={`text-2xl font-bold ${getValueColor(11 - formData.stress_level)}`}>{formData.stress_level}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.stress_level}
                  onChange={(e) => setFormData({...formData, stress_level: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy relajado</span>
                  <span>Muy estresado</span>
                </div>
              </div>

              {/* Energía */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  ⚡ Nivel de Energía: <span className={`text-2xl font-bold ${getValueColor(formData.energy_level)}`}>{formData.energy_level}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy_level}
                  onChange={(e) => setFormData({...formData, energy_level: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sin energía</span>
                  <span>Mucha energía</span>
                </div>
              </div>

              {/* Ánimo */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  😊 Estado de Ánimo: <span className={`text-2xl font-bold ${getValueColor(formData.mood)}`}>{formData.mood}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.mood}
                  onChange={(e) => setFormData({...formData, mood: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy mal</span>
                  <span>Excelente</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium mb-2">📝 Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="¿Algo más que quieras comentar?"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <button
              onClick={submitWellness}
              className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
            >
              ✅ Enviar Registro
            </button>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">📈 Mi Historial</h2>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl mb-3">📊</div>
              <p>No tienes registros todavía</p>
              <p className="text-sm mt-2">Completa tu primer formulario arriba</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 10).map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {log.session_type === 'training' ? '🏃 Entreno' : 
                       log.session_type === 'match' ? '⚽ Partido' :
                       log.session_type === 'recovery' ? '🧘 Recup.' :
                       log.session_type === 'gym' ? '💪 Gym' : '😴 Descanso'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      ⏱️ {log.session_duration || 60} min
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <div className="font-medium">{formatDate(log.created_at)}</div>
                    <div className="font-mono">{formatTime(log.created_at)}</div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500">😴</div>
                      <div className={`text-lg font-bold ${getValueColor(log.sleep_quality)}`}>
                        {log.sleep_quality}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">💪</div>
                      <div className={`text-lg font-bold ${getValueColor(11 - log.muscle_soreness)}`}>
                        {log.muscle_soreness}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">😰</div>
                      <div className={`text-lg font-bold ${getValueColor(11 - log.stress_level)}`}>
                        {log.stress_level}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">⚡</div>
                      <div className={`text-lg font-bold ${getValueColor(log.energy_level)}`}>
                        {log.energy_level}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">😊</div>
                      <div className={`text-lg font-bold ${getValueColor(log.mood)}`}>
                        {log.mood}
                      </div>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                      "{log.notes}"
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

export default App;
