<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="角色编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="角色名称">
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
                <a-button type="primary" @click="handleAdd">新增</a-button>
                <a-button @click="handleEdit(null)" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="noop" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="noop">导出</a-button>
                <a-button @click="handleSimulateAdd">模拟添加数据</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="_id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                            {{ record.status === 'active' ? '启用' : '禁用' }}
                        </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <a @click="handleEdit(record)">编辑</a>
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
                    <a-input-number v-model:value="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 新增/编辑角色弹窗 -->
        <a-modal
            :open="addModalVisible"
            :title="currentId ? '编辑角色' : '新增角色'"
            @ok="handleAddSubmit"
            @cancel="handleAddCancel"
            width="600px"
        >
            <a-form :model="addForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
                <a-form-item label="角色编号" required help="唯一标识，如：admin, user">
                    <a-input v-model:value="addForm.name" placeholder="请输入角色编号" />
                </a-form-item>
                <a-form-item label="角色名称" required help="显示名称，如：管理员, 普通用户">
                    <a-input v-model:value="addForm.displayName" placeholder="请输入角色名称" />
                </a-form-item>
                <a-form-item label="角色状态" required>
                    <a-radio-group v-model:value="addForm.status">
                        <a-radio value="active">启用</a-radio>
                        <a-radio value="inactive">禁用</a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="菜单权限">
                    <a-tree-select
                        v-model:value="addForm.menus"
                        style="width: 100%"
                        :tree-data="menuTreeData"
                        :field-names="{ children: 'children', label: 'title', value: '_id' }"
                        tree-checkable
                        allow-clear
                        placeholder="请选择菜单权限"
                        tree-default-expand-all
                    />
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model:value="addForm.description" placeholder="请输入描述内容" :rows="3" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { addRoleList, getRoleList, getMenuTree, updateRoleList } from './api/index';

type Row = {
    _id: string;
    name: string; // 角色编号
    displayName: string; // 角色显示名称
    description: string;
    status: string;
    menus: { _id: string; title: string }[] | string[]; // 后端 populate 后是对象数组，否则是 ID 数组
    createdAt: string;
    updatedAt: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<string[]>([]);

const pagination = reactive({ current: 1, pageSize: 15, total: 0 });
const jumpPage = ref(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '角色编号', dataIndex: 'name', key: 'name', width: 180 },
    { title: '角色名称', dataIndex: 'displayName', key: 'displayName', width: 220 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);
const menuTreeData = ref<any[]>([]);

const getRoleListData = async () => {
    try {
        const res = await getRoleList({
            page: pagination.current,
            limit: pagination.pageSize,
            // 后端支持 name 搜索
            name: searchForm.name || searchForm.code, // 暂时模糊匹配
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

const fetchMenuTree = async () => {
    try {
        const res = await getMenuTree();
        if (res.data.success) {
            menuTreeData.value = res.data.data;
        }
    } catch (error) {
        console.error('获取菜单树失败', error);
    }
};

const onSelectChange = (keys: string[]) => {
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
const currentId = ref<string | null>(null);
const addForm = reactive({
    name: '', // 角色编号/唯一标识
    displayName: '', // 角色名称
    status: 'active',
    menus: [] as string[],
    description: '', // 描述
});

const handleAdd = () => {
    currentId.value = null;
    addForm.name = '';
    addForm.displayName = '';
    addForm.status = 'active';
    addForm.menus = [];
    addForm.description = '';
    addModalVisible.value = true;
    // 确保菜单数据已加载
    if (menuTreeData.value.length === 0) {
        fetchMenuTree();
    }
};

const handleEdit = (record: Row | null) => {
    const target =
        record ||
        (selectedRowKeys.value.length === 1
            ? tableData.value.find(item => item._id === selectedRowKeys.value[0])
            : null);
    if (!target) return;

    currentId.value = target._id;
    addForm.name = target.name;
    addForm.displayName = target.displayName;
    addForm.status = target.status;
    addForm.description = target.description;

    // 处理 menus 回显：如果是对象数组提取ID，如果是ID数组直接使用
    if (Array.isArray(target.menus) && target.menus.length > 0) {
        if (typeof target.menus[0] === 'object') {
            addForm.menus = ((target.menus as Array<{ _id?: string }> | undefined) || [])
                .map(m => m._id)
                .filter((id): id is string => typeof id === 'string');
        } else {
            addForm.menus = target.menus as string[];
        }
    } else {
        addForm.menus = [];
    }

    addModalVisible.value = true;
    if (menuTreeData.value.length === 0) {
        fetchMenuTree();
    }
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
        let res;
        if (currentId.value) {
            res = await updateRoleList(currentId.value, addForm);
        } else {
            res = await addRoleList(addForm);
        }

        if (res.data.success) {
            message.success(currentId.value ? '修改成功' : '添加成功');
            addModalVisible.value = false;
            getRoleListData();
        } else {
            message.error(res.data.message || (currentId.value ? '修改失败' : '添加失败'));
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

// 模拟添加数据
const handleSimulateAdd = async () => {
    const randomId = Math.floor(Math.random() * 10000);
    const mockData = {
        name: `ROLE_TEST_${randomId}`,
        displayName: `测试角色${randomId}`,
        status: 'active',
        description: '这是通过模拟添加生成的测试数据',
        menus: [], // 暂不关联菜单
    };
    try {
        const res = await addRoleList(mockData);
        if (res.data.success) {
            message.success(`模拟添加成功：${mockData.displayName}`);
            getRoleListData();
        } else {
            message.error(res.data.message || '模拟添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

onMounted(() => {
    getRoleListData();
    fetchMenuTree();
});
</script>
