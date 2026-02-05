<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="单位编号">
                    <a-input v-model:value="searchForm.unitCode" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item label="单位名称">
                    <a-input v-model:value="searchForm.unitName" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
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
                <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="handlePrint">打印</a-button>
                <ImportExportBar
                    :import-headers="IMPORT_HEADERS"
                    :import-header-keys="[...IMPORT_HEADER_KEYS]"
                    template-filename="物料单位导入模板"
                    template-example-row="DWBH000001,吨,启用,无,2025.04.24 14:00:00"
                    export-filename-prefix="物料单位"
                    :export-headers="IMPORT_HEADERS"
                    :get-export-data="getExportData"
                    :get-export-row-values="(row: unknown) => getExportRowValues(row as MaterialUnit)"
                    :on-import-submit="submitMaterialUnitImport"
                />
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
                    <template v-if="column.key === 'status'">
                        <a-tag color="success">启用</a-tag>
                    </template>
                    <template v-else-if="column.key === 'action'">
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

        <!-- 新增/编辑弹窗 -->
        <a-modal
            v-model:open="modalVisible"
            :title="modalTitle"
            width="600px"
            @ok="handleModalOk"
            @cancel="handleModalCancel"
        >
            <a-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                :label-col="{ span: 6 }"
                :wrapper-col="{ span: 18 }"
            >
                <a-form-item label="单位编号" name="unitCode">
                    <a-input v-model:value="formData.unitCode" placeholder="请输入单位编号" />
                </a-form-item>
                <a-form-item label="单位名称" name="unitName">
                    <a-input v-model:value="formData.unitName" placeholder="请输入单位名称" />
                </a-form-item>
                <a-form-item label="状态" name="status">
                    <a-radio-group v-model:value="formData.status">
                        <a-radio value="enabled">启用</a-radio>
                        <a-radio value="disabled">禁用</a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="formData.remark" :rows="4" placeholder="请输入备注" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import ImportExportBar from '../../components/ImportExportBar.vue';

interface MaterialUnit {
    id: number;
    unitCode: string;
    unitName: string;
    status: string;
    remark: string;
    createTime: string;
}

// 搜索表单
const searchForm = reactive({
    unitCode: '',
    unitName: '',
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
        title: '单位编号',
        dataIndex: 'unitCode',
        key: 'unitCode',
        width: 150,
    },
    {
        title: '单位名称',
        dataIndex: 'unitName',
        key: 'unitName',
        width: 150,
    },
    {
        title: '状态',
        key: 'status',
        width: 100,
    },
    {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
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
const tableData = ref<MaterialUnit[]>([]);
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

// 弹窗相关
const modalVisible = ref(false);
const modalTitle = ref('新增物料单位');
const formRef = ref();
const formData = reactive({
    id: undefined as number | undefined,
    unitCode: '',
    unitName: '',
    status: 'enabled',
    remark: '',
});

// 表单验证规则
const formRules = {
    unitCode: [{ required: true, message: '请输入单位编号', trigger: 'blur' }],
    unitName: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
};

// 初始演示数据（内存中维护，可通过导入扩展）
const allData = ref<MaterialUnit[]>([
    {
        id: 1,
        unitCode: 'DWBH000001',
        unitName: '吨',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 2,
        unitCode: 'DWBH000001',
        unitName: '千克',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 3,
        unitCode: 'DWBH000001',
        unitName: '克',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 4,
        unitCode: 'DWBH000001',
        unitName: '升',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 5,
        unitCode: 'DWBH000001',
        unitName: '毫升',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 6,
        unitCode: 'DWBH000001',
        unitName: '件',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 7,
        unitCode: 'DWBH000001',
        unitName: '个',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 8,
        unitCode: 'DWBH000001',
        unitName: '箱',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 9,
        unitCode: 'DWBH000001',
        unitName: '千米',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 10,
        unitCode: 'DWBH000001',
        unitName: '米',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 11,
        unitCode: 'DWBH000001',
        unitName: '分米',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 12,
        unitCode: 'DWBH000001',
        unitName: '厘米',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 13,
        unitCode: 'DWBH000001',
        unitName: '匹',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 14,
        unitCode: 'DWBH000001',
        unitName: '只',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
    {
        id: 15,
        unitCode: 'DWBH000001',
        unitName: '头',
        status: 'enabled',
        remark: '无',
        createTime: '2025.04.24 14:00:00',
    },
]);

// 加载数据
const loadData = () => {
    loading.value = true;
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = allData.value.slice(start, end);
    loading.value = false;
};

// 搜索
const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

// 重置
const handleReset = () => {
    searchForm.unitCode = '';
    searchForm.unitName = '';
    pagination.current = 1;
    loadData();
};

// 新增
const handleAdd = () => {
    modalTitle.value = '新增物料单位';
    formData.id = undefined;
    formData.unitCode = '';
    formData.unitName = '';
    formData.status = 'enabled';
    formData.remark = '';
    modalVisible.value = true;
};

// 编辑（选中行）
const handleEdit = () => {
    if (selectedRowKeys.value.length === 1) {
        const record = tableData.value.find(item => item.id === selectedRowKeys.value[0]);
        if (record) {
            handleEditRow(record);
        }
    }
};

// 编辑行
const handleEditRow = (record: MaterialUnit) => {
    modalTitle.value = '编辑物料单位';
    formData.id = record.id;
    formData.unitCode = record.unitCode;
    formData.unitName = record.unitName;
    formData.status = record.status;
    formData.remark = record.remark;
    modalVisible.value = true;
};

// 删除（选中行）
const handleDelete = () => {
    if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的记录');
        return;
    }
    const ids = new Set(selectedRowKeys.value);
    allData.value = allData.value.filter(item => !ids.has(item.id));
    message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
    selectedRowKeys.value = [];
    pagination.total = allData.value.length;
    loadData();
};

// 删除行
const handleDeleteRow = (record: MaterialUnit) => {
    allData.value = allData.value.filter(item => item.id !== record.id);
    pagination.total = allData.value.length;
    message.success('删除成功');
    loadData();
};

// 查看详情
const handleViewDetail = (record: MaterialUnit) => {
    message.info(`查看 ${record.unitName} 的详情`);
};

// 打印
const handlePrint = () => {
    message.info('打印功能');
};

const IMPORT_HEADERS = ['单位编号', '单位名称', '状态', '备注', '创建时间'];
const IMPORT_HEADER_KEYS = ['unitCode', 'unitName', 'status', 'remark', 'createTime'] as const;

const getExportData = () => allData.value;
const getExportRowValues = (r: MaterialUnit): (string | number)[] => [
    r.unitCode,
    r.unitName,
    r.status === 'disabled' ? '禁用' : '启用',
    r.remark ?? '',
    r.createTime ?? '',
];

const submitMaterialUnitImport = async (rows: Record<string, string>[]) => {
    let maxId = allData.value.length ? Math.max(...allData.value.map(item => item.id), 0) : 0;
    const toAppend: MaterialUnit[] = rows.map(row => ({
        id: ++maxId,
        unitCode: row.unitCode || '',
        unitName: row.unitName || '',
        status: row.status === 'disabled' || row.status === '禁用' ? 'disabled' : 'enabled',
        remark: row.remark || '',
        createTime: row.createTime || '2025.04.24 14:00:00',
    }));
    allData.value = allData.value.concat(toAppend);
    pagination.total = allData.value.length;
    loadData();
    message.success(`成功导入 ${toAppend.length} 条`);
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
const handlePageSizeChange = (current: number, size: number) => {
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

// 弹窗确定
const handleModalOk = async () => {
    try {
        await formRef.value.validate();
        message.success(modalTitle.value === '新增物料单位' ? '新增成功' : '编辑成功');
        modalVisible.value = false;
        loadData();
    } catch (error) {
        // 表单验证失败
        if (error) {
            // 验证错误已由 Ant Design 组件显示
        }
    }
};

// 弹窗取消
const handleModalCancel = () => {
    modalVisible.value = false;
    formRef.value?.resetFields();
};

// 初始化
onMounted(() => {
    loadData();
});
</script>

<style scoped></style>
