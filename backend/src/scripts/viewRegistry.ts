import { registryData } from "../data/registry";

console.log("Local synthetic registry loaded successfully.");
console.log("");
console.log("Agents:");
console.log(JSON.stringify(registryData.agents, null, 2));
console.log("");
console.log("Agent Versions:");
console.log(JSON.stringify(registryData.agentVersions, null, 2));