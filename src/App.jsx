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
      const cleanLicense = license.trim().toUpperCase();
      
      if (!cleanLicense.startsWith('WELLNESS-')) {
        alert('Licencia inválida. Debe empezar con WELLNESS-');
        return;
      }
      
      if (cleanLicense.length < 20) {
        alert('Licencia inválida. Formato incorrecto.');
        return;
      }
      
      setLoading(true);
      
      const { data } = await supabase
        .from('teams')
        .select('license')
        .eq('license', cleanLicense)
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
              license: license.trim().toUpperCase(),
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
        alert('Error al iniciar sesión');
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

  const CoachDashboard = () => {
    return <div className="p-8 text-center">Dashboard (En construcción - Funciona OK)</div>;
  };

  const PlayersManagement = () => {
    return <div className="p-8 text-center">Gestión Jugadores (En construcción)</div>;
  };

  const HistoryView = () => {
    return <div className="p-8 text-center">Historial (En construcción)</div>;
  };

  const PlayerForm = () => {
    return <div className="p-8 text-center">Formulario Jugador (En construcción)</div>;
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
