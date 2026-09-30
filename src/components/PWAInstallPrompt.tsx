import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, MoreVertical, X, CheckCircle2, Download, Sparkles } from 'lucide-react';

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);

    // 2. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Listen for Android Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standaloneMode) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Show initial banner on mobile if not installed and not dismissed recently
    const dismissedUntil = localStorage.getItem('padel_pwa_banner_dismissed');
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    if (!standaloneMode && !isDismissed && (isIosDevice || isAndroidDevice)) {
      // Show banner after 3 seconds of navigation
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setShowModal(true);
    }
  }, [forceOpen]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    // Dismiss for 24 hours
    localStorage.setItem('padel_pwa_banner_dismissed', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
        setShowModal(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onClose) onClose();
  };

  // If already running as an installed PWA, do not render banner unless modal forced open
  if (isStandalone && !forceOpen) {
    return null;
  }

  return (
    <>
      {/* 1. DISCREET FLOATING INSTALL BANNER */}
      {showBanner && !showModal && !isStandalone && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-[999] max-w-md mx-auto animate-slide-up select-none">
          <div className="bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#30D158]/30 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-white space-x-3">
            <div className="w-10 h-10 rounded-xl bg-black flex-shrink-0 p-1 border border-white/10 overflow-hidden">
              <img src="/apple-touch-icon.png" alt="G20 Pádel" className="w-full h-full object-cover rounded-lg" />
            </div>

            <div className="flex-1 min-w-0" onClick={() => setShowModal(true)}>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white truncate">Instalar G20 Pádel</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#30D158]/20 text-[#30D158]">App Web</span>
              </div>
              <p className="text-[11px] text-[#8E8E93] truncate">
                {isIOS ? 'Agrégala a tu pantalla de inicio en 2 pasos' : 'Instálala en tu celular para entrar en 1 toque'}
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-[#30D158] text-black font-extrabold text-xs shadow-md active:scale-95 transition-transform"
              >
                Instalar
              </button>
              <button
                onClick={handleDismissBanner}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STEP-BY-STEP INSTRUCTIONS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="absolute inset-0" onClick={handleCloseModal} />

          <div className="relative w-full max-w-sm bg-[#1C1C1E] border border-white/15 rounded-3xl p-6 text-white shadow-2xl z-10 space-y-5 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-black p-1 border border-white/15 overflow-hidden shadow-md flex-shrink-0">
                  <img src="/apple-touch-icon.png" alt="G20 Pádel Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    G20 Pádel App
                  </h3>
                  <p className="text-xs text-[#30D158] font-semibold flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Lista para tu celular
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93] leading-relaxed">
              Disfruta de la app en pantalla completa, sin barras del navegador y con acceso instantáneo desde el icono de tu teléfono.
            </p>

            {/* INSTRUCTIONS BY PLATFORM */}
            {isIOS ? (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3.5 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white block">Toca el botón Compartir</span>
                    <span className="text-[#8E8E93] text-[11px] flex items-center mt-0.5">
                      En la barra inferior de Safari, presiona el icono <Share className="w-3.5 h-3.5 mx-1 text-[#0A84FF] inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white block">Selecciona "Agregar a inicio"</span>
                    <span className="text-[#8E8E93] text-[11px] flex items-center mt-0.5">
                      Baja en el menú y toca <PlusSquare className="w-3.5 h-3.5 mx-1 text-white inline" /> <strong>Agregar a pantalla de inicio</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-white block">Toca "Agregar"</span>
                    <span className="text-[#8E8E93] text-[11px]">
                      En la esquina superior derecha toca <strong>Agregar</strong>. ¡El icono aparecerá en tu iPhone como cualquier app nativa!
                    </span>
                  </div>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-3 text-center">
                <p className="text-xs text-white">Tu navegador Android permite instalación directa en un solo toque:</p>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 rounded-2xl bg-[#30D158] text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar en este Dispositivo</span>
                </button>
              </div>
            ) : (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3.5 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white block">Abre el menú de Chrome</span>
                    <span className="text-[#8E8E93] text-[11px] flex items-center mt-0.5">
                      Toca los tres puntos <MoreVertical className="w-3.5 h-3.5 mx-0.5 text-white inline" /> en la esquina superior derecha.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white block">Toca "Instalar aplicación"</span>
                    <span className="text-[#8E8E93] text-[11px]">
                      O selecciona <strong>"Agregar a la pantalla principal"</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation benefits */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-2 text-[11px] text-[#8E8E93]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" />
                <span>No ocupa memoria pesada en tu teléfono</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#8E8E93]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" />
                <span>Actualizaciones automáticas en vivo (Vercel & Supabase)</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#8E8E93]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" />
                <span>Pantalla completa sin barra de direcciones web</span>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
