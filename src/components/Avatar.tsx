'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAvatarState, useTheme, getAvatarImage } from '@/store/useStore';
import { AvatarState } from '@/types';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'character';
  className?: string;
  showAsCharacter?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
  character: 'w-full h-full max-w-sm max-h-96',
};

const Avatar: React.FC<AvatarProps> = ({ size = 'lg', className = '', showAsCharacter = false }) => {
  const avatarState = useAvatarState();
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Get the current image path with fallback
  const currentImagePath = getAvatarImage(theme, avatarState);

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when image path changes
  useEffect(() => {
    setImageError(false);
    setIsVisible(false);
    
    // Add a small delay for smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentImagePath]);

  // Character mode for immersive learning experience
  if (showAsCharacter) {
    return (
      <div className={`relative ${className} transition-all duration-500 ${!isVisible ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {/* Character illustration */}
        <div className="relative">
          <div className={`${sizeClasses[size]} mx-auto relative`}>
            {!imageError ? (
              <Image
                src={currentImagePath}
                alt={`${theme.displayName} - ${avatarState}`}
                fill
                className="object-contain drop-shadow-2xl"
                onError={handleImageError}
                priority={avatarState === 'loading'}
              />
            ) : (
              <div 
                className="w-full h-full flex items-end justify-center relative"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}20)` }}
              >
                <div 
                  className="text-6xl font-bold mb-8"
                  style={{ color: theme.colors.primary }}
                >
                  {theme.displayName.charAt(0)}
                </div>
              </div>
            )}
          </div>
          
          {/* State-based effects */}
          {avatarState === 'loading' && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent, animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent, animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent, animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          {avatarState === 'explaining' && (
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: theme.colors.accent }}>
                <span className="text-white text-sm">💡</span>
              </div>
            </div>
          )}
          
          {avatarState === 'asking' && (
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center animate-bounce" style={{ backgroundColor: theme.colors.secondary }}>
                <span className="text-white text-sm">❓</span>
              </div>
            </div>
          )}
          
          {avatarState === 'praising' && (
            <div className="absolute -top-2 -right-2 animate-spin">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                <span className="text-white text-sm">⭐</span>
              </div>
            </div>
          )}
          
          {avatarState === 'consoling' && (
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#f59e0b' }}>
                <span className="text-white text-sm">💪</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback UI only when image fails to load (currentImagePath is always available due to defaults)
  if (imageError) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          ${className}
          avatar-container
          flex items-center justify-center
          transition-all duration-300
          ${!isVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
        style={{ 
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.secondary,
        }}
      >
        <div className="text-center">
          <div 
            className="text-2xl font-bold mb-1"
            style={{ color: theme.colors.secondary }}
          >
            {theme.displayName.charAt(0)}
          </div>
          <div 
            className="text-xs opacity-75 capitalize"
            style={{ color: theme.colors.secondary }}
          >
            {avatarState}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${className}
        avatar-container
        transition-all duration-300
        ${!isVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
      style={{ 
        borderColor: theme.colors.accent,
        borderWidth: '2px',
        borderStyle: 'solid',
      }}
    >
      <Image
        src={currentImagePath}
        alt={`${theme.displayName} - ${avatarState}`}
        fill
        className="avatar-image"
        onError={handleImageError}
        priority={avatarState === 'loading'}
        sizes={`${sizeClasses[size].split(' ')[0]}`}
      />
      
      {/* Loading indicator for loading state */}
      {avatarState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
          <div 
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: theme.colors.secondary }}
          />
        </div>
      )}
      
      {/* Pulse effect for explaining state */}
      {avatarState === 'explaining' && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse-slow opacity-30"
          style={{ backgroundColor: theme.colors.accent }}
        />
      )}
    </div>
  );
};

// Avatar state indicator component
export const AvatarStateIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const avatarState = useAvatarState();
  const theme = useTheme();

  const stateConfig = {
    loading: { label: 'Thinking...', icon: '🤔', color: theme.colors.primary },
    explaining: { label: 'Teaching', icon: '📚', color: theme.colors.accent },
    asking: { label: 'Asking', icon: '❓', color: theme.colors.secondary },
    praising: { label: 'Great job!', icon: '🎉', color: '#22c55e' },
    consoling: { label: 'Keep trying!', icon: '💪', color: '#f59e0b' },
  };

  const config = stateConfig[avatarState];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg">{config.icon}</span>
      <span 
        className="text-sm font-medium"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
};

export default Avatar;
