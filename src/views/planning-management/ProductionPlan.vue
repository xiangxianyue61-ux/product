<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="计划编号">
                    <a-input v-model:value="searchForm.planNumber" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="产品名称">
                    <a-input v-model:value="searchForm.productName" placeholder="请输入内容" style="width: 220px" />
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

        <!-- 操作按钮区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="message.info('新增功能')">
                    <template #icon><PlusOutlined /></template>
                    新增
                </a-button>
                <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
                    <template #icon><EditOutlined /></template>
                    编辑
                </a-button>
                <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length === 0">
                    <template #icon><DeleteOutlined /></template>
                    删除
                </a-button>
                <a-button @click="message.info('打印功能')">
                    <template #icon><PrinterOutlined /></template>
                    打印
                </a-button>
                <a-button @click="message.info('导入功能')">
                    <template #icon><UploadOutlined /></template>
                    导入
                </a-button>
                <a-button @click="message.success('导出成功')">
                    <template #icon><DownloadOutlined /></template>
                    导出
                </a-button>
            </a-space>
        </a-card>

        <!-- 数据表格 -->
        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                :loading="loading"
                row-key="id"
                :scroll="{ x: 1400 }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'planStatus'">
                        <a-tag :color="statusColor(record.planStatus)">{{ record.planStatus }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleSchedule(record)">排程</a>
                            <a @click="handleEditRow(record)">编辑</a>
                            <a-popconfirm title="确定要删除这条记录吗？" @confirm="handleDeleteRow(record)">
                                <a style="color: #ff4d4f">删除</a>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <!-- 分页 -->
            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="(total: number) => `共${total}条`"
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
                    <a-input-number
                        v-model:value="jumpPage"
                        :min="1"
                        :max="Math.ceil(pagination.total / pagination.pageSize)"
                        style="width: 80px"
                    />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PrinterOutlined,
    UploadOutlined,
    DownloadOutlined,
} from '@ant-design/icons-vue';

type PlanStatus = '未开始' | '进行中' | '已完成';

interface ProductionPlanRow {
    id: number;
    planNumber: string;
    planStatus: PlanStatus;
    productNumber: string;
    productName: string;
    deliveryDate: string;
    productionQuantity: number;
    unit: string;
    urgencyLevel: string;
    salesOrderNumber: string;
}

const router = useRouter();

const searchForm = reactive({
    planNumber: '',
    productName: '',
});

const pagination = reactive({
    current: 1,
    pageSize: 15,
    total: 56,
});

const jumpPage = ref<number>(1);
const tableData = ref<ProductionPlanRow[]>([]);
const loading = ref(false);
const selectedRowKeys = ref<number[]>([]);

const statusColor = (s: PlanStatus) => {
    if (s === '未开始') return 'cyan';
    if (s === '进行中') return 'blue';
    return 'gray';
};

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '生产计划编号', dataIndex: 'planNumber', key: 'planNumber', width: 170 },
    { title: '计划状态', key: 'planStatus', width: 100 },
    { title: '产品编号', dataIndex: 'productNumber', key: 'productNumber', width: 140 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 160 },
    { title: '计划交货日期', dataIndex: 'deliveryDate', key: 'deliveryDate', width: 120 },
    { title: '计划生产数量', dataIndex: 'productionQuantity', key: 'productionQuantity', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '紧急程度', dataIndex: 'urgencyLevel', key: 'urgencyLevel', width: 100 },
    { title: '销售订单号', dataIndex: 'salesOrderNumber', key: 'salesOrderNumber', width: 170 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const pad = (n: number, len = 6) => String(n).padStart(len, '0');
const toDateStrDot = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
};

const productPool = [
    { productNumber: 'CPBH000001', productName: '笔记本电脑', unit: '台' },
    { productNumber: 'CHBH000022', productName: 'ALEI手机', unit: '个' },
    { productNumber: 'CPBH000013', productName: '工业平板', unit: '台' },
    { productNumber: 'CPBH000008', productName: '智能手表', unit: '个' },
    { productNumber: 'CPBH000020', productName: '一体机', unit: '台' },
];
const urgencyPool = ['普通', '紧急', '非常紧急'];
const statusPool: PlanStatus[] = ['未开始', '进行中', '已完成'];

const mockData: ProductionPlanRow[] = Array.from({ length: 56 }, (_, idx) => {
    const i = idx + 1;
    const p = productPool[idx % productPool.length]!;
    const status = statusPool[(idx * 3) % statusPool.length]!;
    const base = new Date(2025, 0, 1);
    base.setDate(base.getDate() + idx * 4);
    const delivery = new Date(base);
    delivery.setDate(delivery.getDate() + 60 + ((idx * 11) % 40));

    return {
        id: i,
        planNumber: `SCJHDD${pad(i, 7)}`,
        planStatus: status,
        productNumber: p.productNumber,
        productName: p.productName,
        deliveryDate: toDateStrDot(delivery),
        productionQuantity: 200 + ((idx * 37) % 1200),
        unit: p.unit,
        urgencyLevel: urgencyPool[(idx * 7) % urgencyPool.length]!,
        salesOrderNumber: `XSDDH${pad(9000 + i, 8)}`,
    };
});

const loadData = () => {
    loading.value = true;
    setTimeout(() => {
        const keywordNo = searchForm.planNumber.trim();
        const keywordName = searchForm.productName.trim();

        const filtered = mockData.filter(item => {
            const okNo = !keywordNo || item.planNumber.includes(keywordNo);
            const okName = !keywordName || item.productName.includes(keywordName);
            return okNo && okName;
        });

        pagination.total = filtered.length;
        const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
        if (pagination.current > maxPage) pagination.current = maxPage;

        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        tableData.value = filtered.slice(start, end);
        loading.value = false;
    }, 300);
};

const handleSearch = () => {
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.planNumber = '';
    searchForm.productName = '';
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleEdit = () => {
    if (selectedRowKeys.value.length === 1) message.info('编辑功能');
};

const handleDelete = () => {
    if (selectedRowKeys.value.length === 0) return message.warning('请选择要删除的记录');
    message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
    selectedRowKeys.value = [];
    loadData();
};

const handleEditRow = (_record: ProductionPlanRow) => {
    message.info('编辑功能');
};

const handleDeleteRow = (_record: ProductionPlanRow) => {
    message.success('删除成功');
    loadData();
};

const handleSchedule = (record: ProductionPlanRow) => {
    router.push({ name: 'ProductionSchedule', params: { id: record.id } });
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    selectedRowKeys.value = [];
    loadData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    selectedRowKeys.value = [];
    loadData();
};

const handleJumpToPage = () => {
    const max = Math.ceil(pagination.total / pagination.pageSize);
    if (jumpPage.value >= 1 && jumpPage.value <= max) {
        pagination.current = jumpPage.value;
        selectedRowKeys.value = [];
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped></style>
