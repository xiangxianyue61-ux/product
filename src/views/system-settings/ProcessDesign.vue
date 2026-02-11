<template>
    <div class="process-design-container">
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleSaveClick">部署流程</a-button>
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

        <!-- Deployment Config Modal -->
        <a-modal v-model:open="deployModalVisible" title="流程部署配置" @ok="handleDeploy">
            <a-form layout="vertical">
                <a-form-item label="流程名称" required>
                    <a-input v-model:value="deployForm.name" placeholder="如：请假流程" />
                </a-form-item>
                <a-form-item label="流程标识 (Key)" required>
                    <a-input v-model:value="deployForm.key" placeholder="如：leave-process" />
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model:value="deployForm.description" />
                </a-form-item>
                <a-form-item label="触发角色 (自动关联)" help="当此角色的用户发起流程时，将自动使用此流程定义">
                    <a-select
                        v-model:value="deployForm.triggerRole"
                        :options="roleOptions"
                        placeholder="选择角色"
                        allowClear
                        style="width: 100%"
                        :loading="loadingRoles"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';

import flowableModdleDescriptor from './components/flowable.json';
import PropertiesPanel from './components/PropertiesPanel.vue';
import { message, Modal, Input, Select, Form } from 'ant-design-vue';
import { saveWorkflowDefinition, getRoleList } from './api/index';

const canvasRef = ref<HTMLElement | null>(null);
const modeler = shallowRef<any>(null);
const selectedElement = ref<any>(null);

// Deployment Config
const deployModalVisible = ref(false);
const deployForm = ref({
    name: '',
    key: '',
    description: '',
    triggerRole: undefined as string | undefined,
});
const roleOptions = ref<Array<{ value: string; label: string }>>([]);
const loadingRoles = ref(false);

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
    // Load Roles for Trigger Config
    loadingRoles.value = true;
    try {
        const res = await getRoleList({ limit: 100 });
        if (res.data.success) {
            roleOptions.value = res.data.data.map((r: any) => ({
                label: r.displayName,
                value: r.name,
            }));
        } else {
            console.warn('Failed to load roles:', res.data.message);
        }
    } catch (e) {
        console.error('Error loading roles:', e);
    } finally {
        loadingRoles.value = false;
    }

    if (canvasRef.value) {
        modeler.value = new BpmnModeler({
            container: canvasRef.value,
            keyboard: {
                bindTo: window,
            },
            moddleExtensions: {
                flowable: flowableModdleDescriptor,
            },
        });

        createNewDiagram();

        // Listen to selection events
        modeler.value.on('selection.changed', (e: any) => {
            const selection = e.newSelection;
            selectedElement.value = selection && selection.length > 0 ? selection[0] : null;
        });

        modeler.value.on('element.changed', (e: any) => {
            if (e.element === selectedElement.value) {
                // Force update if needed, but Vue reactivity usually handles prop updates
                // selectedElement.value = { ...e.element };
                // Deep copy might be expensive, rely on watcher in PropertiesPanel
            }
        });
    }
});

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

const handleSaveClick = () => {
    deployModalVisible.value = true;
};

const handleDeploy = async () => {
    if (!deployForm.value.name || !deployForm.value.key) {
        message.warning('请输入流程名称和标识');
        return;
    }

    try {
        const { xml } = await modeler.value.saveXML({ format: true });

        const res = await saveWorkflowDefinition({
            ...deployForm.value,
            xml,
        });

        if (res.data.success) {
            message.success('流程部署成功');
            deployModalVisible.value = false;
        } else {
            message.error(res.data.message || '部署失败');
        }
    } catch (err) {
        console.error(err);
        message.error('保存/部署失败');
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
.process-design-container {
    /* 铺满视口，覆盖默认内边距 */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    z-index: 1; /* 确保在面包屑之上 */
}

.toolbar {
    padding: 10px 20px;
    border-bottom: 1px solid #ddd;
    background: #f5f5f5;
}

.main-content {
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
