
import React from 'react';
import { FaceMetrics } from '../types';

interface FaceMetricsPanelProps {
  metrics: FaceMetrics;
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

const FaceMetricsPanel: React.FC<FaceMetricsPanelProps> = ({ metrics, className = "" }) => {
  return (
    <div className={`bg-black border border-gray-800 rounded p-4 font-mono ${className}`}>
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Face & Hair Metrics</h3>
        <span className="text-[9px] text-gray-600">v1.5</span>
      </div>

      <SectionHeader title="Pose & Alignment" />
      <div className="grid grid-cols-3 gap-2 mb-2">
         <div className="bg-gray-900 rounded p-1 text-center">
            <div className="text-[9px] text-gray-500">YAW</div>
            <div className="text-xs text-white">{metrics.pose.yawDeg.toFixed(1)}°</div>
         </div>
         <div className="bg-gray-900 rounded p-1 text-center">
            <div className="text-[9px] text-gray-500">PITCH</div>
            <div className="text-xs text-white">{metrics.pose.pitchDeg.toFixed(1)}°</div>
         </div>
         <div className="bg-gray-900 rounded p-1 text-center">
            <div className="text-[9px] text-gray-500">ROLL</div>
            <div className="text-xs text-white">{metrics.pose.rollDeg.toFixed(1)}°</div>
         </div>
      </div>
      <MetricRow label="Confidence" value={(metrics.pose.confidence * 100).toFixed(0)} unit="%" />
      <MetricRow label="Face Coverage" value={(metrics.faceCoverageRatio * 100).toFixed(1)} unit="%" />

      <SectionHeader title="Hair Identity (Locked)" />
      {metrics.hairDescriptor && (
        <>
          <MetricRow label="Volume" value={metrics.hairDescriptor.volume.toUpperCase()} />
          <MetricRow label="Parting" value={metrics.hairDescriptor.partingLine.toUpperCase()} />
          <MetricRow label="Length" value={metrics.hairDescriptor.lengthCategory.toUpperCase()} />
          <div className="text-[9px] text-gray-600 mt-1 italic truncate">
            {metrics.hairDescriptor.silhouette}
          </div>
        </>
      )}

      <SectionHeader title="Structure Ratios" />
      <MetricRow label="Height : Width" value={metrics.ratios.faceHeightToWidth.toFixed(3)} />
      <MetricRow label="Nose : Face Width" value={metrics.ratios.noseWidth.toFixed(3)} />
      <MetricRow label="Mouth : Face Width" value={metrics.ratios.mouthWidth.toFixed(3)} />
      <MetricRow label="Eye Aspect (L)" value={metrics.ratios.eyeAspectRatioL.toFixed(3)} />
      <MetricRow label="Eye Aspect (R)" value={metrics.ratios.eyeAspectRatioR.toFixed(3)} />

      <SectionHeader title="Asymmetry Indicators" />
      <MetricRow label="Eye Openness Δ" value={metrics.asymmetry.eyeOpennessDelta.toFixed(4)} />
      <MetricRow label="Mouth Corner Δ" value={metrics.asymmetry.mouthCornerDelta.toFixed(4)} />

      {metrics.quality.warnings.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-800">
          <div className="text-[9px] text-gray-500 mb-1 uppercase">Warnings</div>
          {metrics.quality.warnings.map((w, i) => (
            <div key={i} className="text-[9px] text-yellow-500/80">• {w}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaceMetricsPanel;
