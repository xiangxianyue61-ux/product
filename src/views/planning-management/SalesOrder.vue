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
                <ImportExportBar
                    :import-headers="IMPORT_HEADERS"
                    :import-header-keys="[...IMPORT_HEADER_KEYS]"
                    template-filename="销售订单导入模板"
                    template-example-row="XSDD0000001,示例客户,示例产品,2025.10.01,100,普通,刘超,2025.04.24 14:00:00"
                    export-filename-prefix="销售订单"
                    :export-headers="IMPORT_HEADERS"
                    :get-export-data="getExportData"
                    :get-export-row-values="(row: unknown) => getExportRowValues(row as SalesOrder)"
                    :on-import-submit="submitSalesOrderImport"
                />
            </a-space>
        </a-card>

        <!-- 数据表格 -->
        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :scroll="{ y: 600 }"
                :virtual="true"
                :row-selection="{
                    selectedRowKeys: selectedRowKeys,
                    onChange: onSelectChange,
                }"
                :loading="loading"
                :locale="{ emptyText: '暂无销售订单，可通过「导入」下载模板、填写后选择文件导入' }"
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
            <!-- 分页：与虚拟列表配合，按页请求后端 -->
            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="(total: number) => `共 ${total} 条`"
                    :page-size-options="['20', '50', '100', '200']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
            </div>
        </a-card>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            v-model:open="formModalVisible"
            :title="editingId === undefined ? '新增销售订单' : '编辑销售订单'"
            width="720px"
            @ok="submitForm"
            @cancel="closeFormModal"
        >
            <a-form ref="formRef" :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item
                    label="销售单编号"
                    name="orderNumber"
                    :rules="[{ required: true, message: '请输入销售单编号' }]"
                >
                    <a-input v-model:value="formState.orderNumber" placeholder="请输入销售单编号" />
                </a-form-item>
                <a-form-item
                    label="客户名称"
                    name="customerName"
                    :rules="[{ required: true, message: '请输入客户名称' }]"
                >
                    <a-input v-model:value="formState.customerName" placeholder="请输入客户名称" />
                </a-form-item>
                <a-form-item
                    label="产品名称"
                    name="productName"
                    :rules="[{ required: true, message: '请输入产品名称' }]"
                >
                    <a-input v-model:value="formState.productName" placeholder="请输入产品名称" />
                </a-form-item>
                <a-form-item
                    label="交货日期"
                    name="deliveryDate"
                    :rules="[{ required: true, message: '请输入交货日期' }]"
                >
                    <a-input v-model:value="formState.deliveryDate" placeholder="如 2025.10.01" />
                </a-form-item>
                <a-form-item
                    label="产品总数"
                    name="totalProducts"
                    :rules="[{ required: true, message: '请输入产品总数' }]"
                >
                    <a-input-number v-model:value="formState.totalProducts" :min="0" style="width: 100%" />
                </a-form-item>
                <a-form-item label="紧急程度" name="urgencyLevel">
                    <a-select v-model:value="formState.urgencyLevel" placeholder="请选择紧急程度" allow-clear>
                        <a-select-option value="普通">普通</a-select-option>
                        <a-select-option value="加急">加急</a-select-option>
                        <a-select-option value="紧急">紧急</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="创建人" name="creator">
                    <a-input v-model:value="formState.creator" placeholder="请输入创建人" />
                </a-form-item>
                <a-form-item label="创建时间" name="createTime">
                    <a-input v-model:value="formState.createTime" placeholder="如 2025.04.24 14:00:00" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 详情弹窗 -->
        <a-modal
            v-model:open="detailModalVisible"
            title="销售订单详情"
            width="720px"
            :footer="null"
            @cancel="detailModalVisible = false"
        >
            <a-descriptions bordered :column="2" size="small">
                <a-descriptions-item label="销售单编号">{{ detailRecord?.orderNumber || '-' }}</a-descriptions-item>
                <a-descriptions-item label="客户名称">{{ detailRecord?.customerName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="产品名称">{{ detailRecord?.productName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="交货日期">{{ detailRecord?.deliveryDate || '-' }}</a-descriptions-item>
                <a-descriptions-item label="产品总数">{{ detailRecord?.totalProducts ?? '-' }}</a-descriptions-item>
                <a-descriptions-item label="紧急程度">{{ detailRecord?.urgencyLevel || '-' }}</a-descriptions-item>
                <a-descriptions-item label="创建人">{{ detailRecord?.creator || '-' }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detailRecord?.createTime || '-' }}</a-descriptions-item>
            </a-descriptions>
            <div class="mt-4 flex justify-end gap-2">
                <a-button @click="detailModalVisible = false">关闭</a-button>
                <a-button type="primary" @click="detailEdit">编辑</a-button>
            </div>
        </a-modal>
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
} from '@ant-design/icons-vue';
import ImportExportBar from '../../components/ImportExportBar.vue';
import { apiFetch, type ApiResult, type ListResult } from '../../utils/apiClient';

interface SalesOrder {
    id: number | string;
    orderNumber: string;
    customerName: string;
    productName: string;
    deliveryDate: string;
    totalProducts: number;
    urgencyLevel: string;
    creator: string;
    createTime: string;
}

// 导入模板表头（与后端 writableFields 对应）
const IMPORT_HEADERS = ['销售单编号', '客户名称', '产品名称', '交货日期', '产品总数', '紧急程度', '创建人', '创建时间'];
const IMPORT_HEADER_KEYS = [
    'orderNumber',
    'customerName',
    'productName',
    'deliveryDate',
    'totalProducts',
    'urgencyLevel',
    'creator',
    'createTime',
] as const;

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
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
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
const selectedRowKeys = ref<(number | string)[]>([]);

// 分页（与虚拟列表配合：每页请求一页数据，单页内用虚拟滚动渲染）
const pagination = reactive({
    current: 1,
    pageSize: 50,
    total: 0,
});

// 加载数据（后端分页，当前页数据用虚拟列表展示）
const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.orderNumber.trim()) params.set('orderNumber', searchForm.orderNumber.trim());
        if (searchForm.orderName.trim()) params.set('orderName', searchForm.orderName.trim());
        const res = await apiFetch<ListResult<SalesOrder>>(`/api/planSalesOrders/list?${params.toString()}`);
        tableData.value = (res.data ?? []).map((r: SalesOrder & { _id?: unknown }, i: number) => ({
            ...r,
            id: r.id !== undefined && r.id !== null ? r.id : r._id != null ? String(r._id) : `_${i}`,
        }));
        pagination.total = res.total ?? 0;
    } catch {
        tableData.value = [];
        pagination.total = 0;
        message.error('加载列表失败，请检查网络或登录状态');
    } finally {
        loading.value = false;
    }
};

const handlePageChange = () => {
    loadData();
};

const handlePageSizeChange = () => {
    pagination.current = 1;
    loadData();
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

// ---------- 新增/编辑/详情 ----------
const formModalVisible = ref(false);
const formRef = ref();
const editingId = ref<number | string | undefined>(undefined);
const formState = reactive({
    orderNumber: '',
    customerName: '',
    productName: '',
    deliveryDate: '',
    totalProducts: 0,
    urgencyLevel: '普通',
    creator: '',
    createTime: '',
});

const detailModalVisible = ref(false);
const detailRecord = ref<SalesOrder | null>(null);

function getNextId(): number {
    if (tableData.value.length === 0) return 1;
    const ids = tableData.value.map(r => (typeof r.id === 'number' ? r.id : 0));
    return Math.max(...ids, 0) + 1;
}

function resetForm() {
    formState.orderNumber = '';
    formState.customerName = '';
    formState.productName = '';
    formState.deliveryDate = '';
    formState.totalProducts = 0;
    formState.urgencyLevel = '普通';
    formState.creator = '';
    formState.createTime = '';
    editingId.value = undefined;
}

function openFormModal(record?: SalesOrder) {
    resetForm();
    if (record) {
        editingId.value = record.id;
        formState.orderNumber = record.orderNumber ?? '';
        formState.customerName = record.customerName ?? '';
        formState.productName = record.productName ?? '';
        formState.deliveryDate = record.deliveryDate ?? '';
        formState.totalProducts = Number(record.totalProducts) || 0;
        formState.urgencyLevel = record.urgencyLevel || '普通';
        formState.creator = record.creator ?? '';
        formState.createTime = record.createTime ?? '';
    }
    formModalVisible.value = true;
}

function closeFormModal() {
    formModalVisible.value = false;
    resetForm();
}

async function submitForm() {
    try {
        await formRef.value?.validate();
    } catch {
        return;
    }

    const id = editingId.value;
    const payload = {
        orderNumber: formState.orderNumber,
        customerName: formState.customerName,
        productName: formState.productName,
        deliveryDate: formState.deliveryDate,
        totalProducts: Number(formState.totalProducts) || 0,
        urgencyLevel: formState.urgencyLevel || '普通',
        creator: formState.creator || '',
        createTime: formState.createTime || '',
    };

    try {
        if (id === undefined) {
            const nextId = getNextId();
            await apiFetch('/api/planSalesOrders', {
                method: 'POST',
                body: JSON.stringify({ ...payload, id: nextId }),
            });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/planSalesOrders/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            message.success('编辑成功');
        }
        closeFormModal();
        await loadData();
    } catch {
        message.error(id === undefined ? '新增失败' : '编辑失败');
    }
}

const handleAdd = () => openFormModal();

const handleEdit = () => {
    if (selectedRowKeys.value.length !== 1) return;
    const record = tableData.value.find(r => r.id === selectedRowKeys.value[0]);
    if (record) openFormModal(record);
};

const handleEditRow = (record: SalesOrder) => openFormModal(record);

const handleViewDetail = async (record: SalesOrder) => {
    try {
        const res = await apiFetch<ApiResult<SalesOrder>>(`/api/planSalesOrders/${record.id}`);
        detailRecord.value = res.data;
    } catch {
        detailRecord.value = record;
    }
    detailModalVisible.value = true;
};

const detailEdit = () => {
    if (!detailRecord.value) return;
    detailModalVisible.value = false;
    openFormModal(detailRecord.value);
};

// ---------- 删除 ----------
const handleDelete = async () => {
    if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的记录');
        return;
    }
    let ok = 0;
    let err = 0;
    for (const id of selectedRowKeys.value) {
        try {
            await apiFetch(`/api/planSalesOrders/${id}`, { method: 'DELETE' });
            ok++;
        } catch {
            err++;
        }
    }
    selectedRowKeys.value = [];
    await loadData();
    if (err === 0) message.success(`已删除 ${ok} 条记录`);
    else message.warning(`删除完成：成功 ${ok} 条，失败 ${err} 条`);
};

const handleDeleteRow = async (record: SalesOrder) => {
    try {
        await apiFetch(`/api/planSalesOrders/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch {
        message.error('删除失败');
    }
};

// 打印
const handlePrint = () => {
    message.info('打印功能');
};

// ---------- 通用导入导出（由 ImportExportBar 调用） ----------
const getExportData = () => tableData.value;
const getExportRowValues = (row: SalesOrder) =>
    [
        row.orderNumber,
        row.customerName,
        row.productName,
        row.deliveryDate,
        row.totalProducts,
        row.urgencyLevel,
        row.creator ?? '',
        row.createTime ?? '',
    ] as (string | number)[];

const submitSalesOrderImport = async (rows: Record<string, string>[]) => {
    let ok = 0;
    let err = 0;
    const maxId = tableData.value.length
        ? Math.max(...tableData.value.map(r => (typeof r.id === 'number' ? r.id : 0)), 0)
        : 0;
    let nextId = maxId + 1;
    for (const row of rows) {
        const payload = {
            id: nextId++,
            orderNumber: row.orderNumber,
            customerName: row.customerName,
            productName: row.productName,
            deliveryDate: row.deliveryDate,
            totalProducts: Number(row.totalProducts) || 0,
            urgencyLevel: row.urgencyLevel || '普通',
            creator: row.creator || '',
            createTime: row.createTime || '',
        };
        try {
            await apiFetch('/api/planSalesOrders', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            ok++;
        } catch {
            err++;
        }
    }
    await loadData();
    if (err === 0) message.success(`成功导入 ${ok} 条`);
    else message.warning(`导入完成：成功 ${ok} 条，失败 ${err} 条`);
};

// 选择变化
const onSelectChange = (keys: (number | string)[]) => {
    selectedRowKeys.value = keys;
};

// 初始化
onMounted(() => {
    loadData();
});
</script>

<style scoped></style>
