import type { Generation, GenerationMeta } from "@/lib/generation";

interface GenBadgeProps {
  gen: GenerationMeta;
  size?: 'sm' | 'md' | 'icon';
  className?: string;
}

const LABEL_CLASS: Partial<Record<Generation, string>> = {
  'Boomer': 'gen-badge-boomer',
  'Gen X': 'gen-badge-genx',
  'Gen Z': 'gen-badge-genz',
  'Gen Alpha': 'gen-badge-genalpha',
};

const GRADIENT_TEXT_LABELS: Generation[] = ['Gen X', 'Gen Z', 'Gen Alpha'];

export default function GenBadge({ gen, size = 'sm', className }: GenBadgeProps) {

  const fontSize = size === 'md' ? '10px' : '8px';

  // ── Icon variant ─────────────────────────────────────────────
  if (size === 'icon') {
    if (gen.tier === 'synthetic') {
      return (
        <span className="gen-badge-synth-icon" title={gen.display}>
          <span className="gen-badge-synth-icon-text">{gen.icon}</span>
        </span>
      );
    }
    if (gen.tier === 'millennial') {
      return (
        <span className={['gen-badge-holo-outer gen-badge-icon-size', className].filter(Boolean).join(' ')} title={gen.display}>
          <span className="gen-badge-holo-inner gen-badge-icon-inner">
            <span className="gen-badge-holo-text" style={{ fontSize: '7px' }}>{gen.icon}</span>
          </span>
        </span>
      );
    }
    if (gen.tier === 'zillennial') {
      return (
        <span className={['gen-badge-zillennial gen-badge-icon-size', className].filter(Boolean).join(' ')} title={gen.display}>
          <span className="gen-badge-zillennial-text" style={{ fontSize: '7px' }}>{gen.icon}</span>
        </span>
      );
    }
    // Standard icon
    const extraClass = LABEL_CLASS[gen.label] ?? '';
    const isGradientText = GRADIENT_TEXT_LABELS.includes(gen.label);
    return (
      <span
        className={['gen-badge-standard gen-badge-icon-size', extraClass, className].filter(Boolean).join(' ')}
        style={!extraClass ? { border: `1px solid ${gen.accentGlow}`, boxShadow: `0 0 4px ${gen.accentGlow}` } : undefined}
        title={gen.display}
      >
        <span
          className="gen-badge-standard-text"
          style={isGradientText ? { fontSize: '7px' } : { fontSize: '7px', color: gen.accentColor }}
        >
          {gen.icon}
        </span>
      </span>
    );
  }

  // ── Synthetic ────────────────────────────────────────────────
  if (gen.tier === 'synthetic') {
    return (
      <span
        className={['gen-badge-synth', className].filter(Boolean).join(' ')}
        style={{ fontSize }}
      >
        <span className="gen-badge-synth-text">{gen.display}</span>
      </span>
    );
  }

  // ── Millennial (holographic) ─────────────────────────────────
  if (gen.tier === 'millennial') {
    return (
      <span className={['gen-badge-holo-outer', className].filter(Boolean).join(' ')}>
        <span className="gen-badge-holo-inner">
          <span className="gen-badge-holo-text" style={{ fontSize }}>{gen.display}</span>
        </span>
      </span>
    );
  }

  // ── Zillennial (dark aurora) ─────────────────────────────────
  if (gen.tier === 'zillennial') {
    return (
      <span className={['gen-badge-holo-inner', className].filter(Boolean).join(' ')}>
        <span className="gen-badge-zillennial-text" style={{ fontSize }}>{gen.display}</span>
      </span>
    );
  }

  // ── Standard (Boomer, Gen X, Gen Z, Gen Alpha) ───────────────
  const extraClass = LABEL_CLASS[gen.label] ?? '';
  const isGradientText = GRADIENT_TEXT_LABELS.includes(gen.label);
  return (
    <span
      className={['gen-badge-standard', extraClass, className].filter(Boolean).join(' ')}
      style={!extraClass ? {
        border: `1px solid ${gen.accentGlow}`,
        boxShadow: `0 0 6px ${gen.accentGlow}`,
      } : undefined}
    >
      <span
        className="gen-badge-standard-text"
        style={isGradientText ? { fontSize } : { fontSize, color: gen.accentColor }}
      >
        {gen.display}
      </span>
    </span>
  );
}
