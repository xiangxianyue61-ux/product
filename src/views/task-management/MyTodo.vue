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
                        <a class="text-blue-500" @click="noop">详情</a>
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

type Row = {
    id: number;
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
const pagination = reactive({ current: 1, pageSize: 15, total: 56 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '任务编号', dataIndex: 'code', key: 'code', width: 160 },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '任务节点', dataIndex: 'node', key: 'node', width: 140 },
    { title: '待办类型', dataIndex: 'todoType', key: 'todoType', width: 120 },
    { title: '发起时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
    { title: '最晚处理时间', dataIndex: 'deadline', key: 'deadline', width: 180 },
    { title: '发起人', dataIndex: 'sponsor', key: 'sponsor', width: 120 },
    { title: '处理状态', key: 'status', width: 120 },
    { title: '绑定', key: 'binding', width: 140 },
    { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    code: `RWBH${String(i + 1).padStart(10, '0')}`,
    name: ['2025告警任务', '2025审批任务', '2025保养任务', '2025维修任务'][i % 4],
    node: '处理人',
    todoType: ['告警待办', '工艺流转卡审批', '保养待办', '维修待办'][i % 4],
    startTime: '2025.04.24 14:00:00',
    deadline: '2025.04.26 18:00:00',
    sponsor: '李民浩',
    status: '未处理',
    binding: i % 3 === 1 ? '工艺流转卡' : '',
}));

const loadData = () => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = mock.slice(start, end);
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

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
