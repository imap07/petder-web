'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';

interface MatchCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  petName?: string;
  petPhoto?: string;
}

interface Confetti {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

const CONFETTI_COLORS = [
  '#FF6F61', // primary
  '#FFD166', // accent
  '#6B8E7B', // secondary
  '#FF8A7A', // primary-light
  '#FFE08A', // accent-light
  '#FF69B4', // pink
  '#FFD700', // gold
];

export function MatchCelebration({ isOpen, onClose, petName, petPhoto }: MatchCelebrationProps) {
  const t = useTranslations('discover.match');
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Generate confetti
  const generateConfetti = useCallback(() => {
    const newConfetti: Confetti[] = [];
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
      });
    }
    setConfetti(newConfetti);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      generateConfetti();
      // Delay content for dramatic effect
      setTimeout(() => setShowContent(true), 200);
    } else {
      setShowContent(false);
      setTimeout(() => {
        setIsVisible(false);
        setConfetti([]);
      }, 300);
    }
  }, [isOpen, generateConfetti]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
                 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop with gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary-dark/95 to-secondary/95
                   backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          >
            <div
              className="animate-confetti-spin"
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          </div>
        ))}
      </div>

      {/* Hearts floating up */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute animate-float-up text-4xl"
            style={{
              left: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random()}s`,
            }}
          >
            💕
          </div>
        ))}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 text-center px-6 max-w-sm mx-auto
                   transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      >
        {/* Match icon with pulse */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white/20 rounded-full animate-ping-slow" />
          </div>
          <div className="relative text-8xl animate-bounce-slow">
            💘
          </div>
        </div>

        {/* Title with glow */}
        <h2 className="text-5xl font-black text-white mb-2 animate-glow drop-shadow-2xl">
          {t('title')}
        </h2>

        {/* Subtitle */}
        <p className="text-white/90 text-lg mb-8 max-w-xs mx-auto">
          {petName ? `You and ${petName}'s owner both liked each other!` : t('subtitle')}
        </p>

        {/* Pet photo preview (if available) */}
        {petPhoto && (
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-lg">❤️</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onClose}
            size="lg"
            className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-2xl
                     transform hover:scale-105 transition-transform"
          >
            {t('keepSwiping')}
          </Button>

          <Link href="/matches" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-white text-white hover:bg-white/10 font-bold"
            >
              {t('viewMatches')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MatchCelebration;
