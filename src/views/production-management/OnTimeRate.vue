<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="统计日期">
                    <a-range-picker v-model:value="searchForm.dateRange" format="YYYY.MM.DD" style="width: 300px" />
                </a-form-item>
                <a-form-item label="产品名称">
                    <a-input v-model:value="searchForm.productName" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="产品类型">
                    <a-input v-model:value="searchForm.productType" placeholder="请输入内容" style="width: 220px" />
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

        <!-- KPI统计卡片 -->
        <a-row :gutter="16" class="mb-4">
            <a-col :span="8">
                <a-card :bordered="false" class="kpi-card">
                    <div class="kpi-value">{{ kpiStats.plannedQuantity }}</div>
                    <div class="kpi-label">计划数</div>
                </a-card>
            </a-col>
            <a-col :span="8">
                <a-card :bordered="false" class="kpi-card">
                    <div class="kpi-value">{{ kpiStats.completedQuantity }}</div>
                    <div class="kpi-label">完成数</div>
                </a-card>
            </a-col>
            <a-col :span="8">
                <a-card :bordered="false" class="kpi-card">
                    <div class="kpi-value kpi-rate">{{ kpiStats.onTimeRate }}%</div>
                    <div class="kpi-label">准时率</div>
                </a-card>
            </a-col>
        </a-row>

        <!-- 数据表格 -->
        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{
                    selectedRowKeys: selectedRowKeys,
                    onChange: onSelectChange,
                }"
                row-key="id"
            >
                <template #bodyCell="{ column }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <span>|</span>
                            <a @click="noop">编辑</a>
                            <span>|</span>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
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
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import dayjs, { type Dayjs } from 'dayjs';

type OnTimeRate = {
    id: number;
    planNumber: string;
    workOrderNumber: string;
    workOrderName: string;
    productNumber: string;
    productName: string;
    specification: string;
    unit: string;
    plannedQuantity: number;
    onTimeCompletedQuantity: number;
    onTimeRate: string;
};

// 搜索表单
const searchForm = reactive<{
    dateRange: [Dayjs, Dayjs] | null;
    productName: string;
    productType: string;
}>({
    dateRange: [dayjs('2025-01-01'), dayjs('2025-02-01')],
    productName: '',
    productType: '',
});

// KPI统计
const kpiStats = reactive({
    plannedQuantity: 1000,
    completedQuantity: 950,
    onTimeRate: 95.0,
});

// 表格列定义
const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => {
            return (pagination.current - 1) * pagination.pageSize + index + 1;
        },
    },
    {
        title: '生产计划编号',
        dataIndex: 'planNumber',
        key: 'planNumber',
        width: 180,
    },
    {
        title: '工单编号',
        dataIndex: 'workOrderNumber',
        key: 'workOrderNumber',
        width: 150,
    },
    {
        title: '工单名称',
        dataIndex: 'workOrderName',
        key: 'workOrderName',
        width: 200,
    },
    {
        title: '产品编号',
        dataIndex: 'productNumber',
        key: 'productNumber',
        width: 150,
    },
    {
        title: '产品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 200,
    },
    {
        title: '规格型号',
        dataIndex: 'specification',
        key: 'specification',
        width: 150,
    },
    {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
    },
    {
        title: '计划数量',
        dataIndex: 'plannedQuantity',
        key: 'plannedQuantity',
        width: 120,
    },
    {
        title: '准时完工数量',
        dataIndex: 'onTimeCompletedQuantity',
        key: 'onTimeCompletedQuantity',
        width: 150,
    },
    {
        title: '准时率',
        dataIndex: 'onTimeRate',
        key: 'onTimeRate',
        width: 100,
    },
    {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right',
    },
];

// 表格数据
const tableData = ref<OnTimeRate[]>([]);

// 选中的行
const selectedRowKeys = ref<number[]>([]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 15,
    total: 56,
});

// 跳转页码
const jumpPage = ref<number>(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

// 模拟数据
const mockData: OnTimeRate[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    planNumber: 'SCJHDD000001',
    workOrderNumber: 'SCGD0000001',
    workOrderName: '外贸一生产工单',
    productNumber: 'CPBH0000001',
    productName: '笔记本电脑',
    specification: '300*400mm',
    unit: '个',
    plannedQuantity: 1000,
    onTimeCompletedQuantity: 950,
    onTimeRate: '95.0%',
}));

// 加载数据
const loadData = () => {
    let filteredData = [...mockData];

    // 前端筛选
    if (searchForm.productName) {
        filteredData = filteredData.filter(item => item.productName.includes(searchForm.productName));
    }
    if (searchForm.productType) {
        filteredData = filteredData.filter(item => item.productName.includes(searchForm.productType));
    }

    // 更新总数
    pagination.total = filteredData.length;

    // 计算KPI统计
    kpiStats.plannedQuantity = filteredData.reduce((sum, item) => sum + item.plannedQuantity, 0);
    kpiStats.completedQuantity = filteredData.reduce((sum, item) => sum + item.onTimeCompletedQuantity, 0);
    kpiStats.onTimeRate =
        kpiStats.plannedQuantity > 0
            ? Number(((kpiStats.completedQuantity / kpiStats.plannedQuantity) * 100).toFixed(1))
            : 0;

    // 分页
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = filteredData.slice(start, end);
};

// 选择变化
const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

// 查询
const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

// 重置
const handleReset = () => {
    searchForm.dateRange = [dayjs('2025-01-01'), dayjs('2025-02-01')];
    searchForm.productName = '';
    searchForm.productType = '';
    pagination.current = 1;
    loadData();
};

// 分页变化
const handlePageChange = (page: number) => {
    pagination.current = page;
    loadData();
};

// 每页条数变化
const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    loadData();
};

// 跳转页面
const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.kpi-card {
    text-align: center;
    padding: 24px;
}

.kpi-value {
    font-size: 48px;
    font-weight: bold;
    color: #1890ff;
    margin-bottom: 8px;
}

.kpi-value.kpi-rate {
    color: #52c41a;
}

.kpi-label {
    font-size: 16px;
    color: #666;
}
</style>
