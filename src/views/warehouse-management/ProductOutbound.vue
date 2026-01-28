<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="出库编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="物料名称">
                    <a-input v-model:value="searchForm.name" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">
                            <template #icon><SearchOutlined /></template>
                            查询
                        </a-button>
                        <a-button @click="handleReset">
                            <template #icon><ReloadOutlined /></template>
                            重置
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="noop">
                    <template #icon><PlusOutlined /></template>
                    新增
                </a-button>
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
            >
                <template #bodyCell="{ column }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">出库产品</a>
                            <span>|</span>
                            <a @click="noop">编辑</a>
                            <span>|</span>
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
                >
                    <template #buildOptionText="props">
                        <span>{{ props.value }}条/页</span>
                    </template>
                </a-pagination>
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number v-model:value="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';

type Row = {
    id: number;
    code: string;
    orderName: string;
    workOrder: string;
    customer: string;
    salesOrder: string;
    outboundDate: string;
    remark: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);

const pagination = reactive({ current: 1, pageSize: 15, total: 56 });
const jumpPage = ref(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '出库编号', dataIndex: 'code', key: 'code', width: 160 },
    { title: '出库单名称', dataIndex: 'orderName', key: 'orderName', width: 140 },
    { title: '生产工单', dataIndex: 'workOrder', key: 'workOrder', width: 120 },
    { title: '客户名称', dataIndex: 'customer', key: 'customer', width: 160 },
    { title: '销售订单', dataIndex: 'salesOrder', key: 'salesOrder', width: 120 },
    { title: '出库日期', dataIndex: 'outboundDate', key: 'outboundDate', width: 120 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 80 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

const allData = ref<Row[]>([]);
const tableData = ref<Row[]>([]);

const customers = ['霍的微漠有限公司', '智造科技公司', '精益供应链'];
const orderNames = ['比亚为产品出库', '笔记本电脑出库', '台式机出库'];

const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    code: `CPCK${String(i + 1).padStart(10, '0')}`,
    orderName: orderNames[i % 3],
    workOrder: 'SCGD0000001',
    customer: customers[i % 3],
    salesOrder: 'XSDD0000001',
    outboundDate: '2025.05.01',
    remark: '无',
}));

const filterData = () => {
    let list = [...mock];
    if (searchForm.code.trim()) {
        const q = searchForm.code.trim().toLowerCase();
        list = list.filter(r => r.code.toLowerCase().includes(q));
    }
    if (searchForm.name.trim()) {
        const q = searchForm.name.trim();
        list = list.filter(r => r.orderName.includes(q));
    }
    return list;
};

const loadData = () => {
    const filtered = filterData();
    pagination.total = filtered.length;
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    allData.value = filtered;
    tableData.value = filtered.slice(start, end);
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
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

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
