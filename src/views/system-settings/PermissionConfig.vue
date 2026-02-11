<template>
    <div class="bg-[#f0f2f5] p-6">
        <a-card title="权限配置" :bordered="false">
            <template #extra>
                <a-button type="primary" @click="handleSave" :loading="saving">保存配置</a-button>
            </template>

            <div class="flex gap-6">
                <!-- Left: Role List -->
                <div class="w-64 border-r pr-6">
                    <h3 class="mb-4 font-bold text-gray-700">选择角色</h3>
                    <a-list :data-source="roleList" size="small" bordered>
                        <template #renderItem="{ item }">
                            <a-list-item
                                class="cursor-pointer hover:bg-blue-50 transition-colors"
                                :class="{ 'bg-blue-100': currentRole?._id === item._id }"
                                @click="handleRoleSelect(item)"
                            >
                                <div class="flex justify-between w-full">
                                    <span>{{ item.displayName }}</span>
                                    <span class="text-gray-400 text-xs">{{ item.name }}</span>
                                </div>
                            </a-list-item>
                        </template>
                    </a-list>
                </div>

                <!-- Right: Permissions Matrix -->
                <div class="flex-1">
                    <div v-if="!currentRole" class="text-center text-gray-400 mt-20">请选择一个角色以配置权限</div>
                    <div v-else>
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-700">
                                配置 {{ currentRole.displayName }} 的资源权限
                                <span v-if="currentRole.name === 'admin'" class="ml-2 text-xs text-red-500">
                                    (超级管理员拥有所有权限，无需配置)
                                </span>
                            </h3>
                            <a-button size="small" @click="handleAddResource">添加资源</a-button>
                        </div>

                        <a-table
                            :columns="columns"
                            :data-source="permissionData"
                            :pagination="false"
                            row-key="resource"
                            bordered
                            size="middle"
                        >
                            <template #bodyCell="{ column, record, index }">
                                <template v-if="column.key === 'resource'">
                                    <!-- Use Select for Resource Key -->
                                    <a-select
                                        v-if="record.isNew"
                                        v-model:value="record.resource"
                                        show-search
                                        placeholder="选择路由资源"
                                        style="width: 100%"
                                        :options="routeOptions"
                                        :filter-option="filterOption"
                                    ></a-select>
                                    <span v-else>{{ getResourceLabel(record.resource) }}</span>
                                </template>

                                <template v-else-if="column.key === 'methods'">
                                    <a-checkbox-group v-model:value="record.methods">
                                        <a-checkbox value="GET">GET (查询)</a-checkbox>
                                        <a-checkbox value="POST">POST (新增)</a-checkbox>
                                        <a-checkbox value="PUT">PUT (修改)</a-checkbox>
                                        <a-checkbox value="DELETE">DELETE (删除)</a-checkbox>
                                    </a-checkbox-group>
                                </template>

                                <template v-else-if="column.key === 'action'">
                                    <a-button type="link" danger @click="handleRemoveResource(index)">移除</a-button>
                                </template>
                            </template>
                        </a-table>
                    </div>
                </div>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getRoleList, updateRoleList } from './api/index';

const router = useRouter();

type Permission = {
    resource: string;
    methods: string[];
    isNew?: boolean;
};

type Role = {
    _id: string;
    name: string;
    displayName: string;
    permissions: Permission[];
};

const roleList = ref<Role[]>([]);
const currentRole = ref<Role | null>(null);
const permissionData = ref<Permission[]>([]);
const saving = ref(false);

const columns = [
    { title: '资源标识 (Resource Key)', key: 'resource', width: '30%' },
    { title: '允许的操作 (Methods)', key: 'methods' },
    { title: '操作', key: 'action', width: '100px' },
];

// Generate route options from router
const routeOptions = computed(() => {
    const routes = router.getRoutes();
    return routes
        .filter(r => r.name && r.meta?.title) // Filter valid routes
        .map(r => ({
            label: `${r.meta.title} (${String(r.name)})`,
            value: String(r.name),
            title: r.meta.title, // For search
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
});

const filterOption = (input: string, option: any) => {
    return (
        option.label.toLowerCase().includes(input.toLowerCase()) ||
        option.value.toLowerCase().includes(input.toLowerCase())
    );
};

const getResourceLabel = (key: string) => {
    const option = routeOptions.value.find(o => o.value === key);
    return option ? option.label : key;
};

const fetchRoles = async () => {
    try {
        const res = await getRoleList({ limit: 100 });
        if (res.data.success) {
            roleList.value = res.data.data;
        }
    } catch (error) {
        console.error('Fetch roles error:', error);
    }
};

const handleRoleSelect = (role: Role) => {
    currentRole.value = role;
    // Clone permissions to avoid direct mutation until save
    permissionData.value = role.permissions ? JSON.parse(JSON.stringify(role.permissions)) : [];
};

const handleAddResource = () => {
    permissionData.value.push({
        resource: '',
        methods: [],
        isNew: true,
    });
};

const handleRemoveResource = (index: number) => {
    permissionData.value.splice(index, 1);
};

const handleSave = async () => {
    if (!currentRole.value) return;

    // Validate: Must have resource and at least one method
    const validPermissions = permissionData.value.filter(p => p.resource && p.resource.trim() !== '');

    // Strict validation for empty methods
    const invalidEntries = validPermissions.filter(p => !p.methods || p.methods.length === 0);
    if (invalidEntries.length > 0) {
        message.warning('请为所有资源选择至少一种操作方法 (GET/POST/PUT/DELETE)');
        return;
    }

    // Check for duplicates
    const resources = validPermissions.map(p => p.resource);
    if (new Set(resources).size !== resources.length) {
        message.warning('存在重复的资源标识，请检查');
        return;
    }

    saving.value = true;
    try {
        const res = await updateRoleList(currentRole.value._id, {
            ...currentRole.value,
            permissions: validPermissions,
        });

        if (res.data.success) {
            message.success('权限配置已保存');
            // Update local list
            const roleIndex = roleList.value.findIndex(r => r._id === currentRole.value?._id);
            if (roleIndex !== -1) {
                roleList.value[roleIndex].permissions = validPermissions;
            }
            currentRole.value.permissions = validPermissions;
        } else {
            message.error(res.data.message || '保存失败');
        }
    } catch (error) {
        console.error(error);
        message.error('保存出错');
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchRoles();
});
</script>
