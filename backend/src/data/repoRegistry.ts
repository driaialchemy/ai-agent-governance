export interface RegisteredRepo {
  id: string;
  name: string;
  url: string;
  language: string;
  type: string;
  description?: string;
}

export const registeredRepos: RegisteredRepo[] = [
  {
    id: 'contractriskreviewpipeline',
    name: 'Contract Risk Review Pipeline',
    url: 'https://github.com/driaialchemy/contractriskreviewpipeline',
    language: 'TypeScript/Python',
    type: 'Contract Analysis',
    description: 'Reviews contracts for risk'
  },
  {
    id: 'contract-risk-review-pipeline',
    name: 'Contract Risk Review Pipeline v2',
    url: 'https://github.com/driaialchemy/contract-risk-review-pipeline',
    language: 'TypeScript/Python',
    type: 'Contract Analysis',
    description: 'Contract review with risk assessment'
  },
  {
    id: 'workeragentcowork',
    name: 'Worker Agent',
    url: 'https://github.com/driaialchemy/workeragentcowork',
    language: 'TypeScript',
    type: 'Work Orchestration',
    description: 'Coordinates work tasks'
  },
  {
    id: 'fishhatchery',
    name: 'Fish Hatchery',
    url: 'https://github.com/driaialchemy/fishhatchery',
    language: 'Unknown',
    type: 'Agent',
    description: 'Aquaculture management'
  },
  {
    id: 'Agent-Workflow-Review',
    name: 'Agent Workflow Review',
    url: 'https://github.com/driaialchemy/Agent-Workflow-Review',
    language: 'Unknown',
    type: 'Workflow Analysis',
    description: 'Reviews agent workflows'
  },
  {
    id: 'Device-Lifecycle-Intelligence-Platform-DLIP-',
    name: 'Device Lifecycle Intelligence Platform',
    url: 'https://github.com/driaialchemy/Device-Lifecycle-Intelligence-Platform-DLIP-',
    language: 'Unknown',
    type: 'Device Analysis',
    description: 'Analyzes smartwatch/device lifecycle'
  },
  {
    id: 'jobseeker',
    name: 'Job Seeker',
    url: 'https://github.com/driaialchemy/jobseeker',
    language: 'Unknown',
    type: 'Job Search',
    description: 'Helps search for jobs'
  },
  {
    id: 'ai-agent-research-emailer',
    name: 'AI Agent Research Emailer',
    url: 'https://github.com/driaialchemy/ai-agent-research-emailer',
    language: 'Unknown',
    type: 'Research/Email',
    description: 'Performs research and sends emails'
  }
];

export function getRepoById(id: string): RegisteredRepo | undefined {
  return registeredRepos.find(repo => repo.id === id);
}

export function getAllRepos(): RegisteredRepo[] {
  return registeredRepos;
}
