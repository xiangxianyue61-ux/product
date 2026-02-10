<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="异常分类编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="异常分类名称">
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
                <a-button type="primary" @click="openCreate">新增</a-button>
                <a-button @click="openEditBySelection" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="deleteBySelection" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="exportJson">导出 JSON</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :loading="loading"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="openDetail(record)">详情</a>
                            <a @click="openEdit(record)">编辑</a>
                            <a-popconfirm title="确定要删除这条记录吗？" @confirm="deleteOne(record)">
                                <a style="color: #ff4d4f">删除</a>
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

        <a-modal :open="detailOpen" title="异常分类详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="异常分类编号">{{ currentRow?.code }}</a-descriptions-item>
                <a-descriptions-item label="异常分类名称">{{ currentRow?.name }}</a-descriptions-item>
                <a-descriptions-item label="备注" :span="2">{{ currentRow?.remark }}</a-descriptions-item>
                <a-descriptions-item label="创建人">{{ currentRow?.creator }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ currentRow?.createTime }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增异常分类' : '编辑异常分类'"
            @ok="handleSubmit"
            @cancel="editOpen = false"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="异常分类编号" required>
                    <a-input v-model:value="editForm.code" placeholder="如 WLBM000001" />
                </a-form-item>
                <a-form-item label="异常分类名称" required>
                    <a-input v-model:value="editForm.name" placeholder="如 计划异常、物料异常" />
                </a-form-item>
                <a-form-item label="备注">
                    <a-input v-model:value="editForm.remark" placeholder="异常描述或备注" />
                </a-form-item>
                <a-form-item label="创建人">
                    <a-input v-model:value="editForm.creator" />
                </a-form-item>
                <a-form-item label="创建时间">
                    <a-input v-model:value="editForm.createTime" placeholder="YYYY.MM.DD HH:mm:ss" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';

// 表格行：与数据库 Abnormal 集合对应，本页展示 code/category/description/creator/createTime
type Row = { id: number; code: string; name: string; remark: string; creator: string; createTime: string };

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '异常分类编号', dataIndex: 'code', key: 'code', width: 200 },
    { title: '异常分类名称', dataIndex: 'name', key: 'name', width: 220 },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

// 将 API 返回的 Abnormal 文档映射为表格行（code/category/description -> name/remark）
function mapAbnormalToRow(doc: {
    id: number;
    code?: string;
    category?: string;
    description?: string;
    creator?: string;
    createTime?: string;
}): Row {
    return {
        id: doc.id,
        code: doc.code ?? '',
        name: doc.category ?? '',
        remark: doc.description ?? '',
        creator: doc.creator ?? '',
        createTime: doc.createTime ?? '',
    };
}

// 表格数据来自数据库 Abnormal 集合（GET /api/abnormalList/list）
const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('code', searchForm.code.trim());
        if (searchForm.name.trim()) params.set('category', searchForm.name.trim());

        const res = await apiFetch<ListResult<Record<string, unknown>>>(`/api/abnormalList/list?${params.toString()}`);
        const list = (res.data ?? []).map(mapAbnormalToRow);
        tableData.value = list;
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取异常分类数据失败：${(e as Error).message || '未知错误'}`);
    } finally {
        loading.value = false;
    }
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};
const handleSearch = () => {
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
    message.success('查询成功');
};
const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
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
const noop = () => message.info('此功能暂未接入');

// 导出当前列表数据为 JSON（来自数据库）
const exportJson = () => {
    const json = tableData.value.map(item => ({
        id: item.id,
        异常分类编号: item.code,
        异常分类名称: item.name,
        备注: item.remark,
        创建人: item.creator,
        创建时间: item.createTime,
    }));
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `异常分类_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${json.length} 条记录`);
};

// CRUD
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<Row | null>(null);
const editForm = reactive<Row>({ id: 0, code: '', name: '', remark: '', creator: '', createTime: '' });

const openDetail = (record: Row) => {
    currentRow.value = record;
    detailOpen.value = true;
};

const openCreate = () => {
    editMode.value = 'create';
    Object.assign(editForm, { id: 0, code: '', name: '', remark: '', creator: '', createTime: '' });
    editOpen.value = true;
};

const openEdit = (record: Row) => {
    editMode.value = 'edit';
    Object.assign(editForm, record);
    editOpen.value = true;
};

const openEditBySelection = () => {
    if (selectedRowKeys.value.length !== 1) return;
    const id = selectedRowKeys.value[0];
    const row = tableData.value.find(r => r.id === id);
    if (row) openEdit(row);
};

const handleSubmit = async () => {
    try {
        const payload = {
            code: editForm.code,
            category: editForm.name,
            description: editForm.remark,
            creator: editForm.creator || undefined,
            createTime: editForm.createTime || undefined,
            workOrder: '',
            process: '',
            level: '',
            result: '未处理',
            dutyDept: '',
            dutyPerson: '',
        };
        if (editMode.value === 'create') {
            await apiFetch('/api/abnormalList', { method: 'POST', body: JSON.stringify(payload) });
            message.success('新增成功');
            // 立即刷新铃铛里的系统通知列表，无需刷新页面即可看到新异常通知
            window.dispatchEvent(new CustomEvent('notification-list-refresh'));
        } else {
            await apiFetch(`/api/abnormalList/${editForm.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...payload,
                    id: editForm.id,
                }),
            });
            message.success('编辑成功');
        }
        editOpen.value = false;
        await loadData();
    } catch (e) {
        message.error(`保存失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteOne = async (record: Row) => {
    try {
        await apiFetch(`/api/abnormalList/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteBySelection = async () => {
    if (selectedRowKeys.value.length === 0) return;
    try {
        await Promise.all(selectedRowKeys.value.map(id => apiFetch(`/api/abnormalList/${id}`, { method: 'DELETE' })));
        message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
        selectedRowKeys.value = [];
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

onMounted(() => loadData());
</script>
