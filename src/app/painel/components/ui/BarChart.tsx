'use client';

import { useState } from 'react';

export interface BarSeries {
  name: string;
  color: string; // token CSS, ex.: 'var(--jm-chart-1)'
}

export interface BarDatum {
  label: string;
  values: number[];
  muted?: boolean; // ex.: meses futuros (previsto) com opacidade menor
  hint?: string;
}

// Gráfico de barras agrupadas (1–2 séries), eixo único, tooltip por grupo e tabela acessível.
export function BarChart({
  data,
  series,
  format = (v) => String(v),
  height = 180,
  title,
}: {
  data: BarDatum[];
  series: BarSeries[];
  format?: (v: number) => string;
  height?: number;
  title: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const ticks = [max, max / 2, 0];

  return (
    <figure className="space-y-2" aria-label={title}>
      {series.length >= 2 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-jm-fg2">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="relative flex gap-2">
        {/* Eixo Y recessivo */}
        <div className="flex shrink-0 flex-col justify-between py-0 text-right text-[10px] tabular-nums text-jm-muted" style={{ height }}>
          {ticks.map((t, i) => (
            <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {format(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height }}>
            {ticks.map((_, i) => (
              <div key={i} className={`border-t ${i === ticks.length - 1 ? 'border-jm-border-strong' : 'border-dashed border-jm-border'}`} />
            ))}
          </div>

          <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.label}
                className={`relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center gap-[2px] rounded-[3px] px-[2px] ${
                  hover === i ? 'bg-jm-hover' : ''
                }`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${d.label}: ${series.map((s, si) => `${s.name} ${format(d.values[si] || 0)}`).join(', ')}`}
              >
                {series.map((s, si) => {
                  const v = d.values[si] || 0;
                  return (
                    <div
                      key={s.name}
                      className="w-full max-w-[18px] rounded-t-[4px]"
                      style={{
                        height: `${Math.max(v > 0 ? 2 : 0, (v / max) * 100)}%`,
                        background: s.color,
                        opacity: d.muted ? 0.45 : 1,
                      }}
                    />
                  );
                })}

                {hover === i && (
                  <div
                    className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max min-w-[140px] rounded-[4px] border border-jm-border bg-jm-surface px-3 py-2 text-xs shadow-jm-pop ${
                      i > data.length / 2 ? 'right-0' : 'left-0'
                    }`}
                  >
                    <p className="mb-1 font-semibold text-jm-fg">
                      {d.label}
                      {d.hint ? <span className="font-normal text-jm-muted"> · {d.hint}</span> : null}
                    </p>
                    {series.map((s, si) => (
                      <p key={s.name} className="flex items-center justify-between gap-4 text-jm-fg2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-[2px]" style={{ background: s.color }} />
                          {s.name}
                        </span>
                        <span className="font-medium tabular-nums text-jm-fg">{format(d.values[si] || 0)}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rótulos do eixo X: mostra no máximo ~12 para não colidir */}
          <div className="mt-1 flex gap-[2px]">
            {data.map((d, i) => {
              const step = Math.ceil(data.length / 12);
              return (
                <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-jm-muted">
                  {i % step === 0 ? d.label : ''}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela equivalente para leitores de tela */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Período</th>
            {series.map((s) => (
              <th key={s.name}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              {series.map((s, si) => (
                <td key={s.name}>{format(d.values[si] || 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
