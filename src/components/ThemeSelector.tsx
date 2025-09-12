'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useStore, getAvatarImage } from '@/store/useStore';
import { Theme } from '@/types';
import { CheckIcon, VolumeXIcon, Volume2Icon } from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
  onThemeSelect?: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '', onThemeSelect }) => {
  const { currentTheme, availableThemes, setTheme, isAudioEnabled, toggleAudio } = useStore();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setTheme(theme);
    onThemeSelect?.(theme);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Learning Companion</h2>
        <p className="text-gray-600">Select a theme that motivates you to learn!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableThemes.map((theme) => {
          const isSelected = selectedTheme.id === theme.id;
          const hasImages = Object.keys(theme.images).length > 0;

          return (
            <div
              key={theme.id}
              className={`
                learning-card cursor-pointer transition-all duration-300 relative
                ${isSelected 
                  ? 'ring-2 ring-offset-2 shadow-xl' 
                  : 'hover:shadow-lg'
                }
              `}
              style={{
                borderColor: isSelected ? theme.colors.accent : '#e5e7eb',
                ...(isSelected && {
                  boxShadow: `0 0 0 2px ${theme.colors.accent}`,
                }),
              }}
              onClick={() => handleThemeSelect(theme)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div 
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Theme preview */}
              <div className="text-center mb-4">
                <div 
                  className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 mb-3"
                  style={{ borderColor: theme.colors.accent }}
                >
                  <Image
                    src={getAvatarImage(theme, 'explaining')}
                    alt={`${theme.displayName} preview`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Keep the image container, the src should have fallback
                      console.log('Image failed to load:', getAvatarImage(theme, 'explaining'));
                    }}
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {theme.displayName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {theme.description}
                </p>
              </div>

              {/* Theme features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <span className="text-gray-600">Primary Color</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <span className="text-gray-600">Accent Color</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasImages ? (
                    <span className="text-green-600 text-xs">✓ Avatar Images</span>
                  ) : (
                    <span className="text-gray-500 text-xs">○ Text-based Avatar</span>
                  )}
                  {theme.audio && (
                    <span className="text-blue-600 text-xs ml-2">♪ Audio</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audio control */}
      <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={toggleAudio}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200
            ${isAudioEnabled 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }
          `}
        >
          {isAudioEnabled ? (
            <>
              <Volume2Icon className="w-4 h-4" />
              <span className="text-sm font-medium">Audio On</span>
            </>
          ) : (
            <>
              <VolumeXIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Audio Off</span>
            </>
          )}
        </button>
        <div className="text-sm text-gray-600">
          {isAudioEnabled 
            ? 'Background music will play during learning'
            : 'Learning in silent mode'
          }
        </div>
      </div>

      {/* Preview section for selected theme */}
      {selectedTheme && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">
            Preview: {selectedTheme.displayName} Theme
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['loading', 'explaining', 'asking', 'praising', 'consoling'] as const).map((state) => {
              return (
                <div key={state} className="text-center">
                  <div 
                    className="w-12 h-12 mx-auto rounded-full border-2 overflow-hidden mb-2"
                    style={{
                      borderColor: selectedTheme.colors.accent,
                    }}
                  >
                    <Image
                      src={getAvatarImage(selectedTheme, state)}
                      alt={`${state} state`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Preview image failed for ${state}:`, getAvatarImage(selectedTheme, state));
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{state}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
