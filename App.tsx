
import React, { useState, useEffect, useRef } from 'react';
import { ActivityTask, FamilyContact, ActivityType } from './types';
import { verifyActivityPhoto } from './geminiService';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Camera, 
  Settings as SettingsIcon, 
  AlertTriangle,
  Droplets,
  Utensils,
  Pill,
  User,
  History as HistoryIcon,
  Phone,
  MessageCircle,
  Share2,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

// Default values
const INITIAL_TASKS: ActivityTask[] = [
  { id: '1', type: 'PILLS', label: 'Medicamento Mañana', time: '08:00', completed: false },
  { id: '2', type: 'WATER', label: 'Beber Agua', time: '10:30', completed: false },
  { id: '3', type: 'FOOD', label: 'Almuerzo Saludable', time: '13:00', completed: false },
  { id: '4', type: 'PILLS', label: 'Medicamento Tarde', time: '16:00', completed: false },
  { id: '5', type: 'WATER', label: 'Beber Agua', time: '19:00', completed: false },
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'plan' | 'history' | 'settings'>('plan');

  // User & Contact State
  const [userName, setUserName] = useState('Antonio');
  const [contact, setContact] = useState<FamilyContact>({ name: 'Juan (Hijo)', phone: '+34600000000' });

  // Tasks State
  const [tasks, setTasks] = useState<ActivityTask[]>(INITIAL_TASKS);
  
  // App Logic State
  const [activeAlarm, setActiveAlarm] = useState<ActivityTask | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'|'info'|'whatsapp'} | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check for alarms every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime !== lastCheckTime) {
        setLastCheckTime(currentTime);
        const taskToTrigger = tasks.find(t => t.time === currentTime && !t.completed);
        if (taskToTrigger && !activeAlarm) {
          triggerAlarm(taskToTrigger);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tasks, lastCheckTime, activeAlarm]);

  const triggerAlarm = (task: ActivityTask) => {
    setActiveAlarm(task);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser. Requires interaction."));
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeAlarm) return;

    setIsVerifying(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await verifyActivityPhoto(base64, activeAlarm.type);
        
        if (result.verified) {
          completeTask(activeAlarm.id, reader.result as string);
          stopAlarm();
          
          setIsVerifying(false);
          setIsNotifying(true);
          await notifyFamily(activeAlarm, result.reason);
          setIsNotifying(false);

          setNotification({ 
            msg: `¡Verificado y WhatsApp enviado a ${contact.name}!`, 
            type: 'whatsapp' 
          });
          setActiveAlarm(null);
        } else {
          setIsVerifying(false);
          setNotification({ msg: `No se pudo verificar: ${result.reason}`, type: 'error' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setNotification({ msg: "Error al procesar la imagen", type: 'error' });
      setIsVerifying(false);
      setIsNotifying(false);
    }
  };

  const completeTask = (id: string, photo: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: true, photoUrl: photo, verifiedAt: nowStr } : t
    ));
  };

  const notifyFamily = async (task: ActivityTask, aiReason: string) => {
    return new Promise((resolve) => {
      const message = `✅ ElderCare AI Guard: ${userName} ha completado su actividad "${task.label}" a las ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Confirmación visual validada por IA: "${aiReason}".`;
      console.log(`%c[WHATSAPP AUTOMÁTICO] Para: ${contact.phone}`, "color: #25D366; font-weight: bold;");
      console.log(`Mensaje: ${message}`);
      setTimeout(() => resolve(true), 1500);
    });
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'PILLS': return <Pill className="text-orange-500" />;
      case 'WATER': return <Droplets className="text-blue-500" />;
      case 'FOOD': return <Utensils className="text-green-500" />;
      default: return <Clock className="text-slate-500" />;
    }
  };

  // State update handlers for Settings
  const updateTaskField = (id: string, field: keyof ActivityTask, value: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTasks(prev => [...prev, { 
      id: newId, 
      type: 'WATER', 
      label: 'Nueva Alarma', 
      time: '12:00', 
      completed: false 
    }]);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-inner">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{userName}</h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {activeTab === 'plan' ? 'Monitoreo Activo' : activeTab === 'history' ? 'Historial' : 'Configuración'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      {/* View Switcher */}
      <main className="p-4 max-w-2xl mx-auto">
        
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {/* Status Card */}
            <section className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="opacity-70 text-xs font-bold uppercase tracking-[0.2em]">Resumen de hoy</p>
                  <h2 className="text-4xl font-black italic">Mi Bienestar</h2>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-xl border border-white/10">
                  <CheckCircle size={32} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-5 bg-black/10 rounded-full overflow-hidden border border-white/5 p-1">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000" 
                    style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100 || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                   <p className="text-sm font-bold">
                    {tasks.filter(t => t.completed).length} de {tasks.length} tareas listas
                   </p>
                </div>
              </div>
            </section>

            <button 
              onClick={() => triggerAlarm(tasks.find(t => !t.completed) || tasks[0])}
              className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
            >
              <AlertTriangle size={20} className="text-amber-500" /> Simular Alarma de Prueba
            </button>

            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 px-1 flex items-center gap-3">
                <Bell size={22} className="text-indigo-600" /> Itinerario de Hoy
              </h3>
              <div className="grid gap-3">
                {tasks.filter(t => !t.completed).length === 0 && (
                  <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold italic">
                    ¡Todas las tareas completadas!
                  </div>
                )}
                {tasks.filter(t => !t.completed).map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-3xl p-5 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5"
                  >
                    <div className="p-4 rounded-[1.2rem] bg-indigo-50/50">
                      {getActivityIcon(task.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg leading-none mb-1 text-slate-800">{task.label}</h4>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                        <Clock size={14} />
                        <span>{task.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 px-1 italic">Tareas Completadas</h3>
            <div className="space-y-4">
              {tasks.filter(t => t.completed).length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400">
                  <HistoryIcon size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No hay registros hoy todavía.</p>
                </div>
              ) : (
                tasks.filter(t => t.completed).reverse().map(task => (
                  <div key={task.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                      <CheckCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg leading-tight">{task.label}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                        Confirmado a las {task.verifiedAt}
                      </p>
                    </div>
                    {task.photoUrl && (
                      <img src={task.photoUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-white" alt="Verificación" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-3xl font-black text-slate-900 italic">Mi Cuenta</h3>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Guardado Automático
              </div>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-indigo-600" size={20} />
                <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Perfil</h4>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Nombre del Adulto Mayor</label>
                <input 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Escribe tu nombre..."
                />
              </div>
            </div>

            {/* Family Contact Section */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="text-green-500" size={20} />
                <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Contacto Familiar (WhatsApp)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Nombre Familiar</label>
                  <input 
                    value={contact.name} 
                    onChange={(e) => setContact({...contact, name: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-green-500 transition-all outline-none"
                    placeholder="Nombre del hijo/a..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Teléfono / WhatsApp</label>
                  <input 
                    value={contact.phone} 
                    onChange={(e) => setContact({...contact, phone: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-green-500 transition-all outline-none"
                    placeholder="+34..."
                  />
                </div>
              </div>
            </div>

            {/* Alarms Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <Bell className="text-orange-500" size={20} />
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Mis Alarmas</h4>
                </div>
                <button 
                  onClick={addTask}
                  className="bg-indigo-600 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <select 
                        value={task.type}
                        onChange={(e) => updateTaskField(task.id, 'type', e.target.value)}
                        className="bg-slate-50 border-none rounded-xl p-2 font-bold text-xs text-slate-600 outline-none"
                      >
                        <option value="PILLS">💊 Pastilla</option>
                        <option value="WATER">💧 Agua</option>
                        <option value="FOOD">🍴 Comida</option>
                        <option value="EXERCISE">🏃 Ejercicio</option>
                      </select>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="ml-auto text-red-300 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        value={task.label} 
                        onChange={(e) => updateTaskField(task.id, 'label', e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 outline-none"
                        placeholder="Nombre de la actividad"
                      />
                      <input 
                        type="time"
                        value={task.time} 
                        onChange={(e) => updateTaskField(task.id, 'time', e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl p-4 font-black text-slate-800 outline-none text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 pb-8 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center transition-all ${activeTab === 'plan' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Bell size={26} strokeWidth={activeTab === 'plan' ? 3 : 2} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">Hoy</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <HistoryIcon size={26} strokeWidth={activeTab === 'history' ? 3 : 2} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">Pasado</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center transition-all ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <User size={26} strokeWidth={activeTab === 'settings' ? 3 : 2} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">Cuenta</span>
        </button>
      </nav>

      {/* ALARM OVERLAY */}
      {activeAlarm && (
        <div className="fixed inset-0 z-50 bg-red-600 flex flex-col animate-pulse-red overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-10 animate-bounce shadow-2xl backdrop-blur-md border border-white/30">
              <Bell size={64} fill="white" className="animate-pulse" />
            </div>
            
            <h2 className="text-6xl font-black mb-4 uppercase tracking-tighter italic drop-shadow-lg">¡IMPORTANTE!</h2>
            <p className="text-2xl font-bold opacity-90 mb-6">Es momento de tu salud:</p>
            
            <div className="bg-white text-red-600 px-10 py-6 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-12 transform rotate-[-2deg]">
               <h3 className="text-4xl font-black uppercase tracking-tight">{activeAlarm.label}</h3>
               <div className="flex items-center justify-center gap-3 mt-3 font-black text-2xl text-red-500/80">
                 {getActivityIcon(activeAlarm.type)}
                 <span>{activeAlarm.time}</span>
               </div>
            </div>

            <p className="text-xl font-bold mb-12 max-w-xs leading-tight opacity-90">
              Saca una foto realizando la acción para apagar la alarma y avisar a <span className="underline decoration-white/50">{contact.name}</span>.
            </p>

            <div className="w-full max-w-sm space-y-5">
              <label className="block w-full">
                <div className={`bg-white text-slate-900 py-8 rounded-[2.5rem] text-3xl font-black flex items-center justify-center gap-5 shadow-2xl active:scale-[0.97] transition-all cursor-pointer ${isVerifying || isNotifying ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isVerifying || isNotifying ? (
                    <div className="flex items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-red-600" />
                      <span className="text-xl uppercase">Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <Camera size={48} className="text-red-600" />
                      SACAR FOTO
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                  disabled={isVerifying || isNotifying}
                />
              </label>

              <button 
                className="w-full text-white/40 font-black py-4 text-xs uppercase tracking-[0.3em] hover:text-white transition-colors"
                onClick={() => {
                  if (confirm("Se enviará una alerta de CANCELACIÓN a tu familia. ¿Continuar?")) {
                    stopAlarm();
                    setActiveAlarm(null);
                    notifyFamily(activeAlarm, "⚠️ El usuario canceló la alarma manualmente.");
                  }
                }}
              >
                Omitir por emergencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification / Notification Loading Overlay */}
      {(isVerifying || isNotifying) && (
        <div className="fixed inset-0 z-[60] bg-indigo-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center">
          <div className="relative w-32 h-32 mb-10">
             <div className="absolute inset-0 border-[6px] border-white/10 rounded-[2rem] transform rotate-45"></div>
             <div className={`absolute inset-0 border-[6px] ${isNotifying ? 'border-green-500' : 'border-indigo-500'} border-t-transparent rounded-[2rem] animate-spin transform rotate-45 transition-colors duration-500`}></div>
             <div className="absolute inset-0 flex items-center justify-center">
                {isNotifying ? <Share2 size={40} className="text-green-500" /> : <Camera size={40} className="text-indigo-500" />}
             </div>
          </div>
          
          <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter">
            {isNotifying ? 'Enviando WhatsApp' : 'Validando con IA'}
          </h2>
          
          <div className="max-w-xs mx-auto space-y-4">
            <p className="text-indigo-200 text-lg font-bold leading-tight animate-pulse">
              {isNotifying 
                ? `Estamos informando a ${contact.name} automáticamente que ya has terminado.` 
                : "Nuestra inteligencia artificial está revisando tu foto para tu seguridad."
              }
            </p>
          </div>
        </div>
      )}

      {/* Notifications Toasts */}
      {notification && (
        <div className="fixed top-8 left-4 right-4 z-[70] animate-[bounce_1s_ease-in-out]">
          <div className={`p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-4 border-2 transition-all ${
            notification.type === 'whatsapp' ? 'bg-[#25D366] border-[#128C7E]' : 
            notification.type === 'success' ? 'bg-indigo-600 border-indigo-500' : 
            notification.type === 'error' ? 'bg-red-500 border-red-400' : 'bg-slate-800 border-slate-700'
          } text-white`}>
            <div className="bg-white/20 p-2 rounded-xl">
              {notification.type === 'whatsapp' ? <MessageCircle size={24} /> : notification.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-tight leading-tight">{notification.msg}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Alarm audio */}
      <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3" />
    </div>
  );
}
