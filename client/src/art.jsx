const FOX = '#fb923c';
const FOX_DARK = '#ea580c';
const FOX_LIGHT = '#fdc48e';
const FOX_URE = '#fdba74';
const FOX_INK = '#3a2a1a';
const FOX_NOSE = '#6b3410';
const FOX_BLUSH = '#ffa894';

const PANDA_INK = '#23252b';
const PANDA_INK2 = '#3b3f47';
const PANDA_OUT = '#e7e4df';
const PANDA_BLUSH = '#ffc9d2';

const BEAR = '#a16207';
const BEAR_DK = '#78350f';
const BEAR_LT = '#f6d08e';

const HAWK = '#b45309';
const HAWK_DK = '#78350f';
const HAWK_GOLD = '#fbbf24';
const HAWK_CREAM = '#fef3c7';

const SNAKE = '#16a34a';
const SNAKE_DK = '#166534';
const SNAKE_LT = '#4ade80';

function HeadShape({ fill, stroke, strokeWidth }) {
  return (
    <path
      d="M32 9
         C 22 9 13 15 12 24
         C 11.6 28 12 31 15.5 32.5
         C 11 35 11.5 41 16 45
         C 20 50 26 54 32 54
         C 38 54 44 50 48 45
         C 52.5 41 53 35 48.5 32.5
         C 52 31 52.4 28 52 24
         C 51 15 42 9 32 9 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}

function EarTri({ left, tip, base, fill, inner }) {
  const flip = left ? 1 : -1;
  return (
    <path
      d={`M ${32 + flip * -14} 20 C ${32 + flip * -18} 11 ${32 + flip * -20} 3 ${
        32 + flip * -13
      } 2 C ${32 + flip * -8} 3 ${32 + flip * -5} 11 ${32 + flip * -6} 17 Z`}
      fill={fill}
    />
  );
}

function Eyes({ cx1, cx2, cy, ink, r = 3.7 }) {
  return (
    <g className="eyes">
      <ellipse cx={cx1} cy={cy} rx={r} ry={r + 0.8} fill={ink} />
      <ellipse cx={cx2} cy={cy} rx={r} ry={r + 0.8} fill={ink} />
      <circle cx={cx1 + 1.3} cy={cy - 1.9} r={r * 0.4 + 0.2} fill="#fff" />
      <circle cx={cx2 + 1.3} cy={cy - 1.9} r={r * 0.4 + 0.2} fill="#fff" />
      <circle cx={cx1 - 1.4} cy={cy + 1.6} r={r * 0.24} fill="#fff" opacity={0.75} />
      <circle cx={cx2 - 1.4} cy={cy + 1.6} r={r * 0.24} fill="#fff" opacity={0.75} />
    </g>
  );
}

function Smile({ x, y, stroke, sw = 1.5 }) {
  return (
    <path
      d={`M ${x - 3.4} ${y} q 3.4 3.4 6.8 0`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  );
}

function Brows({ left, top, stroke, cls }) {
  return (
    <g className={cls}>
      <path
        d={`M ${left} ${top} q 4.4 -3.2 8.6 0`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d={`M ${left + 16.4} ${top} q 4.4 -3.2 8.6 0`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

function Nose({ x, y, size = 2.4, fill }) {
  return (
    <path
      d={`M ${x - size} ${y - size * 0.35} a ${size} ${size} 0 1 1 ${size * 2} 0 l -${size * 0.55} ${size * 1.15} h -${size * 0.9} z`}
      fill={fill}
    />
  );
}

/* ---------------- FACES ---------------- */

export function FoxFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <EarTri left cx1={32} cx2={32} tip={3} base={17} fill={FOX_DARK} />
      <EarTri left cx1={46} cx2={46} tip={3} base={17} fill={FOX_DARK} />
      <path
        d="M 18 16 C 15 10 14.5 6 17 5.5 C 19.5 5.5 20.5 10 21 13 Z"
        fill={FOX_URE}
      />
      <path
        d="M 46 16 C 49 10 49.5 6 47 5.5 C 44.5 5.5 43.5 10 43 13 Z"
        fill={FOX_URE}
      />
      <HeadShape fill={FOX} />
      <ellipse cx={17} cy={43} rx={5.2} ry={4.6} fill="#fff" />
      <ellipse cx={47} cy={43} rx={5.2} ry={4.6} fill="#fff" />
      <ellipse cx={32} cy={44} rx={12} ry={9.5} fill="#fff" />
      <Brows left={16.6} top={27} stroke={FOX_DARK} />
      <Eyes cx1={22} cx2={42} cy={33.5} ink={FOX_INK} r={3.5} />
      <Nose x={32} y={45.5} size={2.5} fill={FOX_NOSE} />
      <Smile x={32} y={50} stroke={FOX_DARK} />
      <ellipse cx={20} cy={41} rx={3.1} ry={2.1} fill={FOX_BLUSH} opacity={0.85} />
      <ellipse cx={44} cy={41} rx={3.1} ry={2.1} fill={FOX_BLUSH} opacity={0.85} />
      <g className="whiskers" opacity={0.55}>
        <circle cx={24} cy={45.6} r={0.7} fill={FOX_DARK} />
        <circle cx={26.6} cy={47.2} r={0.7} fill={FOX_DARK} />
        <circle cx={23.3} cy={48.4} r={0.7} fill={FOX_DARK} />
        <circle cx={40} cy={45.6} r={0.7} fill={FOX_DARK} />
        <circle cx={37.4} cy={47.2} r={0.7} fill={FOX_DARK} />
        <circle cx={40.7} cy={48.4} r={0.7} fill={FOX_DARK} />
      </g>
    </svg>
  );
}

export function PandaFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx={15} cy={12} r={8} fill={PANDA_INK} />
      <circle cx={49} cy={12} r={8} fill={PANDA_INK} />
      <circle cx={15} cy={12} r={3.6} fill={PANDA_INK2} />
      <circle cx={49} cy={12} r={3.6} fill={PANDA_INK2} />
      <HeadShape fill="#fff" stroke={PANDA_OUT} strokeWidth={1.6} />
      <ellipse
        cx={22}
        cy={33.5}
        rx={7.2}
        ry={8.8}
        fill={PANDA_INK}
        transform="rotate(13 22 33.5)"
      />
      <ellipse
        cx={42}
        cy={33.5}
        rx={7.2}
        ry={8.8}
        fill={PANDA_INK}
        transform="rotate(-13 42 33.5)"
      />
      <g className="eyes">
        <circle cx={22} cy={33.5} r={3.5} fill="#fff" />
        <circle cx={42} cy={33.5} r={3.5} fill="#fff" />
        <circle cx={23} cy={33.5} r={1.9} fill={PANDA_INK} />
        <circle cx={41} cy={33.5} r={1.9} fill={PANDA_INK} />
        <circle cx={23.7} cy={32.3} r={0.9} fill="#fff" />
        <circle cx={40.3} cy={32.3} r={0.9} fill="#fff" />
      </g>
      <Brows left={15} top={22.5} stroke={PANDA_INK} cls="panda-brows" />
      <Nose x={32} y={45} size={2.6} fill={PANDA_INK} />
      <Smile x={32} y={49.4} stroke="#55565c" />
      <ellipse cx={16.5} cy={42.5} rx={3.3} ry={2.5} fill={PANDA_BLUSH} opacity={0.9} />
      <ellipse cx={47.5} cy={42.5} rx={3.3} ry={2.5} fill={PANDA_BLUSH} opacity={0.9} />
    </svg>
  );
}

export function BearFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx={14.5} cy={11} r={8.5} fill={BEAR_DK} />
      <circle cx={49.5} cy={11} r={8.5} fill={BEAR_DK} />
      <circle cx={14.5} cy={11} r={4.2} fill={BEAR} />
      <circle cx={49.5} cy={11} r={4.2} fill={BEAR} />
      <HeadShape fill={BEAR} />
      <ellipse cx={32} cy={43} rx={12.5} ry={9.5} fill={BEAR_LT} />
      <Eyes cx1={22} cx2={42} cy={33} ink="#261708" r={3.1} />
      <Nose x={32} y={45} size={2.8} fill="#261708" />
      <Smile x={32} y={50} stroke="#7c4a12" />
      <ellipse cx={19.5} cy={40.5} rx={3} ry={2.1} fill="#e7a9a0" opacity={0.6} />
      <ellipse cx={44.5} cy={40.5} rx={3} ry={2.1} fill="#e7a9a0" opacity={0.6} />
    </svg>
  );
}

export function HawkFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 9 L24 3 L30 9 Z" fill={HAWK_DK} />
      <path d="M34 9 L40 3 L46 9 Z" fill={HAWK_DK} />
      <path d="M26 8 L32 4 L38 8 Z" fill={HAWK} />
      <HeadShape fill={HAWK} />
      <path d="M13 30 l7 -3.5 l7 3.5" fill="none" stroke={HAWK_CREAM} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M37 30 l7 -3.5 l7 3.5" fill="none" stroke={HAWK_CREAM} strokeWidth="3.4" strokeLinecap="round" />
      <g className="eyes">
        <circle cx={22.5} cy={33.5} r={4} fill={HAWK_GOLD} />
        <circle cx={41.5} cy={33.5} r={4} fill={HAWK_GOLD} />
        <circle cx={22.5} cy={33.5} r={2} fill="#261708" />
        <circle cx={41.5} cy={33.5} r={2} fill="#261708" />
        <circle cx={23.3} cy={32.4} r={0.9} fill="#fff" />
        <circle cx={40.7} cy={32.4} r={0.9} fill="#fff" />
      </g>
      <path
        d="M 26 40 q 6 4 12 0 q -2 11 -6 13.5 q -4 -2.5 -6 -13.5 z"
        fill={HAWK_GOLD}
      />
      <path d="M 32 49.5 v 2.6" stroke={HAWK_DK} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SnakeFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx={32} cy={34} r={25} fill={SNAKE} />
      <circle cx={15} cy={36} r={4.6} fill={SNAKE_LT} opacity={0.5} />
      <circle cx={49} cy={36} r={4.6} fill={SNAKE_LT} opacity={0.5} />
      <g className="eyes">
        <circle cx={22} cy={31} r={4.4} fill="#fffbe6" />
        <circle cx={42} cy={31} r={4.4} fill="#fffbe6" />
        <ellipse cx={22} cy={31} rx={1.4} ry={3} fill="#1c1917" />
        <ellipse cx={42} cy={31} rx={1.4} ry={3} fill="#1c1917" />
        <circle cx={23} cy={29.6} r={1.1} fill="#fff" />
        <circle cx={41} cy={29.6} r={1.1} fill="#fff" />
      </g>
      <path d="M 32 21 q 2 2 0 4" fill="none" stroke={SNAKE_DK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={18} cy={44} r={1.4} fill={SNAKE_LT} opacity={0.85} />
      <circle cx={26} cy={48} r={1.4} fill={SNAKE_LT} opacity={0.85} />
      <circle cx={38} cy={48} r={1.4} fill={SNAKE_LT} opacity={0.85} />
      <circle cx={46} cy={44} r={1.4} fill={SNAKE_LT} opacity={0.85} />
      <circle cx={29} cy={42} r={1.2} fill={SNAKE_DK} opacity={0.6} />
      <circle cx={35} cy={42} r={1.2} fill={SNAKE_DK} opacity={0.6} />
      <path d="M 28.5 49 q 3.5 4.6 7 0" fill="none" stroke={SNAKE_LT} strokeWidth="3" strokeLinecap="round" />
      <path d="M 32 49 v 4.6 M 32 53.6 l -2.8 2 M 32 53.6 l 2.8 2" fill="none" stroke="#dc2626" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- FULL BODY MASCOTS ---------------- */

export function Fox({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g className="fox-tail">
        <path
          d="M 62 96 C 86 70 108 74 112 94 C 114 108 98 118 78 112 Z"
          fill={FOX}
        />
        <path
          d="M 98 86 C 106 82 113 88 111 94 C 109 101 102 102 96 99 Z"
          fill="#fff"
        />
      </g>
      <ellipse cx={30} cy={114} rx={8} ry={4.6} fill={FOX_DARK} />
      <ellipse cx={58} cy={114} rx={8} ry={4.6} fill={FOX_DARK} />
      <ellipse cx={50} cy={92} rx={31} ry={26} fill={FOX} />
      <ellipse cx={47} cy={97} rx={19} ry={16} fill="#fff7ed" />
      <ellipse cx={36} cy={84} rx={7} ry={5.5} fill={FOX_DARK} />
      <ellipse cx={63} cy={84} rx={7} ry={5.5} fill={FOX_DARK} />
      <svg x="16" y="4" width="72" height="72" viewBox="0 0 64 64">
        <FoxFace />
      </svg>
      <g className="fox-shades">
        <rect x="33" y="41" width="15" height="11" rx="5.5" fill="#1f2937" />
        <rect x="56" y="41" width="15" height="11" rx="5.5" fill="#1f2937" />
        <rect x="48" y="43" width="8" height="4.5" rx="2.2" fill="#1f2937" />
        <circle cx="36" cy="47" r="1.7" fill="#fff" />
        <circle cx="67" cy="47" r="1.7" fill="#fff" />
        <path d="M 40 56 q 9 4 18 0" fill="none" stroke={FOX_URE} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Panda({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx={37} cy={114} rx={9} ry={5} fill={PANDA_INK} />
      <ellipse cx={77} cy={114} rx={9} ry={5} fill={PANDA_INK} />
      <ellipse cx={60} cy={98} rx={31} ry={25} fill="#fff" stroke={PANDA_OUT} strokeWidth="1.6" />
      <path d="M 33 95 c 1 -12 13 -18 23 -10 l 3 12 h -32 z" fill={PANDA_INK} />
      <path d="M 87 95 c -1 -12 -13 -18 -23 -10 l -3 12 h 32 z" fill={PANDA_INK} />
      <ellipse cx={32} cy={94} rx={8} ry={6} fill={PANDA_INK} transform="rotate(-14 32 94)" />
      <ellipse cx={88} cy={94} rx={8} ry={6} fill={PANDA_INK} transform="rotate(14 88 94)" />
      <g className="panda-pad">
        <rect x="52" y="99" width="26" height="15" rx="7.5" fill="#0ea5e9" />
        <rect x="56" y="103" width="6" height="7" rx="2" fill="#7dd3fc" />
        <circle cx="69" cy="105" r="2.3" fill="#fff" />
        <circle cx="72.5" cy="108" r="2.3" fill="#fff" />
      </g>
      <svg x="30" y="14" width="60" height="60" viewBox="0 0 64 64">
        <PandaFace />
      </svg>
    </svg>
  );
}