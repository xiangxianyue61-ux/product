<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="任务编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="流程名称">
                    <a-input v-model:value="searchForm.flowName" placeholder="请输入内容" style="width: 220px" />
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
            <a-space>
                <a-button type="primary" @click="noop" disabled>新增</a-button>
                <a-button @click="noop" disabled>编辑</a-button>
                <a-button danger @click="noop" disabled>删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="noop">导出</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table :columns="columns" :data-source="tableData" :pagination="false" row-key="id" :scroll="{ x: 1400 }">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <span class="text-red-500 font-medium">{{ record.status }}</span>
                    </template>
                    <template v-else-if="column.key === 'binding'">
                        <a class="text-blue-500" @click="noop">{{ record.binding }}</a>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a-popconfirm title="确定通过此任务吗？" @confirm="handleComplete(record.code, true)">
                                <a class="text-blue-500">通过</a>
                            </a-popconfirm>
                            <a-divider type="vertical" />
                            <a-popconfirm title="确定拒绝此任务吗？" @confirm="handleComplete(record.code, false)">
                                <a class="text-red-500">拒绝</a>
                            </a-popconfirm>
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
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { getMyTasks, completeTask } from '../../api/modules/workflow';

type Row = {
    id: string;
    code: string;
    name: string;
    node: string;
    todoType: string;
    startTime: string;
    deadline: string;
    sponsor: string;
    status: string;
    binding: string;
};

const searchForm = reactive({ code: '', flowName: '' });
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '任务ID', dataIndex: 'code', key: 'code', width: 220 }, // Changed width for UUID
    { title: '流程名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '当前节点', dataIndex: 'node', key: 'node', width: 140 },
    { title: '流程标识', dataIndex: 'todoType', key: 'todoType', width: 120 },
    { title: '发起时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
    { title: '最晚处理时间', dataIndex: 'deadline', key: 'deadline', width: 180 },
    { title: '发起人', dataIndex: 'sponsor', key: 'sponsor', width: 120 },
    { title: '处理状态', key: 'status', width: 120 },
    { title: '绑定业务', key: 'binding', width: 140 },
    { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

const loadData = async () => {
    try {
        const res = await getMyTasks();
        if (res.data && res.data.success) {
            tableData.value = res.data.data.map((item: any) => ({
                id: item.taskId,
                code: item.taskId,
                name: item.processName,
                node: item.currentNodeName || item.currentNodeId,
                todoType: item.processKey,
                startTime: new Date(item.createdAt).toLocaleString(),
                deadline: '无',
                sponsor: item.initiator?.name || '未知',
                status: '待处理',
                binding: item.businessKey || '',
            }));
            pagination.total = tableData.value.length;
        }
    } catch (e) {
        console.error('Failed to load tasks:', e);
        // message.error('加载任务失败');
    }
};

const handleComplete = async (taskId: string, pass: boolean) => {
    try {
        const res = await completeTask(taskId, {
            pass,
            comment: pass ? 'Approved' : 'Rejected',
        });
        if (res.data && res.data.success) {
            message.success('操作成功');
            loadData();
        } else {
            message.error(res.data?.message || '操作失败');
        }
    } catch (e) {
        console.error(e);
        message.error('操作失败');
    }
};

const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.flowName = '';
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

const noop = () => message.info('功能开发中');

onMounted(() => loadData());
</script>
