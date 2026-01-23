<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="流程编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="流程名称">
                    <a-input v-model:value="searchForm.name" placeholder="请输入内容" style="width: 220px" />
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
                <a-button type="primary" @click="noop">新增</a-button>
                <a-button @click="noop" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="noop" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="noop">导出</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
                :scroll="{ x: 1400 }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <span :class="record.status === '激活' ? 'text-green-600' : 'text-red-500'">
                            {{ record.status }}
                        </span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <a @click="noop">编辑</a>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
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

type Row = {
    id: number;
    code: string;
    flowId: string;
    key: string;
    category: string;
    name: string;
    version: string;
    status: string;
    deployTime: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);
const pagination = reactive({ current: 1, pageSize: 15, total: 56 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '流程编号', dataIndex: 'code', key: 'code', width: 140 },
    { title: '流程定义ID', dataIndex: 'flowId', key: 'flowId', width: 240 },
    { title: '流程标识Key', dataIndex: 'key', key: 'key', width: 160 },
    { title: '流程分类', dataIndex: 'category', key: 'category', width: 140 },
    { title: '流程名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '流程版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '状态', key: 'status', width: 100 },
    { title: '部署时间', dataIndex: 'deployTime', key: 'deployTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);
const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    code: 'LCBH0111111',
    flowId: 'PLM_FLOW_CARD_APP: 19:747be90f....',
    key: 'PLM_FLOW_CARD',
    category: '自定义业务',
    name: '工艺流转卡',
    version: 'V1.0',
    status: i % 4 === 0 ? '挂起' : '激活',
    deployTime: '2025.01.05 15:32:28',
}));

const loadData = () => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = mock.slice(start, end);
};

const onSelectChange = (keys: number[]) => (selectedRowKeys.value = keys);
const handleSearch = () => ((pagination.current = 1), loadData(), message.success('查询成功'));
const handleReset = () => ((searchForm.code = ''), (searchForm.name = ''), (pagination.current = 1), loadData());
const handlePageChange = (page: number) => ((pagination.current = page), loadData());
const handlePageSizeChange = (_current: number, size: number) => (
    (pagination.current = 1),
    (pagination.pageSize = size),
    loadData()
);
const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
