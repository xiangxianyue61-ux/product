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
            <a-alert message="显示待您审批的任务列表，点击通过/拒绝按钮进行审批操作" type="info" show-icon />
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :loading="loading"
                row-key="instanceId"
                :scroll="{ x: 1600 }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'businessKey'">
                        <span>{{ record.businessKey || record.instanceId.substring(0, 8) }}</span>
                    </template>
                    <template v-else-if="column.key === 'initiator'">
                        <span>{{ record.initiator?.realName || record.initiator?.username || '-' }}</span>
                    </template>
                    <template v-else-if="column.key === 'createdAt'">
                        <span>{{ formatDate(record.createdAt) }}</span>
                    </template>
                    <template v-else-if="column.key === 'variables'">
                        <span class="text-sm">{{ formatVariables(record.variables) }}</span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a class="text-blue-500" @click="handleViewDetail(record)">详情</a>
                            <a-divider type="vertical" />
                            <a class="text-green-500" @click="handleApprove(record)">通过</a>
                            <a-divider type="vertical" />
                            <a class="text-red-500" @click="handleReject(record)">拒绝</a>
                        </a-space>
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
import { onMounted, reactive, ref, h } from 'vue';
import { message, Modal, Textarea } from 'ant-design-vue';
import { getMyTasks, completeTask, type WorkflowTask } from './api/index';
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
    { title: '流程编号', key: 'businessKey', width: 180 },
    { title: '流程名称', dataIndex: 'processName', key: 'processName', width: 200 },
    { title: '当前节点', dataIndex: 'currentNodeName', key: 'currentNodeName', width: 150 },
    { title: '流程类型', dataIndex: 'processKey', key: 'processKey', width: 150 },
    { title: '发起人', key: 'initiator', width: 120 },
    { title: '发起时间', key: 'createdAt', width: 180 },
    { title: '业务数据', key: 'variables', width: 200 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

const tableData = ref<WorkflowTask[]>([]);
const loading = ref(false);
const selectedInstanceId = ref<string | null>(null);

const loadData = async () => {
    loading.value = true;
    try {
        const res = await getMyTasks();
        if (res.data && res.data.success) {
            // 只显示当前用户是审批人的任务
            tableData.value = res.data.data.filter((item: any) => item.isCurrentApprover);
            pagination.total = tableData.value.length;
        }
    } catch (e) {
        console.error('Failed to load tasks:', e);
        message.error('加载任务失败');
    } finally {
        loading.value = false;
    }
};

const handleApprove = (record: WorkflowTask) => {
    let comment = '';
    Modal.confirm({
        title: '审批通过',
        content: () =>
            h('div', [
                h('p', { class: 'mb-2' }, '确定要通过这个审批吗？'),
                h(Textarea, {
                    value: comment,
                    'onUpdate:value': (val: string) => {
                        comment = val;
                    },
                    placeholder: '请输入审批意见（可选）',
                    rows: 3,
                }),
            ]),
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
            try {
                const res = await completeTask(record.instanceId, {
                    pass: true,
                    comment: comment || '同意',
                });
                if (res.data && res.data.success) {
                    message.success('审批通过');
                    await loadData();
                } else {
                    message.error(res.data?.message || '操作失败');
                }
            } catch (e: any) {
                console.error(e);
                message.error(e.response?.data?.message || '操作失败');
            }
        },
    });
};

const handleReject = (record: WorkflowTask) => {
    let comment = '';
    Modal.confirm({
        title: '审批拒绝',
        content: () =>
            h('div', [
                h('p', { class: 'mb-2 text-red-500' }, '确定要拒绝这个审批吗？'),
                h(Textarea, {
                    value: comment,
                    'onUpdate:value': (val: string) => {
                        comment = val;
                    },
                    placeholder: '请输入拒绝理由',
                    rows: 3,
                }),
            ]),
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
            if (!comment.trim()) {
                message.warning('请输入拒绝理由');
                return Promise.reject();
            }
            try {
                const res = await completeTask(record.instanceId, {
                    pass: false,
                    comment: comment,
                });
                if (res.data && res.data.success) {
                    message.success('审批已拒绝');
                    await loadData();
                } else {
                    message.error(res.data?.message || '操作失败');
                }
            } catch (e: any) {
                console.error(e);
                message.error(e.response?.data?.message || '操作失败');
            }
        },
    });
};

const handleViewDetail = (record: WorkflowTask) => {
    selectedInstanceId.value = record.instanceId;
};

const handleCloseDetail = () => {
    selectedInstanceId.value = null;
};

const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatVariables = (variables: Record<string, any>) => {
    const keys = Object.keys(variables).filter(
        k => !['comment', 'pass', 'directManagerId', 'deptManagerId', 'ceoId', 'financeId'].includes(k)
    );
    if (keys.length === 0) return '-';
    return keys.map(k => `${k}: ${variables[k]}`).join(', ');
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
