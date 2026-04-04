export interface ChangePreviewData {
  toolCallId: string;
  messageId: string;
  filePath: string;
  fileName: string;
  toolName: string;
  changeType: 'added' | 'modified' | 'deleted';
  startLine: number;
  endLine: number;
  diffContent: string;
  additions: number;
  deletions: number;
  status: 'pending' | 'accepted' | 'rejected';
}
