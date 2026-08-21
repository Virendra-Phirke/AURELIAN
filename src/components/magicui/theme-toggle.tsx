import React from 'react';
import { AnimatedThemeToggler, AnimatedThemeTogglerProps } from './animated-theme-toggler';

export interface ThemeToggleProps extends AnimatedThemeTogglerProps {}

export function ThemeToggle(props: ThemeToggleProps) {
  return <AnimatedThemeToggler {...props} />;
}

export { AnimatedThemeToggler };
