/**
 * Theme Wave Shockwave Animation Engine
 * Fires a luminous, expanding wave from the toggle button coordinates
 * that visually sweeps and transforms the entire screen into the new theme.
 */

export function fireThemeWave(
  x: number,
  y: number,
  nextTheme: 'dark' | 'light',
  duration = 650
) {
  if (typeof document === 'undefined') return;

  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const targetDiameter = maxRadius * 2 + 100;

  // Remove any existing wave container
  const oldContainer = document.getElementById('theme-wave-container');
  if (oldContainer) {
    oldContainer.remove();
  }

  const container = document.createElement('div');
  container.id = 'theme-wave-container';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '999999';
  container.style.overflow = 'hidden';

  // 1. Center burst flash
  const burst = document.createElement('div');
  burst.style.position = 'absolute';
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.style.width = '24px';
  burst.style.height = '24px';
  burst.style.borderRadius = '50%';
  burst.style.transform = 'translate(-50%, -50%)';
  burst.style.background =
    nextTheme === 'dark'
      ? 'radial-gradient(circle, #E5C378 0%, rgba(229, 195, 120, 0) 70%)'
      : 'radial-gradient(circle, #A37A2C 0%, rgba(163, 122, 44, 0) 70%)';
  burst.style.boxShadow = '0 0 30px rgba(229, 195, 120, 0.9)';

  // 2. Primary expanding wave (with gold glowing ring)
  const wave = document.createElement('div');
  wave.style.position = 'absolute';
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;
  wave.style.width = '0px';
  wave.style.height = '0px';
  wave.style.borderRadius = '50%';
  wave.style.transform = 'translate(-50%, -50%)';
  wave.style.border =
    nextTheme === 'dark'
      ? '3px solid rgba(229, 195, 120, 0.95)'
      : '3px solid rgba(163, 122, 44, 0.95)';
  wave.style.boxShadow =
    nextTheme === 'dark'
      ? '0 0 50px rgba(229, 195, 120, 0.7), inset 0 0 40px rgba(229, 195, 120, 0.25)'
      : '0 0 50px rgba(163, 122, 44, 0.6), inset 0 0 40px rgba(163, 122, 44, 0.2)';

  // 3. Secondary subtle trailing shockwave ring
  const trail = document.createElement('div');
  trail.style.position = 'absolute';
  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  trail.style.width = '0px';
  trail.style.height = '0px';
  trail.style.borderRadius = '50%';
  trail.style.transform = 'translate(-50%, -50%)';
  trail.style.border = '1.5px solid rgba(229, 195, 120, 0.45)';
  trail.style.boxShadow = '0 0 25px rgba(229, 195, 120, 0.4)';

  container.appendChild(burst);
  container.appendChild(wave);
  container.appendChild(trail);
  document.body.appendChild(container);

  // Animate center burst
  burst.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(4)', opacity: 0 },
    ],
    {
      duration: 350,
      easing: 'ease-out',
      fill: 'forwards',
    }
  );

  // Animate main shockwave ring
  const waveAnim = wave.animate(
    [
      {
        width: '0px',
        height: '0px',
        opacity: 1,
        borderWidth: '4px',
      },
      {
        width: `${targetDiameter * 0.6}px`,
        height: `${targetDiameter * 0.6}px`,
        opacity: 0.9,
        borderWidth: '3px',
        offset: 0.6,
      },
      {
        width: `${targetDiameter}px`,
        height: `${targetDiameter}px`,
        opacity: 0,
        borderWidth: '1px',
      },
    ],
    {
      duration,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    }
  );

  // Animate trailing ripple ring
  trail.animate(
    [
      { width: '0px', height: '0px', opacity: 0.8 },
      {
        width: `${targetDiameter * 1.08}px`,
        height: `${targetDiameter * 1.08}px`,
        opacity: 0,
      },
    ],
    {
      duration: duration + 180,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    }
  );

  waveAnim.onfinish = () => {
    container.remove();
  };
}
