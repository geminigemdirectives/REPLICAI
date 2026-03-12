import React from 'react';
import { BodyMetrics } from '../types';

interface BodyMetricsPanelProps {
  metrics: BodyMetrics;
  className?: string;
}

const MetricRow: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
  <div className="flex justify-between items-center text-[10px] py-1 border-b border-gray-800 last:border-0">
    <span className="text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-gray-300 font-mono">
      {value}
      {unit && <span className="text-gray-600 ml-0.5">{unit}</span>}
    </span>
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-[10px] font-bold text-[var(--neon)] uppercase tracking-widest mt-3 mb-1">
    {title}
  </div>
);

const formatSafe = (num: number | undefined, digits = 2, fallback = "-"): string => {
  return (num !== undefined && num !== null && !isNaN(num)) ? num.toFixed(digits) : fallback;
};

const BodyMetricsPanel: React.FC<BodyMetricsPanelProps> = ({ metrics, className = "" }) => {
  // Safety check: if metrics passed is null (shouldn't be due to parent check, but just in case)
  if (!metrics) return null;

  return (
    <div className={`bg-black border border-gray-800 rounded p-4 font-mono ${className}`}>
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Body Metrics</h3>
        <span className="text-[9px] text-gray-600 uppercase">{metrics.source?.replace('_', ' ') || 'UNKNOWN'}</span>
      </div>

      <SectionHeader title="Visibility & Confidence" />
      {/* Fix: Directly access confidence on metrics as BodyMetrics does not have a pose object */}
      <MetricRow label="Confidence" value={formatSafe(metrics.confidence * 100, 0)} unit="%" />
      <MetricRow label="Full Body" value={metrics.flags?.fullBodyVisible ? "YES" : "NO"} />
      <MetricRow label="Upper Body Only" value={metrics.flags?.upperBodyOnly ? "YES" : "NO"} />
      <MetricRow label="Occlusion" value={metrics.flags?.heavyOcclusion ? "HIGH" : "LOW"} />

      <SectionHeader title="Proportions (Ratios)" />
      {/* Safe access to ratios with fallback */}
      <MetricRow label="Shoulder : Hip" value={formatSafe(metrics.ratios?.shoulderToHip)} />
      <MetricRow label="Torso : Leg" value={formatSafe(metrics.ratios?.torsoToLeg)} />
      <MetricRow label="Arm : Torso" value={formatSafe(metrics.ratios?.armToTorso)} />
      <MetricRow label="Shoulder : Height" value={formatSafe(metrics.ratios?.shoulderToHeightProxy, 3)} />

      {metrics.warnings && metrics.warnings.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-800">
          <div className="text-[9px] text-gray-500 mb-1 uppercase">Warnings</div>
          {metrics.warnings.map((w, i) => (
            <div key={i} className="text-[9px] text-yellow-500/80">• {w}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BodyMetricsPanel;