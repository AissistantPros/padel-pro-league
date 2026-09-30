import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
  Download,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { NotificationService, NotificationStatus } from '../services/notificationService.ts';

interface PWAInstallPromptProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Modals state
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // Notification status
  const [notifStatus, setNotifStatus] = useState<NotificationStatus>(() => NotificationService.getStatus());
  const [notifSuccessMessage, setNotifSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Detect if running as standalone PWA
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);

    // 2. Detect platform & device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    const mobileOrTablet =
      isIosDevice ||
      isAndroidDevice ||
      /mobile|tablet|silk|kindle/.test(userAgent) ||
      (window.innerWidth <= 850 && navigator.maxTouchPoints > 0);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobileOrTablet(mobileOrTablet);

    // 3. Update notification status
    setNotifStatus(NotificationService.getStatus());

    // 4. Listen for Android Chrome native install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Automatic pop-up for mobile/tablet users (NOT for desktop web)
    const dismissedUntil = localStorage.getItem('padel_pwa_popup_dismissed_v2');
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    if (!standaloneMode && mobileOrTablet && !isDismissed) {
      // Show prominent popup after 1.5 seconds of load
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setShowGuideModal(true);
      setShowWelcomePopup(false);
    }
  }, [forceOpen]);

  const handleDismissWelcomePopup = () => {
    setShowWelcomePopup(false);
    // Dismiss for 12 hours
    localStorage.setItem('padel_pwa_popup_dismissed_v2', (Date.now() + 12 * 60 * 60 * 1000).toString());
  };

  const handleOpenGuide = () => {
    setShowWelcomePopup(false);
    setShowGuideModal(true);
  };

  const handleCloseGuide = () => {
    setShowGuideModal(false);
    if (onClose) onClose();
  };

  const handleNativeAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowWelcomePopup(false);
        setShowGuideModal(false);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotifStatus(NotificationService.getStatus());
    if (granted) {
      setNotifSuccessMessage('¡Notificaciones activadas con éxito! Te avisaremos de tus partidos.');
      setTimeout(() => setNotifSuccessMessage(null), 5000);
    }
  };

  // If already standalone and modal not forced open, show only floating notification prompt if needed
  if (isStandalone && !forceOpen) {
    if (notifStatus.isSupported && notifStatus.permission === 'default') {
      return (
        <div className="fixed top-20 left-4 right-4 max-w-md mx-auto z-[998] animate-bounce-subtle select-none">
          <div className="bg-[#1C1C1E] border-2 border-[#30D158] rounded-2xl p-4 shadow-2xl text-white flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#30D158]/20 flex items-center justify-center text-[#30D158] flex-shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Activa las Notificaciones</p>
                <p className="text-xs text-[#8E8E93]">Para avisarte de partidos y resultados.</p>
              </div>
            </div>
            <button
              onClick={handleRequestNotifications}
              className="px-3.5 py-2 rounded-xl bg-[#30D158] text-black font-extrabold text-xs shadow-md active:scale-95 transition-transform flex-shrink-0"
            >
              ACTIVAR
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. POP-UP PRINCIPAL DE BIENVENIDA (SOLO PARA CELULAR / TABLETA)            */}
      {/* ========================================================================= */}
      {showWelcomePopup && isMobileOrTablet && !isStandalone && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="absolute inset-0" onClick={handleDismissWelcomePopup} />

          <div className="relative w-full max-w-md bg-[#1C1C1E] border-2 border-[#30D158]/60 rounded-3xl p-6 sm:p-7 text-white shadow-2xl z-10 space-y-5 animate-slide-up">
            
            {/* Header del Pop-up con Logo Grande */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-16 h-16 rounded-2xl bg-black p-1 border-2 border-white/20 overflow-hidden shadow-xl flex-shrink-0">
                  <img
                    src="/apple-touch-icon.png"
                    alt="Torneo G20 Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#30D158]/20 text-[#30D158] mb-1">
                    App Móvil Oficial
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Torneo G20 Pádel
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissWelcomePopup}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#8E8E93] hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Texto muy claro y con tipografía grande para mayores de 50 años */}
            <div className="space-y-3 bg-black/40 border border-white/10 rounded-2xl p-4">
              <p className="text-base sm:text-lg font-bold text-white leading-snug">
                ¿Quieres tener la App en tu pantalla de inicio con acceso directo?
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-200">
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#30D158] flex-shrink-0" />
                  <span><strong>Acceso en 1 toque</strong> desde tu celular.</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#30D158] flex-shrink-0" />
                  <span><strong>Pantalla completa</strong> (sin barras de navegador).</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#30D158] flex-shrink-0" />
                  <span><strong>Notificaciones</strong> de partidos y resultados.</span>
                </li>
              </ul>
            </div>

            {/* Botón Principal Gigante y Llamativo */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (isAndroid && deferredPrompt) {
                    handleNativeAndroidInstall();
                  } else {
                    handleOpenGuide();
                  }
                }}
                className="w-full py-4 px-5 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-base sm:text-lg shadow-xl shadow-[#30D158]/25 flex items-center justify-center space-x-2 active:scale-98 transition-all"
              >
                <Smartphone className="w-6 h-6 stroke-[2.5]" />
                <span>SÍ, INSTALAR EN MI CELULAR</span>
              </button>

              <button
                type="button"
                onClick={handleDismissWelcomePopup}
                className="w-full py-2.5 text-center text-sm font-semibold text-[#8E8E93] hover:text-white transition-colors"
              >
                Quizás más tarde
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL DE INSTRUCCIONES PASO A PASO (LETRAS GRANDES Y MUY VISIBLES)    */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
          <div className="fixed inset-0" onClick={handleCloseGuide} />

          <div className="relative w-full max-w-lg bg-[#1C1C1E] border-2 border-white/20 rounded-3xl p-5 sm:p-7 text-white shadow-2xl z-10 space-y-6 my-auto animate-slide-up">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-black p-1 border border-white/20 overflow-hidden flex-shrink-0">
                  <img src="/apple-touch-icon.png" alt="Torneo G20" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {isIOS ? 'Instalar en iPhone / iPad' : isAndroid ? 'Instalar en Android' : 'Instalar App Oficial'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#30D158] font-bold">
                    Sigue estos sencillos pasos:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseGuide}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SECCIÓN DE NOTIFICACIONES */}
            <div className="bg-[#2C2C2E] border-2 border-[#30D158]/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#30D158]/20 text-[#30D158] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-white">
                    🔔 Notificaciones del Torneo
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                    Recibe alertas en tu pantalla cuando juegues y cuando se publiquen resultados.
                  </p>
                </div>
              </div>

              {notifStatus.permission === 'granted' ? (
                <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-[#30D158] bg-[#30D158]/15 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>¡Notificaciones activadas en este dispositivo!</span>
                </div>
              ) : isIOS && !isStandalone ? (
                <div className="text-xs sm:text-sm text-[#FFD60A] bg-[#FFD60A]/10 border border-[#FFD60A]/30 p-2.5 rounded-xl font-medium">
                  📌 <strong>Nota para iPhone:</strong> Apple requiere que primero agregues la app a tu pantalla de inicio (ver pasos abajo). Al abrirla desde el icono, podrás activar las notificaciones.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#30D158] hover:bg-[#28B84B] text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-transform"
                >
                  <Bell className="w-4 h-4" />
                  <span>ACTIVAR NOTIFICACIONES AHORA</span>
                </button>
              )}

              {notifSuccessMessage && (
                <p className="text-xs font-bold text-[#30D158] text-center pt-1 animate-fade-in">
                  {notifSuccessMessage}
                </p>
              )}
            </div>

            {/* GUÍA ESPECÍFICA SEGÚN DISPOSITIVO */}
            {isIOS ? (
              /* ================= INSTRUCCIONES IPHONE (SAFARI) ================= */
              <div className="space-y-4">
                <div className="bg-black/50 border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4">
                  
                  {/* Paso 1 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                      1
                    </div>
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-black text-white block">
                        Toca el botón Compartir
                      </span>
                      <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                        En la barra de hasta abajo de Safari, presiona el icono de <strong>Compartir</strong>{' '}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/20 text-white font-bold mx-1">
                          <Share className="w-4 h-4 mr-1 text-[#0A84FF]" /> Compartir
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex items-start space-x-3.5 pt-1">
                    <div className="w-9 h-9 rounded-full bg-[#30D158] text-black flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                      2
                    </div>
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-black text-white block">
                        Elige "Agregar a inicio"
                      </span>
                      <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                        Desliza hacia abajo en el menú que aparece y toca la opción{' '}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/20 text-white font-bold mx-1">
                          <PlusSquare className="w-4 h-4 mr-1 text-[#30D158]" /> Agregar a inicio
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="flex items-start space-x-3.5 pt-1">
                    <div className="w-9 h-9 rounded-full bg-[#FF9F0A] text-black flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                      3
                    </div>
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-black text-white block">
                        Toca "Agregar" arriba a la derecha
                      </span>
                      <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                        Presiona <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Se creará el icono de <strong>G20 Pádel</strong> en tu celular.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ) : isAndroid ? (
              /* ================= INSTRUCCIONES ANDROID (CHROME) ================= */
              <div className="space-y-4">
                {deferredPrompt ? (
                  <div className="bg-black/50 border border-white/15 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                    <p className="text-base sm:text-lg font-bold text-white">
                      ¡Tu teléfono Android está listo para instalarla en 1 solo clic!
                    </p>
                    <button
                      type="button"
                      onClick={handleNativeAndroidInstall}
                      className="w-full py-4 px-4 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-base sm:text-lg shadow-xl shadow-[#30D158]/25 flex items-center justify-center space-x-2 active:scale-98 transition-transform"
                    >
                      <Download className="w-6 h-6" />
                      <span>INSTALAR DIRECTO EN ESTE DISPOSITIVO</span>
                    </button>
                    <p className="text-xs text-gray-400">
                      Se descargará e instalará directamente como app en tu pantalla.
                    </p>
                  </div>
                ) : (
                  <div className="bg-black/50 border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4">
                    
                    {/* Paso 1 */}
                    <div className="flex items-start space-x-3.5">
                      <div className="w-9 h-9 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                        1
                      </div>
                      <div className="flex-1">
                        <span className="text-base sm:text-lg font-black text-white block">
                          Toca el menú de Chrome (3 puntos)
                        </span>
                        <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                          En la esquina superior derecha de tu navegador Chrome, toca los{' '}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/20 text-white font-bold mx-1">
                            <MoreVertical className="w-4 h-4 mr-0.5 text-white" /> 3 puntos
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Paso 2 */}
                    <div className="flex items-start space-x-3.5 pt-1">
                      <div className="w-9 h-9 rounded-full bg-[#30D158] text-black flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                        2
                      </div>
                      <div className="flex-1">
                        <span className="text-base sm:text-lg font-black text-white block">
                          Toca "Instalar aplicación"
                        </span>
                        <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                          Selecciona{' '}
                          <strong className="text-white">"Instalar aplicación"</strong> o{' '}
                          <strong className="text-white">"Agregar a la pantalla principal"</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Paso 3 */}
                    <div className="flex items-start space-x-3.5 pt-1">
                      <div className="w-9 h-9 rounded-full bg-[#FF9F0A] text-black flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                        3
                      </div>
                      <div className="flex-1">
                        <span className="text-base sm:text-lg font-black text-white block">
                          Confirma "Instalar"
                        </span>
                        <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                          Presiona el botón de confirmación. ¡El icono aparecerá en tu teléfono al instante!
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              /* ================= INSTRUCCIONES COMPUTADORA / OTROS ================= */
              <div className="bg-black/50 border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3">
                <p className="text-base font-bold text-white">
                  Instalación en Navegador Web:
                </p>
                <p className="text-sm text-gray-300">
                  Si usas Chrome o Edge en tu computadora, haz clic en el icono de instalación (pantallita con flecha) en la barra de direcciones superior para tener la app en tu escritorio.
                </p>
              </div>
            )}

            {/* Botón de Cierre Entendido */}
            <button
              type="button"
              onClick={handleCloseGuide}
              className="w-full py-3.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-extrabold text-base transition-colors"
            >
              ¡Entendido, gracias!
            </button>

          </div>
        </div>
      )}
    </>
  );
};
