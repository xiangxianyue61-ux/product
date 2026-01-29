<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="项目编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="项目名称">
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
                <a-descriptions-item label="编号">{{ currentRow?.code }}</a-descriptions-item>
                <a-descriptions-item label="名称">{{ currentRow?.name }}</a-descriptions-item>
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
                <a-form-item label="编号" required>
                    <a-input v-model:value="editForm.code" />
                </a-form-item>
                <a-form-item label="名称" required>
                    <a-input v-model:value="editForm.name" />
                </a-form-item>
                <a-form-item label="备注">
                    <a-input v-model:value="editForm.remark" />
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

type Row = { id: number; code: string; name: string; remark: string; creator: string; createTime: string };

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);
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
const pad = (n: number, len = 9) => String(n).padStart(len, '0');
const toTimeStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}.${m}.${day} ${hh}:${mm}:${ss}`;
};

const namePool = [
    '计划异常',
    '物料异常',
    '设备异常',
    '品质异常',
    '产品异常',
    '水电异常',
    '工艺异常',
    '人员异常',
    '环境异常',
    '仓储异常',
];
const remarkPool = ['无', '需要复盘', '已通知相关部门', '已挂起待处理', '高频问题重点关注'];
const creatorPool = ['刘超', '王蒙', '张伟', '李强', '陈晨', '赵磊'];

// 模拟数据（56条，完全在前端写死，不访问数据库）
const allData: Row[] = Array.from({ length: 56 }, (_, idx) => {
    const i = idx + 1;
    const base = new Date(2025, 3, 24, 14, 0, 0);
    base.setMinutes(base.getMinutes() + idx * 17);
    return {
        id: i,
        code: `YICBH${pad(i)}`,
        name: namePool[idx % namePool.length]!,
        remark: remarkPool[(idx * 3) % remarkPool.length]!,
        creator: creatorPool[(idx * 5) % creatorPool.length]!,
        createTime: toTimeStr(base),
    };
});

// 本页数据全部来自 allData，不访问后端
const loadData = () => {
    const code = searchForm.code.trim();
    const name = searchForm.name.trim();

    // 本地过滤
    const filtered = allData.filter(item => {
        const matchCode = code ? item.code.includes(code) : true;
        const matchName = name ? item.name.includes(name) : true;
        return matchCode && matchName;
    });

    pagination.total = filtered.length;

    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = filtered.slice(start, end);
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
const noop = () => message.info('演示页面：此功能暂未接入后端');

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

const handleSubmit = () => {
    if (editMode.value === 'create') {
        // 计算新的 id
        const maxId = allData.reduce((max, item) => (item.id > max ? item.id : max), 0);
        const newId = maxId + 1;
        const d = new Date();
        const newRow: Row = {
            id: newId,
            code: editForm.code || `YICBH${pad(newId)}`,
            name: editForm.name,
            remark: editForm.remark,
            creator: editForm.creator || '系统',
            createTime: editForm.createTime || toTimeStr(d),
        };
        allData.push(newRow);
        message.success('新增成功（本页为前端模拟数据）');
    } else {
        const idx = allData.findIndex(item => item.id === editForm.id);
        if (idx !== -1) {
            allData[idx] = { ...allData[idx], ...editForm };
            message.success('编辑成功（本页为前端模拟数据）');
        }
    }
    editOpen.value = false;
    loadData();
};

const deleteOne = (record: Row) => {
    const idx = allData.findIndex(item => item.id === record.id);
    if (idx !== -1) {
        allData.splice(idx, 1);
        message.success('删除成功（本页为前端模拟数据）');
        // 如果当前页被删空，自动回到上一页
        if ((pagination.current - 1) * pagination.pageSize >= allData.length && pagination.current > 1) {
            pagination.current -= 1;
        }
        loadData();
    }
};

const deleteBySelection = () => {
    if (selectedRowKeys.value.length === 0) return;
    const ids = new Set(selectedRowKeys.value);
    for (let i = allData.length - 1; i >= 0; i -= 1) {
        if (ids.has(allData[i].id)) {
            allData.splice(i, 1);
        }
    }
    message.success(`已删除 ${selectedRowKeys.value.length} 条记录（本页为前端模拟数据）`);
    selectedRowKeys.value = [];
    if ((pagination.current - 1) * pagination.pageSize >= allData.length && pagination.current > 1) {
        pagination.current -= 1;
    }
    loadData();
};

onMounted(() => loadData());
</script>
