import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
  Bell,
  Sparkles,
  ArrowRight,
  PartyPopper,
  Check
} from 'lucide-react';
import { NotificationService, NotificationStatus } from '../services/notificationService.ts';

interface PWAInstallPromptProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

type WizardStep = 'welcome' | 'guide' | 'notifications' | 'done';

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Notification status
  const [notifStatus, setNotifStatus] = useState<NotificationStatus>(() => NotificationService.getStatus());
  const [isRequestingNotif, setIsRequestingNotif] = useState(false);

  useEffect(() => {
    // 1. Detect if running as standalone PWA
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);

    // 2. Detect platform & device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
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

    // 4. Capture Android Chrome native install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Check if previously dismissed or completed
    const completed = localStorage.getItem('padel_pwa_installed_v3');
    const dismissedUntil = localStorage.getItem('padel_pwa_dismissed_v3');
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    // Auto-open on mobile/tablet if not installed and not dismissed
    if (!standaloneMode && mobileOrTablet && !completed && !isDismissed) {
      const timer = setTimeout(() => {
        setCurrentStep('welcome');
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setCurrentStep('welcome');
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleDismissLater = () => {
    setIsOpen(false);
    // Dismiss for 24 hours
    localStorage.setItem('padel_pwa_dismissed_v3', (Date.now() + 24 * 60 * 60 * 1000).toString());
    if (onClose) onClose();
  };

  // STEP 1: Click en "Instalar"
  const handleInstallClick = async () => {
    // Si es Android y el navegador tiene listo el instalador nativo en 1 toque
    if (isAndroid && deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
          // Se instaló directo "en chinga" -> pasar directo a notificaciones
          setCurrentStep('notifications');
          return;
        }
      } catch (err) {
        console.warn('Deferred prompt error:', err);
      }
      // Si canceló o no se completó, mostrar el instructivo
      setCurrentStep('guide');
      return;
    }

    // Si es iOS o no hay prompt nativo directo, mostrar instructivo
    setCurrentStep('guide');
  };

  // STEP 3: Activar Notificaciones
  const handleEnableNotifications = async () => {
    setIsRequestingNotif(true);
    try {
      await NotificationService.requestPermission();
      setNotifStatus(NotificationService.getStatus());
    } finally {
      setIsRequestingNotif(false);
      // Avanzar a la pantalla de felicitación / listo
      setCurrentStep('done');
    }
  };

  // STEP 4: Finalizar
  const handleFinish = () => {
    localStorage.setItem('padel_pwa_installed_v3', 'true');
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-[#1C1C1E] border-2 border-[#30D158]/50 rounded-3xl p-6 sm:p-7 text-white shadow-2xl z-10 space-y-5 animate-slide-up">
        
        {/* ========================================================================= */}
        {/* PANTALLA 1: INVITACIÓN A INSTALAR                                         */}
        {/* ========================================================================= */}
        {currentStep === 'welcome' && (
          <div className="space-y-6 text-center">
            {/* Logo oficial grande */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-black p-1.5 border-2 border-white/20 shadow-xl overflow-hidden">
              <img
                src="/apple-touch-icon.png"
                alt="Torneo G20 Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Título Principal */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Instala la app en tu cel.
              </h2>
              {/* Mensaje Tranquilizador: Cero Espacio */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/40 text-center">
                <p className="text-base sm:text-lg font-black text-[#30D158] flex items-center justify-center space-x-1.5">
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <span>Relax, no te quita espacio en tu dispositivo.</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 font-medium">
                  Funciona 100% en la nube (0 MB de fotos o archivos pesados).
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-4 px-6 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-lg sm:text-xl shadow-xl shadow-[#30D158]/30 flex items-center justify-center space-x-2 active:scale-98 transition-all"
              >
                <Smartphone className="w-6 h-6 stroke-[2.5]" />
                <span>Instalar</span>
              </button>

              <button
                type="button"
                onClick={handleDismissLater}
                className="w-full py-2.5 text-center text-sm sm:text-base font-bold text-[#8E8E93] hover:text-white transition-colors"
              >
                Ahorita no joven
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 2: INSTRUCTIVO SEGÚN DISPOSITIVO DETECTADO                      */}
        {/* ========================================================================= */}
        {currentStep === 'guide' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-black p-1 border border-white/20 overflow-hidden flex-shrink-0">
                  <img src="/apple-touch-icon.png" alt="Torneo G20" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {isIOS ? 'Instalar en tu iPhone' : 'Instalar en tu Android'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#30D158] font-bold">
                    Paso a paso guiado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INSTRUCCIONES ESPECÍFICAS PARA IPHONE */}
            {isIOS ? (
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
                        Desliza hacia abajo en el menú y toca{' '}
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
                        Presiona <strong>"Agregar"</strong> y ¡listo! Ya tendrás el icono en tu pantalla de inicio.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep('notifications')}
                  className="w-full py-4 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-base sm:text-lg shadow-xl shadow-[#30D158]/25 flex items-center justify-center space-x-2 active:scale-98 transition-all"
                >
                  <span>¡Ya lo hice! Siguiente</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* INSTRUCCIONES MANUALES PARA ANDROID (SI FALLÓ EL BOTÓN DIRECTO) */
              <div className="space-y-4">
                <div className="bg-black/50 border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Paso 1 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-md">
                      1
                    </div>
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-black text-white block">
                        Toca los 3 puntos en Chrome
                      </span>
                      <p className="text-sm sm:text-base text-gray-200 mt-1 leading-snug">
                        En la esquina superior derecha, toca los{' '}
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
                        O selecciona <strong>"Agregar a la pantalla principal"</strong> y confirma en <strong>"Instalar"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep('notifications')}
                  className="w-full py-4 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-base sm:text-lg shadow-xl shadow-[#30D158]/25 flex items-center justify-center space-x-2 active:scale-98 transition-all"
                >
                  <span>¡Listo! Continuar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 3: ACTIVAR NOTIFICACIONES                                        */}
        {/* ========================================================================= */}
        {currentStep === 'notifications' && (
          <div className="space-y-6 text-center">
            {/* Icono de Campana con aura */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#30D158]/20 border-2 border-[#30D158]/50 flex items-center justify-center text-[#30D158] shadow-lg shadow-[#30D158]/20">
              <Bell className="w-10 h-10 animate-bounce" />
            </div>

            {/* Título Exacto Pedido */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Activa las notificaciones y no te pierdas de ningún punto.
              </h2>
              <p className="text-sm sm:text-base text-gray-300">
                Te avisaremos cuando comience tu partido y cuando se publiquen los resultados en vivo.
              </p>
            </div>

            {/* Botón de Activación */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={isRequestingNotif}
                onClick={handleEnableNotifications}
                className="w-full py-4 px-6 rounded-2xl bg-[#30D158] hover:bg-[#28B84B] text-black font-black text-lg shadow-xl shadow-[#30D158]/30 flex items-center justify-center space-x-2 active:scale-98 transition-all disabled:opacity-50"
              >
                <Bell className="w-6 h-6" />
                <span>{isRequestingNotif ? 'Activando...' : 'Activar Notificaciones'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('done')}
                className="w-full py-2.5 text-center text-sm font-semibold text-[#8E8E93] hover:text-white transition-colors"
              >
                Continuar sin notificaciones
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 4: LISTO, YA PUEDES BUSCAR LA APP                                */}
        {/* ========================================================================= */}
        {currentStep === 'done' && (
          <div className="space-y-6 text-center py-2">
            {/* Checkmark verde grande */}
            <div className="w-20 h-20 mx-auto rounded-full bg-[#30D158] text-black flex items-center justify-center shadow-xl shadow-[#30D158]/30">
              <Check className="w-11 h-11 stroke-[3]" />
            </div>

            {/* Mensajes de Confirmación Exactos */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                ¡Listo! Ya puedes buscar la app en tu celular.
              </h2>
              <p className="text-xl font-extrabold text-[#30D158]">
                ¡Gracias! 🎉
              </p>
            </div>

            {/* Botón de Cierre */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-4 px-6 rounded-2xl bg-white text-black font-black text-lg hover:bg-gray-200 shadow-xl active:scale-98 transition-all"
              >
                Entrar al Torneo 🎾
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
