<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="菜单编号">
                    <a-input v-model="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="菜单名称">
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
                <a-button @click="handleEditBatch" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="handleDeleteBatch" :disabled="selectedRowKeys.length === 0">删除</a-button>
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
                :scroll="{ x: 1200 }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleEdit(record)">编辑</a>
                            <a-divider type="vertical" />
                            <a style="color: #ff4d4f" @click="handleDelete(record)">删除</a>
                        </a-space>
                    </template>
                    <template v-else-if="column.key === 'type'">
                        <a-tag :color="record.type === 'menu' ? 'blue' : 'green'">
                            {{ record.type === 'menu' ? '菜单' : '按钮' }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'icon'">
                        <component v-if="record.icon" :is="record.icon" />
                        <span v-else>-</span>
                    </template>
                </template>
            </a-table>

            <!-- Hide pagination when showing tree data usually, or keep it if backend supports root pagination -->
            <!-- For now, hiding pagination as we load full tree -->
        </a-card>

        <!-- 新增/编辑菜单弹窗 -->
        <a-modal
            :open="addModalVisible"
            :title="currentId ? '编辑' : '新增'"
            width="800px"
            @ok="handleAddSubmit"
            @cancel="handleAddCancel"
        >
            <a-form :model="addForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <!-- Row 1: Type, Sort -->
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="菜单类型">
                            <a-radio-group v-model="addForm.menuType">
                                <a-radio value="1">一级菜单</a-radio>
                                <a-radio value="2">二级菜单</a-radio>
                                <a-radio value="3">三级菜单</a-radio>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="排序">
                            <a-input-number v-model="addForm.sort" placeholder="请输入数字" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Row 2: Name, Path -->
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="菜单名称" required>
                            <a-input v-model="addForm.title" placeholder="请输入内容" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="菜单路径">
                            <a-select
                                v-model:value="addForm.path"
                                show-search
                                placeholder="请选择或输入路径"
                                :options="routeOptions"
                                allow-clear
                                :filter-option="filterRouteOption"
                                @change="handlePathChange"
                            >
                                <template #dropdownRender="{ menuNode: menu }">
                                    <v-nodes :vnodes="menu" />
                                    <a-divider style="margin: 4px 0" />
                                    <div style="padding: 4px 8px; cursor: pointer" @mousedown="e => e.preventDefault()">
                                        <a-input
                                            v-model="customPathInput"
                                            placeholder="输入自定义路径"
                                            @pressEnter="addCustomPath"
                                        />
                                        <a-button type="text" @click="addCustomPath">添加</a-button>
                                    </div>
                                </template>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Extra: Route Name (Internal ID) -->
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="路由名称" required tooltip="对应路由配置中的 name">
                            <a-input v-model="addForm.name" placeholder="请输入路由Name" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12" v-if="addForm.menuType !== '1'">
                        <a-form-item label="上级菜单">
                            <a-tree-select
                                v-model:value="addForm.parentId"
                                show-search
                                style="width: 100%"
                                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                                placeholder="请选择上级菜单"
                                allow-clear
                                tree-default-expand-all
                                :tree-data="menuTreeData"
                                tree-node-filter-prop="title"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="权限标识">
                            <a-input v-model="addForm.permission" placeholder="如: sys:user:add" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Row 3: Component, Icon -->
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="前端组件">
                            <a-input v-model="addForm.component" placeholder="请输入组件路径" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="菜单图标">
                            <a-select v-model:value="addForm.icon" placeholder="请选择图标" allow-clear>
                                <a-select-option v-for="icon in iconList" :key="icon" :value="icon">
                                    <component :is="icon" />
                                    {{ icon }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Row 4: Redirect -->
                <a-row :gutter="24">
                    <a-col :span="24">
                        <a-form-item label="前端跳转地址" :label-col="{ span: 3 }" :wrapper-col="{ span: 21 }">
                            <a-input v-model="addForm.redirect" placeholder="请输入内容" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Row 5: Switches -->
                <a-row :gutter="24">
                    <a-col :span="24">
                        <a-form-item label="配置选项" :label-col="{ span: 3 }" :wrapper-col="{ span: 21 }">
                            <a-space size="large" wrap>
                                <span class="flex items-center">
                                    <span class="mr-2">是否路由菜单</span>
                                    <a-switch v-model:checked="addForm.isRoute" />
                                </span>
                                <span class="flex items-center">
                                    <span class="mr-2">隐藏路由</span>
                                    <a-switch v-model:checked="addForm.hidden" />
                                </span>
                                <span class="flex items-center">
                                    <span class="mr-2">是否缓存路由</span>
                                    <a-switch v-model:checked="addForm.keepAlive" />
                                </span>
                                <!-- Aggregate Route is not standard in Vue Router, assuming custom logic or omitted if not needed. Adding as per image -->
                                <span class="flex items-center">
                                    <span class="mr-2">聚合路由</span>
                                    <a-switch :checked="true" disabled />
                                </span>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- Row 6: Open Method -->
                <a-row :gutter="24">
                    <a-col :span="24">
                        <a-form-item label="打开方式" :label-col="{ span: 3 }" :wrapper-col="{ span: 21 }">
                            <a-radio-group v-model:value="addForm.target" button-style="solid">
                                <a-radio-button value="_self">内部</a-radio-button>
                                <a-radio-button value="_blank">外部</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, defineComponent, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { addMenuList, getMenuList, updateMenuList, deleteMenuList, getMenuTree } from './api/index';
import * as Icons from '@ant-design/icons-vue';

// Hack for VNodes in Select dropdown
const VNodes = defineComponent({
    props: {
        vnodes: {
            type: Object,
            required: true,
        },
    },
    render() {
        return this.vnodes;
    },
});

type Row = {
    _id: string;
    code: string;
    name: string;
    path: string;
    component: string;
    title: string;
    icon: string;
    sort: number;
    type: string;
    creator: string;
    createTime: string;
};

const router = useRouter();
const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<string[]>([]);
const currentId = ref<string | null>(null);

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
    { title: '菜单名称', dataIndex: 'title', key: 'title', width: 200 },
    { title: '菜单类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: 'icon', dataIndex: 'icon', key: 'icon', width: 100 },
    { title: '组件', dataIndex: 'component', key: 'component', width: 200 },
    { title: '路径', dataIndex: 'path', key: 'path', width: 200 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

const tableData = ref<Row[]>([]);
const menuTreeData = ref<any[]>([]);
const iconList = Object.keys(Icons).filter(key => key.endsWith('Outlined'));

// Route Options for Select
const routeOptions = computed(() => {
    const routes = router.getRoutes();
    return routes.map(r => ({
        label: `${r.meta?.title || r.name} (${r.path})`,
        value: r.path,
        component: r.components?.default ? (r.components.default as any).__file : '',
        name: r.name,
        meta: r.meta,
    }));
});

const customPathInput = ref('');

const filterRouteOption = (input: string, option: any) => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const addCustomPath = () => {
    // Logic to add custom path if needed, usually just typing in Select with tags mode works, but here we use simple select
    // For now, let's just assume selection from existing. If manual entry is needed, A-Select needs mode="tags" or similar,
    // or we use the input below.
    if (customPathInput.value) {
        addForm.path = customPathInput.value;
        customPathInput.value = '';
    }
};

const handlePathChange = (value: string, option: any) => {
    if (option) {
        // Auto-fill other fields based on route selection
        if (!addForm.title && option.meta?.title) addForm.title = option.meta.title;
        if (!addForm.name && option.name) addForm.name = String(option.name);
        // component path is tricky to get from build, but we can try
        // In dev, __file might exist. In prod, it won't.
        // User might need to enter it manually.
    }
};

const getMenuListData = async () => {
    try {
        // Use getMenuTree for table display to show hierarchy
        // Note: Search filters will not work with getMenuTree in current backend implementation
        // If search is needed, we might need to filter locally or use getMenuList (flat)
        // For now, prioritize tree view as requested.

        // If user is searching, use flat list? Or just filter tree locally?
        // Let's try to use tree always for now, but if search is present, maybe switch?
        // Actually, user wants "collapsible side menus", so tree is better.

        const res = await getMenuTree();
        if (res.data.success) {
            let data = res.data.data;

            // Client-side filtering if search is active
            if (searchForm.name || searchForm.code) {
                const filterTree = (items: any[]): any[] => {
                    return items
                        .map(item => {
                            const match =
                                (!searchForm.name || item.title.includes(searchForm.name)) &&
                                (!searchForm.code || item.name.includes(searchForm.code)); // assuming code maps to name
                            const children = item.children ? filterTree(item.children) : [];

                            if (match || children.length > 0) {
                                return { ...item, children: children.length > 0 ? children : undefined };
                            }
                            return null;
                        })
                        .filter(Boolean);
                };
                data = filterTree(data);
            }

            tableData.value = data;
            // pagination.total = res.data.total; // Tree API doesn't return total
        } else {
            message.error(res.data.message || '获取数据失败');
        }
    } catch (error) {
        console.error('Fetch menu list error:', error);
    }
};

const fetchMenuTree = async () => {
    try {
        const res = await getMenuTree();
        if (res.data.success) {
            // Transform for TreeSelect
            const transform = (items: any[], disableChildren = false) => {
                return items.map(item => {
                    const isDisabled = disableChildren || (currentId.value && item._id === currentId.value);
                    return {
                        label: item.title,
                        value: item._id,
                        disabled: !!isDisabled,
                        children: item.children ? transform(item.children, isDisabled) : undefined,
                    };
                });
            };
            menuTreeData.value = transform(res.data.data);
        }
    } catch (error) {
        console.error('Fetch menu tree error:', error);
    }
};

const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    getMenuListData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    getMenuListData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    getMenuListData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    getMenuListData();
};

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        getMenuListData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

// 新增/编辑逻辑
const addModalVisible = ref(false);
const addForm = reactive({
    menuType: '1',
    title: '',
    name: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    isRoute: true,
    hidden: false,
    keepAlive: true,
    redirect: '',
    target: '_self',
    permission: '',
    parentId: undefined as string | undefined,
});

const resetForm = () => {
    Object.assign(addForm, {
        menuType: '1',
        title: '',
        name: '',
        path: '',
        component: '',
        icon: '',
        sort: 0,
        isRoute: true,
        hidden: false,
        keepAlive: true,
        redirect: '',
        target: '_self',
        permission: '',
        parentId: undefined,
    });
};

const handleAdd = () => {
    currentId.value = null;
    resetForm();
    fetchMenuTree(); // Refresh tree for parent selection
    addModalVisible.value = true;
};

const handleEdit = (record: Row) => {
    currentId.value = record._id;
    resetForm();
    Object.assign(addForm, {
        ...record,
        menuType: record.type === 'button' ? '3' : !record.path || record.path === '/' ? '1' : '2', // Rough estimation
        // Real logic should rely on backend 'level' or parentId check
    });
    // Adjust menuType based on parentId
    // If has parentId, it's 2 or 3. If type is button, it's 3.
    // Simplification:
    if (record.type === 'button') {
        addForm.menuType = '3';
    } else {
        // We don't have parentId in the table row necessarily unless we populated it.
        // Assuming flat list has it or we just default to 2 if not root.
        // For accurate editing, we rely on what backend sends.
        // Let's assume the user adjusts if wrong.
    }
    fetchMenuTree();
    addModalVisible.value = true;
};

const handleEditBatch = () => {
    const row = tableData.value.find(item => item._id === selectedRowKeys.value[0]);
    if (row) handleEdit(row);
};

const handleDelete = (record: Row) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除菜单 "${record.title}" 吗？`,
        onOk: async () => {
            try {
                const res = await deleteMenuList(record._id);
                if (res.data.success) {
                    message.success('删除成功');
                    getMenuListData();
                } else {
                    message.error(res.data.message || '删除失败');
                }
            } catch (error) {
                // handled
            }
        },
    });
};

const handleDeleteBatch = () => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除选中的 ${selectedRowKeys.value.length} 项吗？`,
        onOk: async () => {
            // Batch delete not implemented in API yet, loop for now
            for (const id of selectedRowKeys.value) {
                await deleteMenuList(id);
            }
            message.success('批量删除完成');
            selectedRowKeys.value = [];
            getMenuListData();
        },
    });
};

const handleAddCancel = () => {
    addModalVisible.value = false;
};

const handleAddSubmit = async () => {
    if (!addForm.title || !addForm.name) {
        message.warning('请填写必填项');
        return;
    }

    const submitData = {
        ...addForm,
        type: addForm.menuType === '3' ? 'button' : 'menu',
        parentId: addForm.parentId || null, // Ensure parentId is null if undefined/empty
    };

    try {
        let res;
        if (currentId.value) {
            res = await updateMenuList(currentId.value, submitData);
        } else {
            res = await addMenuList(submitData);
        }

        if (res.data.success) {
            message.success(currentId.value ? '编辑成功' : '添加成功');
            addModalVisible.value = false;
            getMenuListData();
        } else {
            message.error(res.data.message || '操作失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

const handleSimulateAdd = async () => {
    const randomId = Math.floor(Math.random() * 10000);
    const mockData = {
        name: `Menu_${randomId}`,
        title: `测试菜单${randomId}`,
        path: `/test-menu-${randomId}`,
        component: '/views/Test.vue',
        icon: 'AppstoreOutlined',
        sort: randomId % 100,
        type: 'menu',
        permission: `sys:test:${randomId}`,
    };
    try {
        const res = await addMenuList(mockData);
        if (res.data.success) {
            message.success(`模拟添加成功：${mockData.title}`);
            getMenuListData();
        } else {
            message.error(res.data.message || '模拟添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

onMounted(() => {
    getMenuListData();
});
</script>
