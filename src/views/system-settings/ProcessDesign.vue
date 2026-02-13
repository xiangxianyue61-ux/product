<template>
    <div class="process-template-container">
        <!-- 标签页切换 -->
        <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
            <a-tab-pane key="templates" tab="流程模板管理">
                <!-- 流程模板管理表格 -->
                <div class="template-management">
                    <div class="toolbar">
                        <a-space>
                            <a-button type="primary" @click="handleAddTemplate">
                                <template #icon><PlusOutlined /></template>
                                新增自定义模板
                            </a-button>
                            <a-button @click="loadTemplates">
                                <template #icon><ReloadOutlined /></template>
                                刷新
                            </a-button>
                        </a-space>
                    </div>

                    <a-table
                        :columns="columns"
                        :data-source="templates"
                        :loading="tableLoading"
                        :pagination="pagination"
                        @change="handleTableChange"
                        row-key="_id"
                    >
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'status'">
                                <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                                    {{ record.status === 'active' ? '启用' : '禁用' }}
                                </a-tag>
                            </template>
                            <template v-else-if="column.key === 'triggerRole'">
                                {{ getRoleLabel(record.triggerRole) }}
                            </template>
                            <template v-else-if="column.key === 'isTemplate'">
                                <a-tag :color="record.isTemplate ? 'blue' : 'default'">
                                    {{ record.isTemplate ? '系统模板' : '自定义' }}
                                </a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleViewTemplate(record)">
                                        查看
                                    </a-button>
                                    <a-button type="link" size="small" @click="handleEditTemplate(record)">
                                        编辑
                                    </a-button>
                                    <a-button
                                        type="link"
                                        size="small"
                                        @click="handleUseTemplate(record)"
                                        v-if="record.isTemplate"
                                    >
                                        使用模板
                                    </a-button>
                                    <a-popconfirm
                                        title="确定删除此流程模板吗？"
                                        @confirm="handleDeleteTemplate(record._id)"
                                        v-if="!record.isTemplate"
                                    >
                                        <a-button type="link" size="small" danger>删除</a-button>
                                    </a-popconfirm>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </a-tab-pane>

            <a-tab-pane key="roleConfig" tab="角色模板配置">
                <!-- 角色模板配置 -->
                <div class="role-config-container">
                    <a-alert
                        message="角色模板配置说明"
                        description="为每个角色配置默认的审批流程模板。当该角色的用户发起流程时，将自动使用配置的审批流程。"
                        type="info"
                        show-icon
                        style="margin-bottom: 16px"
                    />

                    <a-table
                        :columns="roleColumns"
                        :data-source="roleWorkflows"
                        :loading="roleTableLoading"
                        :pagination="false"
                        row-key="role"
                    >
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'templates'">
                                <a-tag v-for="tpl in record.workflows" :key="tpl.key" color="blue" style="margin: 2px">
                                    {{ tpl.name }}
                                </a-tag>
                                <a-tag v-if="!record.workflows || record.workflows.length === 0" color="default">
                                    未配置
                                </a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleConfigRoleTemplate(record)">
                                        配置模板
                                    </a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </a-tab-pane>
        </a-tabs>

        <!-- BPMN流程设计器弹窗 -->
        <a-modal
            v-model:open="designerVisible"
            title="流程设计器"
            width="90%"
            :footer="null"
            :destroy-on-close="true"
            wrap-class-name="full-modal"
        >
            <div class="designer-container">
                <div class="toolbar">
                    <a-space>
                        <a-button type="primary" @click="handleSaveClick">保存流程</a-button>
                        <a-button @click="handleExportXML">导出XML</a-button>
                        <a-button @click="handleExportSVG">导出SVG</a-button>
                        <a-upload accept=".xml,.bpmn" :show-upload-list="false" :before-upload="handleImport">
                            <a-button>导入流程</a-button>
                        </a-upload>
                    </a-space>
                </div>
                <div class="main-content">
                    <div class="canvas" ref="canvasRef"></div>
                    <PropertiesPanel :modeler="modeler" :element="selectedElement" />
                </div>
            </div>
        </a-modal>

        <!-- 角色模板配置弹窗 -->
        <a-modal v-model:open="roleConfigModalVisible" title="角色模板配置" @ok="handleSaveRoleConfig" width="700px">
            <a-form layout="vertical">
                <a-form-item label="角色">
                    <a-input :value="currentRole?.displayName" disabled />
                </a-form-item>
                <a-form-item label="选择审批流程模板">
                    <a-checkbox-group v-model:value="selectedTemplateKeys" style="width: 100%">
                        <a-row :gutter="[16, 16]">
                            <a-col :span="24" v-for="tpl in availableTemplates" :key="tpl.key">
                                <a-checkbox :value="tpl.key">
                                    <div>
                                        <strong>{{ tpl.name }}</strong>
                                        <div style="color: #999; font-size: 12px">{{ tpl.description }}</div>
                                    </div>
                                </a-checkbox>
                            </a-col>
                        </a-row>
                    </a-checkbox-group>
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 流程配置弹窗 -->
        <a-modal v-model:open="configModalVisible" title="流程配置" @ok="handleSaveConfig" width="600px">
            <a-form layout="vertical">
                <a-form-item label="流程名称" required>
                    <a-input v-model:value="configForm.name" placeholder="如：请假审批流程" />
                </a-form-item>
                <a-form-item label="流程标识 (Key)" required>
                    <a-input
                        v-model:value="configForm.key"
                        placeholder="如：leave-approval"
                        :disabled="editingTemplate !== null"
                    />
                </a-form-item>
                <a-form-item label="流程描述">
                    <a-textarea v-model:value="configForm.description" :rows="3" />
                </a-form-item>
                <a-form-item label="触发角色" help="当此角色的用户发起流程时，将自动使用此流程">
                    <a-select
                        v-model:value="configForm.triggerRole"
                        :options="roleOptions"
                        placeholder="选择角色"
                        allowClear
                        :loading="loadingRoles"
                    />
                </a-form-item>
                <a-form-item label="状态">
                    <a-radio-group v-model:value="configForm.status">
                        <a-radio value="active">启用</a-radio>
                        <a-radio value="inactive">禁用</a-radio>
                    </a-radio-group>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, nextTick } from 'vue';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';

import flowableModdleDescriptor from './components/flowable.json';
import PropertiesPanel from './components/PropertiesPanel.vue';
import { message } from 'ant-design-vue';
import {
    saveWorkflowDefinition,
    getWorkflowDefinitions,
    updateWorkflowDefinition,
    deleteWorkflowDefinition,
    getRoleList,
} from './api/index';

const canvasRef = ref<HTMLElement | null>(null);
const modeler = shallowRef<any>(null);
const selectedElement = ref<any>(null);

// Table Data
const templates = ref<any[]>([]);
const tableLoading = ref(false);
const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
});

// Modals
const designerVisible = ref(false);
const configModalVisible = ref(false);
const editingTemplate = ref<any>(null);

// Config Form
const configForm = ref({
    name: '',
    key: '',
    description: '',
    triggerRole: undefined as string | undefined,
    status: 'active',
});

const roleOptions = ref<Array<{ value: string; label: string }>>([]);
const loadingRoles = ref(false);

// 标签页
const activeTab = ref('templates');

// 角色模板配置
const roleWorkflows = ref<any[]>([]);
const roleTableLoading = ref(false);
const roleConfigModalVisible = ref(false);
const currentRole = ref<any>(null);
const selectedTemplateKeys = ref<string[]>([]);
const availableTemplates = ref<any[]>([]);

// Table Columns
const columns = [
    { title: '流程名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '流程标识', dataIndex: 'key', key: 'key', width: 150 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '触发角色', key: 'triggerRole', width: 150 },
    { title: '类型', key: 'isTemplate', width: 100 },
    { title: '状态', key: 'status', width: 80 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '操作', key: 'action', width: 250, fixed: 'right' },
];

const roleColumns = [
    { title: '角色名称', dataIndex: 'displayName', key: 'displayName', width: 150 },
    { title: '角色标识', dataIndex: 'role', key: 'role', width: 150 },
    { title: '已配置模板', key: 'templates', ellipsis: true },
    { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const initDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

onMounted(async () => {
    await loadRoles();
    await loadTemplates();
    await loadRoleWorkflows();
});

const loadRoles = async () => {
    loadingRoles.value = true;
    try {
        const res = await getRoleList({ limit: 100 });
        if (res.data.success) {
            roleOptions.value = res.data.data.map((r: any) => ({
                label: r.displayName,
                value: r.name,
            }));
        }
    } catch (e) {
        console.error('Error loading roles:', e);
    } finally {
        loadingRoles.value = false;
    }
};

const loadTemplates = async () => {
    tableLoading.value = true;
    try {
        const res = await getWorkflowDefinitions({
            page: pagination.value.current,
            limit: pagination.value.pageSize,
        });
        if (res.data.success) {
            templates.value = res.data.data;
            pagination.value.total = res.data.total || res.data.data.length;
        } else {
            message.error(res.data.message || '加载失败');
        }
    } catch (e) {
        console.error('Error loading templates:', e);
        message.error('加载流程模板失败');
    } finally {
        tableLoading.value = false;
    }
};

const handleTableChange = (pag: any) => {
    pagination.value.current = pag.current;
    pagination.value.pageSize = pag.pageSize;
    loadTemplates();
};

const getRoleLabel = (roleName: string) => {
    const role = roleOptions.value.find(r => r.value === roleName);
    return role ? role.label : roleName || '-';
};

const handleTabChange = (key: string) => {
    if (key === 'roleConfig') {
        loadRoleWorkflows();
    }
};

const loadRoleWorkflows = async () => {
    roleTableLoading.value = true;
    try {
        // 获取所有角色
        const rolesRes = await getRoleList({ limit: 100 });
        if (!rolesRes.data.success) {
            return;
        }

        // 获取所有流程定义
        const workflowsRes = await getWorkflowDefinitions({ page: 1, limit: 1000 });
        if (!workflowsRes.data.success) {
            return;
        }

        const allWorkflows = workflowsRes.data.data;

        // 构建角色与模板的映射
        roleWorkflows.value = rolesRes.data.data.map((role: any) => {
            const roleFlows = allWorkflows.filter((wf: any) => wf.triggerRole === role.name);
            return {
                role: role.name,
                displayName: role.displayName,
                workflows: roleFlows,
            };
        });
    } catch (e) {
        console.error('Error loading role workflows:', e);
        message.error('加载角色模板配置失败');
    } finally {
        roleTableLoading.value = false;
    }
};

const handleConfigRoleTemplate = async (record: any) => {
    currentRole.value = record;

    // 加载所有可用模板（包括系统模板和其他流程）
    try {
        const res = await getWorkflowDefinitions({ page: 1, limit: 1000 });
        if (res.data.success) {
            availableTemplates.value = res.data.data;
            // 设置当前角色已选择的模板
            selectedTemplateKeys.value = record.workflows.map((wf: any) => wf.key);
            roleConfigModalVisible.value = true;
        }
    } catch (e) {
        console.error('Error loading templates:', e);
        message.error('加载模板列表失败');
    }
};

const handleSaveRoleConfig = async () => {
    if (!currentRole.value) return;

    try {
        // 更新所有相关流程的triggerRole
        const updatePromises = [];

        // 1. 清除该角色的所有现有流程关联
        for (const wf of currentRole.value.workflows) {
            updatePromises.push(
                updateWorkflowDefinition(wf._id, {
                    ...wf,
                    triggerRole: null,
                })
            );
        }

        // 2. 设置新选择的流程关联
        for (const key of selectedTemplateKeys.value) {
            const workflow = availableTemplates.value.find(wf => wf.key === key);
            if (workflow) {
                updatePromises.push(
                    updateWorkflowDefinition(workflow._id, {
                        ...workflow,
                        triggerRole: currentRole.value.role,
                    })
                );
            }
        }

        await Promise.all(updatePromises);
        message.success('角色模板配置成功');
        roleConfigModalVisible.value = false;
        await loadRoleWorkflows();
    } catch (e) {
        console.error('Error saving role config:', e);
        message.error('保存配置失败');
    }
};

const initModeler = async () => {
    await nextTick();

    // 如果已存在modeler实例，先销毁
    if (modeler.value) {
        modeler.value.destroy();
        modeler.value = null;
    }

    if (canvasRef.value) {
        modeler.value = new BpmnModeler({
            container: canvasRef.value,
            moddleExtensions: {
                flowable: flowableModdleDescriptor,
            },
        });

        modeler.value.on('selection.changed', (e: any) => {
            const selection = e.newSelection;
            selectedElement.value = selection && selection.length > 0 ? selection[0] : null;
        });
    }
};

const createNewDiagram = async () => {
    try {
        await modeler.value.importXML(initDiagram);
        // Center the view
        const canvas = modeler.value.get('canvas');
        canvas.zoom('fit-viewport');
    } catch (err) {
        console.error('Error rendering diagram:', err);
    }
};

const handleAddTemplate = async () => {
    editingTemplate.value = null;
    configForm.value = {
        name: '',
        key: '',
        description: '',
        triggerRole: undefined,
        status: 'active',
    };
    designerVisible.value = true;
    await initModeler();
    createNewDiagram();
};

const handleEditTemplate = async (record: any) => {
    editingTemplate.value = record;
    configForm.value = {
        name: record.name,
        key: record.key,
        description: record.description || '',
        triggerRole: record.triggerRole,
        status: record.status,
    };
    designerVisible.value = true;
    await initModeler();
    if (record.xml) {
        try {
            await modeler.value.importXML(record.xml);
            const canvas = modeler.value.get('canvas');
            canvas.zoom('fit-viewport');
        } catch (err) {
            console.error('Error loading template:', err);
            message.error('加载流程失败');
        }
    } else {
        createNewDiagram();
    }
};

const handleViewTemplate = async (record: any) => {
    editingTemplate.value = record;
    designerVisible.value = true;
    await initModeler();
    if (record.xml) {
        try {
            await modeler.value.importXML(record.xml);
            const canvas = modeler.value.get('canvas');
            canvas.zoom('fit-viewport');
        } catch (err) {
            console.error('Error loading template:', err);
        }
    }
};

const handleUseTemplate = async (record: any) => {
    editingTemplate.value = null;
    configForm.value = {
        name: `${record.name}-副本`,
        key: '',
        description: record.description || '',
        triggerRole: undefined,
        status: 'active',
    };
    designerVisible.value = true;
    await initModeler();
    if (record.xml) {
        try {
            await modeler.value.importXML(record.xml);
            const canvas = modeler.value.get('canvas');
            canvas.zoom('fit-viewport');
        } catch (err) {
            console.error('Error loading template:', err);
        }
    }
};

const handleDeleteTemplate = async (id: string) => {
    try {
        const res = await deleteWorkflowDefinition(id);
        if (res.data.success) {
            message.success('删除成功');
            loadTemplates();
        } else {
            message.error(res.data.message || '删除失败');
        }
    } catch (e) {
        console.error('Error deleting template:', e);
        message.error('删除失败');
    }
};

const handleSaveClick = () => {
    configModalVisible.value = true;
};

const handleSaveConfig = async () => {
    if (!configForm.value.name || !configForm.value.key) {
        message.warning('请输入流程名称和标识');
        return;
    }

    try {
        const { xml } = await modeler.value.saveXML({ format: true });

        const data = {
            ...configForm.value,
            xml,
            isTemplate: false,
        };

        let res;
        if (editingTemplate.value) {
            res = await updateWorkflowDefinition(editingTemplate.value._id, data);
        } else {
            res = await saveWorkflowDefinition(data);
        }

        if (res.data.success) {
            message.success(editingTemplate.value ? '更新成功' : '保存成功');
            configModalVisible.value = false;
            designerVisible.value = false;
            loadTemplates();
        } else {
            message.error(res.data.message || '保存失败');
        }
    } catch (err) {
        console.error(err);
        message.error('保存失败');
    }
};

const handleExportXML = async () => {
    try {
        const { xml } = await modeler.value.saveXML({ format: true });
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'process.bpmn20.xml';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
    }
};

const handleExportSVG = async () => {
    try {
        const { svg } = await modeler.value.saveSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'process.svg';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
    }
};

const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
        const xml = e.target?.result as string;
        try {
            await modeler.value.importXML(xml);
            message.success('导入成功');
        } catch (err) {
            console.error(err);
            message.error('导入格式错误');
        }
    };
    reader.readAsText(file);
    return false; // Prevent upload
};
</script>

<style scoped>
.process-template-container {
    padding: 20px;
    background: #fff;
    min-height: 600px;
}

.role-config-container {
    padding: 10px 0;
}

.template-management .toolbar {
    margin-bottom: 16px;
}

.designer-container {
    height: 70vh;
    display: flex;
    flex-direction: column;
}

.designer-container .toolbar {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    background: #f5f5f5;
}

.designer-container .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.canvas {
    flex: 1;
    height: 100%;
    position: relative;
    background: #fff;
}
</style>

<style>
.full-modal .ant-modal-body {
    padding: 0;
}
</style>
