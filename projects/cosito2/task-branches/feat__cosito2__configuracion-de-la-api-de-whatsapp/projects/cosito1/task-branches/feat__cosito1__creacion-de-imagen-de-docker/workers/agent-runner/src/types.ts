export interface AgentTask {
  taskId: string
  projectId: string
  projectName: string
  agentType: 'frontend' | 'backend' | 'devops'
  taskType?: 'deploy'
  title: string
  description: string
  acceptanceCriteria: string[]
  epicTitle: string
  githubIssueNumber?: number
  githubBranch?: string
  // Deploy-specific fields (only when taskType === 'deploy')
  serverIp?: string
  sshUser?: string
  sshPass?: string
  domain?: string
}
