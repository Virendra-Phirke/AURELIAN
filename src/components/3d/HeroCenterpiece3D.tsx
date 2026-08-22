import React from 'react';
import { Polyhedron3D } from './Polyhedron3D';
import { useTheme } from '../../lib/theme';

export function HeroCenterpiece3D() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'system';

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Luxury Golden Glow Aura behind the Polyhedron */}
      <div
        className="absolute inset-0 m-auto w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(229,195,120,0.18) 0%, rgba(196,151,42,0.06) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(196,151,42,0.14) 0%, rgba(229,195,120,0.05) 50%, transparent 70%)',
        }}
      />

      {/* Polyhedron 3D Component from Framer Spec */}
      <div className="relative z-10 w-full h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[500px]">
        <Polyhedron3D
          size={320}
          speed={0.9}
          nested={true}
          interactive={true}
          wireColor={isDark ? '#e5c378' : '#c4972a'}
          dotColor={isDark ? '#fff0c0' : '#8a6a00'}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

export default HeroCenterpiece3D;
