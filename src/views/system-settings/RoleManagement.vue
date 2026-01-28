<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="角色编号">
                    <a-input v-model="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="角色名称">
                    <a-input v-model="searchForm.name" placeholder="请输入内容" style="width: 220px" />
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
                <a-button type="primary" @click="handleAdd">新增</a-button>
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
                            <a @click="noop">详情</a>
                            <a @click="noop">编辑</a>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    :current="pagination.current"
                    :page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="total => `共${total}条`"
                    :page-size-options="['15', '30', '50', '100']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number v-model="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 新增角色弹窗 -->
        <a-modal :open="addModalVisible" title="新增" @ok="handleAddSubmit" @cancel="handleAddCancel">
            <a-form :model="addForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="角色编号" required>
                    <a-input v-model="addForm.name" placeholder="请输入角色编号（唯一标识，如 admin）" />
                </a-form-item>
                <a-form-item label="角色名称" required>
                    <a-input v-model="addForm.displayName" placeholder="请输入角色名称（如 管理员）" />
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model="addForm.description" placeholder="请输入内容" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { addRoleList, getRoleList } from './api/index';

type Row = {
    id: number;
    code: string;
    name: string;
    remark: string;
    creator: string;
    createTime: string;
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
    { title: '角色编号', dataIndex: 'code', key: 'code', width: 180 },
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 220 },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    code: `JSBH${String(i + 1).padStart(10, '0')}`,
    name: ['管理员', '操作员', '审核员', '查看员'][i % 4],
    remark: '无',
    creator: '李民浩',
    createTime: '2025.04.24 14:00:00',
}));

const getRoleListData = async () => {
    try {
        const res = await getRoleList({
            pageNum: pagination.current,
            pageSize: pagination.pageSize,
            code: searchForm.code,
            name: searchForm.name,
        });
        if (res.data.success) {
            tableData.value = res.data.data || [];
            pagination.total = res.data.total || 0;
        } else {
            message.error(res.data.message || '查询失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    getRoleListData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    getRoleListData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    getRoleListData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    getRoleListData();
};

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        getRoleListData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

// 新增逻辑
const addModalVisible = ref(false);
const addForm = reactive({
    name: '', // 角色编号/唯一标识
    displayName: '', // 角色名称
    description: '', // 描述
});

const handleAdd = () => {
    addForm.name = '';
    addForm.displayName = '';
    addForm.description = '';
    addModalVisible.value = true;
};

const handleAddCancel = () => {
    addModalVisible.value = false;
};

const handleAddSubmit = async () => {
    if (!addForm.name || !addForm.displayName) {
        message.warning('请填写必填项');
        return;
    }
    try {
        const res = await addRoleList(addForm);
        if (res.data.success) {
            message.success('添加成功');
            addModalVisible.value = false;
            // 刷新列表（这里暂时调用 mock 加载，实际应调用后端列表接口）
            getRoleListData();
        } else {
            message.error(res.data.message || '添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理，这里可忽略
    }
};

onMounted(() => getRoleListData());
</script>
