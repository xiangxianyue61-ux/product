import http from '../../../api/http/index';

// Workflow Task Types
export interface WorkflowTask {
    taskId: string;
    instanceId: string;
    processKey: string;
    processName: string;
    currentNodeId: string;
    currentNodeName: string;
    currentNodeType: string;
    businessKey?: string;
    initiator?: {
        _id: string;
        username: string;
        realName: string;
    };
    variables: Record<string, any>;
    createdAt: string;
    isCurrentApprover: boolean;
}

export interface WorkflowInstance {
    instanceId: string;
    processKey: string;
    processName: string;
    businessKey?: string;
    status: 'active' | 'completed' | 'terminated';
    currentNodeName?: string;
    currentApprover?: {
        _id: string;
        username: string;
        realName: string;
    };
    variables: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    history?: Array<{
        nodeId: string;
        nodeName: string;
        nodeType: string;
        action: string;
        operator?: {
            _id: string;
            username: string;
            realName: string;
        };
        comment?: string;
        timestamp: string;
    }>;
    initiator?: {
        _id: string;
        username: string;
        realName: string;
    };
    definitionId?: {
        _id: string;
        name: string;
        key: string;
    };
}

export interface ProcessedTask {
    instanceId: string;
    processKey: string;
    processName: string;
    businessKey?: string;
    taskName: string;
    action: string;
    comment?: string;
    processedAt: string;
    initiator?: {
        _id: string;
        username: string;
        realName: string;
    };
    status: string;
    variables: Record<string, any>;
}

export interface CompleteTaskData {
    pass: boolean;
    comment?: string;
}

// 获取我的待办任务
export function getMyTasks() {
    return http.get('/api/workflow/tasks', {
        metadata: {
            action: 'task_todo',
        },
    });
}

// 完成任务（审批）
export function completeTask(instanceId: string, data: CompleteTaskData) {
    return http.post(
        `/api/workflow/tasks/${instanceId}/complete`,
        { variables: data }, // 包装在variables对象中
        {
            metadata: {
                action: 'task_complete',
            },
        }
    );
}

// 获取我发起的流程
export function getMyInitiated(params?: { status?: string; processKey?: string; page?: number; limit?: number }) {
    return http.get('/api/workflow/my-initiated', {
        params,
        metadata: {
            action: 'task_initiated',
        },
    });
}

// 获取我处理的任务
export function getMyProcessed(params?: { processKey?: string; page?: number; limit?: number }) {
    return http.get('/api/workflow/my-processed', {
        params,
        metadata: {
            action: 'task_processed',
        },
    });
}

// 获取流程实例详情
export function getInstanceDetail(instanceId: string) {
    return http.get(`/api/workflow/instances/${instanceId}`, {
        metadata: {
            action: 'task_detail',
        },
    });
}

// 启动流程
export function startWorkflow(data: { processKey: string; businessKey?: string; variables: Record<string, any> }) {
    return http.post('/api/workflow/start', data, {
        metadata: {
            action: 'workflow_start',
        },
    });
}

// 自动审批规则相关接口
export interface AutoApprovalRule {
    _id?: string;
    name: string;
    description?: string;
    processKey: string;
    nodeId: string;
    conditions: Array<{
        field: string;
        operator: string;
        value: any;
    }>;
    conditionLogic: 'AND' | 'OR';
    action: 'approve' | 'reject';
    autoComment?: string;
    priority: number;
    status: 'active' | 'inactive';
}

export function getAutoApprovalRules(params?: { processKey?: string; status?: string }) {
    return http.get('/api/workflow/auto-approval-rules', {
        params,
        metadata: {
            action: 'auto_approval_rules',
        },
    });
}

export function createAutoApprovalRule(data: AutoApprovalRule) {
    return http.post('/api/workflow/auto-approval-rules', data, {
        metadata: {
            action: 'auto_approval_rules',
        },
    });
}

export function updateAutoApprovalRule(id: string, data: AutoApprovalRule) {
    return http.put(`/api/workflow/auto-approval-rules/${id}`, data, {
        metadata: {
            action: 'auto_approval_rules',
        },
    });
}

export function deleteAutoApprovalRule(id: string) {
    return http.delete(`/api/workflow/auto-approval-rules/${id}`, {
        metadata: {
            action: 'auto_approval_rules',
        },
    });
}

export function toggleAutoApprovalRule(id: string) {
    return http.patch(`/api/workflow/auto-approval-rules/${id}/toggle`, null, {
        metadata: {
            action: 'auto_approval_rules',
        },
    });
}
