import http from '../http/index';

export interface WorkflowTask {
    taskId: string;
    processName: string;
    processKey: string;
    businessKey?: string;
    currentNodeId: string;
    variables: Record<string, any>;
    initiator?: {
        name: string;
        username: string;
    };
    createdAt: string;
}

export interface AutoApprovalCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
    value: any;
}

export interface AutoApprovalRule {
    _id?: string;
    name: string;
    description?: string;
    processKey: string;
    nodeId?: string;
    conditions: AutoApprovalCondition[];
    conditionLogic: 'AND' | 'OR';
    action: 'approve' | 'reject';
    autoComment?: string;
    priority?: number;
    status: 'active' | 'inactive';
    createdBy?: {
        username: string;
        name: string;
    };
    updatedBy?: {
        username: string;
        name: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export function getMyTasks() {
    return http.get<{ success: boolean; data: WorkflowTask[] }>('/api/workflow/tasks');
}

export function completeTask(instanceId: string, variables: Record<string, any>) {
    return http.post(`/api/workflow/tasks/${instanceId}/complete`, { variables });
}

export function startWorkflow(processKey: string, variables: Record<string, any>) {
    return http.post('/api/workflow/start', { processKey, variables });
}

export function getAutoApprovalRules(params?: { processKey?: string; status?: string }) {
    return http.get<{ success: boolean; data: AutoApprovalRule[] }>('/api/workflow/auto-approval-rules', { params });
}

export function getAutoApprovalRule(id: string) {
    return http.get<{ success: boolean; data: AutoApprovalRule }>(`/api/workflow/auto-approval-rules/${id}`);
}

export function createAutoApprovalRule(
    data: Omit<AutoApprovalRule, '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>
) {
    return http.post<{ success: boolean; message: string; data: AutoApprovalRule }>(
        '/api/workflow/auto-approval-rules',
        data
    );
}

export function updateAutoApprovalRule(
    id: string,
    data: Partial<Omit<AutoApprovalRule, '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>>
) {
    return http.put<{ success: boolean; message: string; data: AutoApprovalRule }>(
        `/api/workflow/auto-approval-rules/${id}`,
        data
    );
}

export function deleteAutoApprovalRule(id: string) {
    return http.delete<{ success: boolean; message: string }>(`/api/workflow/auto-approval-rules/${id}`);
}

export function toggleAutoApprovalRule(id: string) {
    return http.patch<{ success: boolean; message: string; data: AutoApprovalRule }>(
        `/api/workflow/auto-approval-rules/${id}/toggle`
    );
}
