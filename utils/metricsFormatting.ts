
import { BodyMetrics } from '../types';

export const formatBodyMetricsForPrompt = (metrics?: BodyMetrics): string => {
  if (!metrics || metrics.occlusionLevel === 'HIGH' || !metrics.ratios) return "";

  const clauses: string[] = [];

  if (metrics.ratios.shoulderToHip !== undefined) {
    const ratio = metrics.ratios.shoulderToHip;
    if (ratio > 1.4) clauses.push("broad shoulders relative to hips");
    else if (ratio < 0.9) clauses.push("hips wider than shoulders");
    else clauses.push("balanced shoulder-to-hip ratio");
  }

  if (metrics.ratios.torsoToLeg !== undefined && metrics.fullBodyVisible) {
    const ratio = metrics.ratios.torsoToLeg;
    if (ratio > 1.1) clauses.push("longer torso relative to legs");
    else if (ratio < 0.9) clauses.push("long legs relative to torso");
  }

  if (metrics.ratios.armToTorso !== undefined) {
    const ratio = metrics.ratios.armToTorso;
    if (ratio > 1.2) clauses.push("long arms");
  }

  if (clauses.length === 0) return "";

  return `STRUCTURAL CONSISTENCY: Preserve the subject's proportions (${clauses.join(", ")}).`;
};
