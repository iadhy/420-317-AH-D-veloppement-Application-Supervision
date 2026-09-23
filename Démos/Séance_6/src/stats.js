/**
 * Calcule les statistiques d'un tableau de mesures.
 * Cette fonction sera exposee par une route HTTP a la seance 3.
 */
export function computeStats(measures) {
  if (measures.length === 0) {
    return { count: 0, min: null, max: null, average: null };
  }

  const values = measures.map((measure) => measure.value);

  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)),
  };
}
