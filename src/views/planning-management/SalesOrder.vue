<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="订单编号">
                    <a-input v-model:value="searchForm.orderNumber" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item label="订单名称">
                    <a-input v-model:value="searchForm.orderName" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">
                            <template #icon>
                                <SearchOutlined />
                            </template>
                            查询
                        </a-button>
                        <a-button @click="handleReset">
                            <template #icon>
                                <ReloadOutlined />
                            </template>
                            重置
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <!-- 操作按钮区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    新增
                </a-button>
                <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
                    <template #icon>
                        <EditOutlined />
                    </template>
                    编辑
                </a-button>
                <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length === 0">
                    <template #icon>
                        <DeleteOutlined />
                    </template>
                    删除
                </a-button>
                <a-button @click="handlePrint">
                    <template #icon>
                        <PrinterOutlined />
                    </template>
                    打印
                </a-button>
                <a-button @click="handleImport">
                    <template #icon>
                        <UploadOutlined />
                    </template>
                    导入
                </a-button>
                <a-button @click="handleExport">
                    <template #icon>
                        <DownloadOutlined />
                    </template>
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
                :row-selection="{
                    selectedRowKeys: selectedRowKeys,
                    onChange: onSelectChange,
                }"
                :loading="loading"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleViewDetail(record)">详情</a>
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

interface SalesOrder {
    id: number;
    orderNumber: string;
    customerName: string;
    productName: string;
    deliveryDate: string;
    totalProducts: number;
    urgencyLevel: string;
    creator: string;
    createTime: string;
}

// 搜索表单
const searchForm = reactive({
    orderNumber: '',
    orderName: '',
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
        title: '销售单编号',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        width: 150,
    },
    {
        title: '客户名称',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
    },
    {
        title: '产品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 200,
    },
    {
        title: '交货日期',
        dataIndex: 'deliveryDate',
        key: 'deliveryDate',
        width: 120,
    },
    {
        title: '产品总数',
        dataIndex: 'totalProducts',
        key: 'totalProducts',
        width: 120,
    },
    {
        title: '紧急程度',
        dataIndex: 'urgencyLevel',
        key: 'urgencyLevel',
        width: 100,
    },
    {
        title: '创建人',
        dataIndex: 'creator',
        key: 'creator',
        width: 100,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 180,
    },
    {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right',
    },
];

// 表格数据
const tableData = ref<SalesOrder[]>([]);
const loading = ref(false);

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

// 模拟数据
const mockData: SalesOrder[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    orderNumber: 'XSDD0000001',
    customerName: '霍的微漠有限公司',
    productName: '笔记本电脑、智能手表',
    deliveryDate: '2025.10.01',
    totalProducts: 10000,
    urgencyLevel: '普通',
    creator: '刘超',
    createTime: '2025.04.24 14:00:00',
}));

// 加载数据
const loadData = () => {
    loading.value = true;
    setTimeout(() => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        tableData.value = mockData.slice(start, end);
        loading.value = false;
    }, 300);
};

// 搜索
const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

// 重置
const handleReset = () => {
    searchForm.orderNumber = '';
    searchForm.orderName = '';
    pagination.current = 1;
    loadData();
};

// 新增
const handleAdd = () => {
    message.info('新增功能');
};

// 编辑
const handleEdit = () => {
    if (selectedRowKeys.value.length === 1) {
        message.info('编辑功能');
    }
};

// 编辑行
const handleEditRow = (_record: SalesOrder) => {
    message.info('编辑功能');
};

// 删除
const handleDelete = () => {
    if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的记录');
        return;
    }
    message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
    selectedRowKeys.value = [];
    loadData();
};

// 删除行
const handleDeleteRow = (_record: SalesOrder) => {
    message.success('删除成功');
    loadData();
};

// 查看详情
const handleViewDetail = (_record: SalesOrder) => {
    message.info('查看详情');
};

// 打印
const handlePrint = () => {
    message.info('打印功能');
};

// 导入
const handleImport = () => {
    message.info('导入功能');
};

// 导出
const handleExport = () => {
    message.success('导出成功');
};

// 选择变化
const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

// 页码变化
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

// 跳转到指定页
const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= Math.ceil(pagination.total / pagination.pageSize)) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

// 初始化
onMounted(() => {
    loadData();
});
</script>

<style scoped></style>
