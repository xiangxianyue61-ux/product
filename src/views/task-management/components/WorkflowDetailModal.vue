<template>
    <a-modal v-model:open="visible" title="流程详情" width="900px" :footer="null" @cancel="handleClose">
        <a-spin :spinning="loading">
            <div v-if="instance" class="workflow-detail">
                <!-- 基本信息 -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">基本信息</h3>
                    <a-descriptions :column="2" bordered size="small">
                        <a-descriptions-item label="流程名称">{{ instance.processName }}</a-descriptions-item>
                        <a-descriptions-item label="流程编号">
                            {{ instance.businessKey || instance.instanceId }}
                        </a-descriptions-item>
                        <a-descriptions-item label="发起人">
                            {{ instance.initiator?.realName || instance.initiator?.username || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="发起时间">
                            {{ formatDate(instance.createdAt) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="当前状态">
                            <a-tag :color="getStatusColor(instance.status)">
                                {{ getStatusText(instance.status) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="当前节点">
                            <span class="font-medium" :class="getNodeStatusClass(instance.status)">
                                {{ getCurrentNodeDisplay() }}
                            </span>
                        </a-descriptions-item>
                        <a-descriptions-item label="当前审批人" v-if="instance.currentApprover">
                            {{ instance.currentApprover.realName || instance.currentApprover.username }}
                        </a-descriptions-item>
                        <a-descriptions-item label="更新时间">
                            {{ formatDate(instance.updatedAt) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </div>

                <!-- 业务数据 -->
                <div class="mb-6" v-if="instance.variables && Object.keys(getBusinessVariables()).length > 0">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">业务数据</h3>
                    <a-descriptions :column="2" bordered size="small">
                        <a-descriptions-item
                            v-for="(value, key) in getBusinessVariables()"
                            :key="key"
                            :label="formatVariableLabel(key)"
                        >
                            {{ formatVariableValue(value) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </div>

                <!-- 审批进度 -->
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">审批进度</h3>
                    <a-steps :current="getCurrentStep()" class="mb-6">
                        <a-step v-for="step in getApprovalSteps()" :key="step.key" :status="step.status">
                            <template #title>
                                <div class="flex items-center gap-2">
                                    <span>{{ step.title }}</span>
                                    <a-tag v-if="step.statusTag" :color="step.statusTag.color" size="small">
                                        {{ step.statusTag.text }}
                                    </a-tag>
                                </div>
                            </template>
                            <template #description v-if="step.description">
                                <div class="text-xs text-gray-500 mt-1">{{ step.description }}</div>
                            </template>
                        </a-step>
                    </a-steps>

                    <!-- 详细审批记录 -->
                    <div class="mt-6" v-if="getDetailedHistory().length > 0">
                        <h4 class="text-sm font-medium mb-3 text-gray-700">详细记录</h4>
                        <a-timeline size="small">
                            <a-timeline-item
                                v-for="(item, index) in getDetailedHistory()"
                                :key="index"
                                :color="getHistoryColor(item.action)"
                            >
                                <div class="text-sm">
                                    <span class="font-medium">{{ item.nodeName }}</span>
                                    <a-tag :color="getActionColor(item.action)" size="small" class="ml-2">
                                        {{ getActionText(item.action) }}
                                    </a-tag>
                                    <span class="text-gray-500 ml-2">{{ formatDate(item.timestamp) }}</span>
                                </div>
                                <div v-if="item.comment" class="text-xs text-gray-600 mt-1">
                                    意见：{{ item.comment }}
                                </div>
                            </a-timeline-item>
                        </a-timeline>
                    </div>
                </div>
            </div>
        </a-spin>
    </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { getInstanceDetail, type WorkflowInstance } from '../api/index';
import dayjs from 'dayjs';

const props = defineProps<{
    instanceId: string | null;
}>();

const emit = defineEmits<{
    close: [];
}>();

const visible = ref(false);
const loading = ref(false);
const instance = ref<WorkflowInstance | null>(null);

watch(
    () => props.instanceId,
    async newId => {
        if (newId) {
            visible.value = true;
            await loadDetail(newId);
        } else {
            visible.value = false;
            instance.value = null;
        }
    }
);

const loadDetail = async (id: string) => {
    loading.value = true;
    try {
        const res = await getInstanceDetail(id);
        if (res.data.success) {
            instance.value = res.data.data;
        } else {
            message.error('加载流程详情失败');
        }
    } catch (error) {
        console.error('Load instance detail error:', error);
        message.error('加载流程详情失败');
    } finally {
        loading.value = false;
    }
};

const handleClose = () => {
    emit('close');
};

const formatDate = (date: string | Date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        active: 'processing',
        completed: 'success',
        terminated: 'error',
    };
    return colors[status] || 'default';
};

const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
        active: '进行中',
        completed: '已完成',
        terminated: '已终止',
    };
    return texts[status] || status;
};

const getHistoryColor = (action: string) => {
    const colors: Record<string, string> = {
        start: 'blue',
        arrive: 'cyan',
        complete: 'green',
        approve: 'green',
        'auto-approve': 'green',
        reject: 'red',
        'auto-reject': 'red',
    };
    return colors[action] || 'gray';
};

const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
        start: 'blue',
        arrive: 'default',
        complete: 'success',
        approve: 'success',
        'auto-approve': 'cyan',
        reject: 'error',
        'auto-reject': 'warning',
    };
    return colors[action] || 'default';
};

const getActionText = (action: string) => {
    const texts: Record<string, string> = {
        start: '发起',
        arrive: '到达',
        complete: '完成',
        approve: '批准',
        'auto-approve': '自动批准',
        reject: '拒绝',
        'auto-reject': '自动拒绝',
    };
    return texts[action] || action;
};

const getBusinessVariables = () => {
    if (!instance.value?.variables) return {};

    const vars: Record<string, any> = {};
    const excludeKeys = ['comment', 'pass', 'directManagerId', 'deptManagerId', 'ceoId', 'financeId'];

    for (const [key, value] of Object.entries(instance.value.variables)) {
        if (!excludeKeys.includes(key) && value !== undefined && value !== null) {
            vars[key] = value;
        }
    }

    return vars;
};

const formatVariableLabel = (key: string) => {
    const labels: Record<string, string> = {
        days: '请假天数',
        reason: '原因',
        startDate: '开始日期',
        endDate: '结束日期',
        amount: '金额',
        item: '项目',
        type: '类型',
        applicant: '申请人',
        applicantDept: '申请部门',
    };
    return labels[key] || key;
};

const formatVariableValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

// 优化当前节点显示
const getCurrentNodeDisplay = () => {
    if (!instance.value) return '-';

    const { status, currentNodeName } = instance.value;

    if (status === 'completed') {
        return '✅ 流程已完成';
    } else if (status === 'terminated') {
        return '❌ 流程已终止';
    } else if (currentNodeName) {
        return `⏳ ${currentNodeName}`;
    }

    return '-';
};

// 当前节点状态样式
const getNodeStatusClass = (status: string) => {
    const classes: Record<string, string> = {
        active: 'text-blue-600',
        completed: 'text-green-600',
        terminated: 'text-red-600',
    };
    return classes[status] || 'text-gray-600';
};

// 生成审批步骤
const getApprovalSteps = () => {
    if (!instance.value) return [];

    const history = instance.value.history || [];
    const status = instance.value.status;

    // 定义审批步骤
    const steps = [
        {
            key: 'start',
            title: '发起申请',
            status: 'finish' as any,
            statusTag: null as any,
            description: '',
        },
        {
            key: 'teamLeader',
            title: '组长审批',
            status: 'wait' as any,
            statusTag: null as any,
            description: '',
        },
        {
            key: 'deptManager',
            title: '经理审批',
            status: 'wait' as any,
            statusTag: null as any,
            description: '',
        },
    ];

    // 根据历史记录更新步骤状态
    const teamLeaderHistory = history.find(
        h => h.nodeName?.includes('组长') && ['complete', 'approve', 'reject'].includes(h.action)
    );
    const deptManagerHistory = history.find(h => h.nodeName?.includes('经理') || h.nodeName?.includes('部门'));

    // 更新组长审批状态
    if (teamLeaderHistory) {
        if (teamLeaderHistory.action === 'reject') {
            steps[1].status = 'error';
            steps[1].statusTag = { color: 'red', text: '已拒绝' };
            steps[1].description = teamLeaderHistory.comment || '已拒绝';
        } else {
            steps[1].status = 'finish';
            steps[1].statusTag = { color: 'success', text: '已通过' };
            steps[1].description = formatDate(teamLeaderHistory.timestamp);
        }
    } else if (instance.value.currentNodeName?.includes('组长')) {
        steps[1].status = 'process';
        steps[1].statusTag = { color: 'processing', text: '待审批' };
    }

    // 更新部门经理审批状态
    if (deptManagerHistory) {
        if (deptManagerHistory.action === 'reject') {
            steps[2].status = 'error';
            steps[2].statusTag = { color: 'red', text: '已拒绝' };
            steps[2].description = deptManagerHistory.comment || '已拒绝';
        } else if (deptManagerHistory.action === 'complete' || deptManagerHistory.action === 'approve') {
            steps[2].status = 'finish';
            steps[2].statusTag = { color: 'success', text: '已通过' };
            steps[2].description = formatDate(deptManagerHistory.timestamp);
        }
    } else if (instance.value.currentNodeName?.includes('经理') || instance.value.currentNodeName?.includes('部门')) {
        steps[2].status = 'process';
        steps[2].statusTag = { color: 'processing', text: '待审批' };
    }

    // 如果流程已完成
    if (status === 'completed' && !steps.some(s => s.status === 'error')) {
        steps.forEach(s => {
            if (s.status === 'wait') s.status = 'finish';
        });
    }

    return steps;
};

// 获取当前步骤索引
const getCurrentStep = () => {
    const steps = getApprovalSteps();
    const currentIndex = steps.findIndex(s => s.status === 'process');
    return currentIndex >= 0 ? currentIndex : steps.length - 1;
};

// 获取详细历史记录（过滤掉arrive等冗余记录）
const getDetailedHistory = () => {
    if (!instance.value?.history) return [];

    return instance.value.history.filter(h =>
        ['start', 'complete', 'approve', 'reject', 'auto-approve', 'auto-reject'].includes(h.action)
    );
};
</script>

<style scoped>
.workflow-detail {
    max-height: 70vh;
    overflow-y: auto;
}

:deep(.ant-descriptions-item-label) {
    width: 120px;
    font-weight: 500;
}
</style>
