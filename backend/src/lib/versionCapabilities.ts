/**
 * Synthetic capability map for versions.
 * Avoids changing the registry schema while supporting spec capability checks.
 */
const versionCapabilitiesByVersionId: Record<string, string[]> = {
  "ver-001": ["review_policy_text", "read_internal_docs"],
  "ver-002": ["summarize_benchmarks", "read_internal_docs"],
  "ver-003": ["summarize_benchmarks", "read_internal_docs"],
  "ver-004": ["summarize_benchmarks", "read_internal_docs"]
};

export function getVersionCapabilities(versionId: string): string[] {
  return versionCapabilitiesByVersionId[versionId] ?? [];
}
