import {
  getAllAgents,
  getAgentById,
  getAllAgentVersions,
  getVersionsByAgentId,
  getVersionById
} from "../lib/registryLookup";

console.log("TEST 1: All agents");
console.log(JSON.stringify(getAllAgents(), null, 2));
console.log("");

console.log("TEST 2: Agent by ID = agent-001");
console.log(JSON.stringify(getAgentById("agent-001"), null, 2));
console.log("");

console.log("TEST 3: All agent versions");
console.log(JSON.stringify(getAllAgentVersions(), null, 2));
console.log("");

console.log("TEST 4: Versions for agent-002");
console.log(JSON.stringify(getVersionsByAgentId("agent-002"), null, 2));
console.log("");

console.log("TEST 5: Version by ID = ver-001");
console.log(JSON.stringify(getVersionById("ver-001"), null, 2));
console.log("");