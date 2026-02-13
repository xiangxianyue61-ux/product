<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="流程类型">
                    <a-input v-model:value="searchForm.processKey" placeholder="请输入流程类型" style="width: 220px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <a-card class="mb-4" :bordered="false">
            <a-alert message="显示您已处理的所有审批任务历史记录" type="info" show-icon />
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :loading="loading"
                row-key="instanceId"
                :scroll="{ x: 1500 }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'businessKey'">
                        <span>{{ record.businessKey || record.instanceId.substring(0, 8) }}</span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <span :class="getActionColor(record.action)" class="font-medium">
                            {{ getActionText(record.action) }}
                        </span>
                    </template>
                    <template v-else-if="column.key === 'processedAt'">
                        <span>{{ formatDate(record.processedAt) }}</span>
                    </template>
                    <template v-else-if="column.key === 'initiator'">
                        <span>{{ record.initiator?.realName || record.initiator?.username || '-' }}</span>
                    </template>
                    <template v-else-if="column.key === 'status'">
                        <span :class="getStatusColor(record.status)" class="font-medium">
                            {{ getStatusText(record.status) }}
                        </span>
                    </template>
                    <template v-else-if="column.key === 'operation'">
                        <a class="text-blue-500" @click="handleViewDetail(record)">详情</a>
                    </template>
                </template>
            </a-table>

            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="total => `共${total}条`"
                    :page-size-options="['15', '30', '50', '100']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
            </div>
        </a-card>

        <WorkflowDetailModal :instance-id="selectedInstanceId" @close="handleCloseDetail" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { getMyProcessed, type ProcessedTask } from './api/index';
import WorkflowDetailModal from './components/WorkflowDetailModal.vue';
import dayjs from 'dayjs';

const searchForm = reactive({ processKey: '' });
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '流程编号', dataIndex: 'businessKey', key: 'businessKey', width: 180 },
    { title: '流程名称', dataIndex: 'processName', key: 'processName', width: 180 },
    { title: '任务节点', dataIndex: 'taskName', key: 'taskName', width: 150 },
    { title: '处理动作', key: 'action', width: 120 },
    { title: '审批意见', dataIndex: 'comment', key: 'comment', width: 200 },
    { title: '处理时间', key: 'processedAt', width: 180 },
    { title: '发起人', key: 'initiator', width: 120 },
    { title: '流程状态', key: 'status', width: 120 },
    { title: '操作', key: 'operation', width: 120, fixed: 'right' },
];

const tableData = ref<ProcessedTask[]>([]);
const loading = ref(false);
const selectedInstanceId = ref<string | null>(null);

const loadData = async () => {
    loading.value = true;
    try {
        const res = await getMyProcessed({
            processKey: searchForm.processKey || undefined,
            page: pagination.current,
            limit: pagination.pageSize,
        });

        if (res.data.success) {
            tableData.value = res.data.data;
            pagination.total = res.data.total;
        } else {
            message.error('加载数据失败');
        }
    } catch (error) {
        console.error('Load my processed error:', error);
        message.error('加载数据失败');
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    pagination.current = 1;
    loadData();
};

const handleReset = () => {
    searchForm.processKey = '';
    pagination.current = 1;
    loadData();
};

const handleViewDetail = (record: ProcessedTask) => {
    selectedInstanceId.value = record.instanceId;
};

const handleCloseDetail = () => {
    selectedInstanceId.value = null;
};

const getActionText = (action: string) => {
    const texts: Record<string, string> = {
        complete: '完成',
        approve: '批准',
        'auto-approve': '自动批准',
        reject: '拒绝',
        'auto-reject': '自动拒绝',
    };
    return texts[action] || action;
};

const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
        complete: 'text-blue-500',
        approve: 'text-green-500',
        'auto-approve': 'text-cyan-500',
        reject: 'text-red-500',
        'auto-reject': 'text-orange-500',
    };
    return colors[action] || 'text-gray-500';
};

const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
        active: '进行中',
        completed: '已完成',
        terminated: '已终止',
    };
    return texts[status] || status;
};

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        active: 'text-blue-500',
        completed: 'text-green-500',
        terminated: 'text-red-500',
    };
    return colors[status] || 'text-gray-500';
};

const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    loadData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    loadData();
};

onMounted(() => loadData());
</script>
