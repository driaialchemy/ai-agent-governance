/**
 * Synthetic capability map for versions.
 * Avoids changing the registry schema while supporting spec capability checks.
 */
const versionCapabilitiesByVersionId: Record<string, string[]> = {
  "ver-001": ["review_policy_text", "read_internal_docs"],
  "ver-002": ["summarize_benchmarks", "read_internal_docs"],
  "ver-003": ["summarize_benchmarks", "read_internal_docs"],
  "ver-004": ["summarize_benchmarks", "read_internal_docs"],
  "ver-101": ["scan_repository", "read_internal_docs"],
  "ver-102": ["scan_repository", "delete_files"],
  "ver-103": ["scan_repository", "read_internal_docs"],
  "ver-201": ["review_contract_clauses", "summarize_evidence"],
  "ver-202": ["review_contract_clauses", "summarize_evidence"],
  "ver-203": ["review_contract_clauses", "summarize_evidence"],
  "ver-301": ["classify_incident"],
  "ver-302": ["classify_incident", "restart_service"],
  "ver-303": ["classify_incident", "change_permissions"]
};

export function getVersionCapabilities(versionId: string): string[] {
  return versionCapabilitiesByVersionId[versionId] ?? [];
}
