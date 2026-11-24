import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { sizes } from '@/theme';

/** Iconos de línea del canvas (24×24, trazo 1.6–1.8). Siempre decorativos: la etiqueta va en el control. */
export type IconName =
  | 'today'
  | 'tasks'
  | 'sessions'
  | 'companion'
  | 'profile'
  | 'plus'
  | 'close'
  | 'back'
  | 'eye'
  | 'eyeOff'
  | 'alert'
  | 'check'
  | 'mail'
  | 'chevron'
  | 'checkCircle'
  | 'userMinus'
  | 'send'
  | 'share'
  | 'users'
  | 'clock';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = sizes.icon.nav, color, strokeWidth = 1.6 }: IconProps) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'today' && (
        <Path
          {...common}
          d="M12 2C12.8 8.5 15.5 11.2 22 12C15.5 12.8 12.8 15.5 12 22C11.2 15.5 8.5 12.8 2 12C8.5 11.2 11.2 8.5 12 2Z"
        />
      )}
      {name === 'tasks' && (
        <Path
          {...common}
          d="M10 6h10M10 12h10M10 18h10M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"
        />
      )}
      {name === 'sessions' && (
        <>
          <Rect {...common} x={3.5} y={5} width={17} height={15.5} rx={3} />
          <Path {...common} d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      )}
      {name === 'companion' && (
        <>
          <Circle {...common} cx={9} cy={12} r={5.5} />
          <Circle {...common} cx={15} cy={12} r={5.5} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle {...common} cx={12} cy={8.5} r={3.5} />
          <Path {...common} d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
        </>
      )}
      {name === 'plus' && <Path {...common} d="M12 5v14M5 12h14" />}
      {name === 'close' && <Path {...common} d="M6 6l12 12M18 6L6 18" />}
      {name === 'back' && <Path {...common} d="M15 5l-7 7 7 7" />}
      {name === 'eye' && (
        <>
          <Path
            {...common}
            d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
          />
          <Circle {...common} cx={12} cy={12} r={3} />
        </>
      )}
      {name === 'eyeOff' && (
        <Path
          {...common}
          d="M3 3l18 18M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-3 3.6M6.5 7.6A16 16 0 0 0 2.5 12S6 18.1 12 18.1c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"
        />
      )}
      {name === 'alert' && (
        <>
          <Circle {...common} cx={12} cy={12} r={8.5} />
          <Path {...common} d="M12 11v5M12 8h.01" />
        </>
      )}
      {name === 'check' && <Path {...common} d="M5 12.5l4.5 4.5L19 7" />}
      {name === 'clock' && (
        <>
          <Circle {...common} cx={12} cy={12} r={8.5} />
          <Path {...common} d="M12 7.5V12l3 2" />
        </>
      )}
      {name === 'chevron' && <Path {...common} d="M9 5l7 7-7 7" />}
      {name === 'checkCircle' && (
        <>
          <Circle {...common} cx={12} cy={12} r={8.5} />
          <Path {...common} d="M8.5 12.5l2.5 2.5 4.5-5" />
        </>
      )}
      {name === 'userMinus' && (
        <>
          <Circle {...common} cx={10} cy={8.5} r={3.5} />
          <Path {...common} d="M3.5 19.5c1-3.2 3.6-5 6.5-5s5.5 1.8 6.5 5M16.5 11h5" />
        </>
      )}
      {name === 'send' && <Path {...common} d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />}
      {name === 'share' && (
        <Path {...common} d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      )}
      {name === 'users' && (
        <>
          <Circle {...common} cx={9} cy={8.5} r={3.5} />
          <Path
            {...common}
            d="M2.5 19.5c1-3.2 3.6-5 6.5-5s5.5 1.8 6.5 5M16 5.5a3.5 3.5 0 0 1 0 6.5M18 14.8c1.8.8 3 2.4 3.5 4.7"
          />
        </>
      )}
      {name === 'mail' && (
        <>
          <Rect {...common} x={3} y={5.5} width={18} height={13} rx={3} />
          <Path {...common} d="M4 7.5l8 6 8-6" />
        </>
      )}
    </Svg>
  );
}
