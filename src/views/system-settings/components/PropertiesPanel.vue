<template>
    <div class="properties-panel">
        <div class="panel-header">属性配置</div>
        <div v-if="!element" class="empty-text">请选择一个元素</div>
        <div v-else class="panel-content">
            <a-form layout="vertical">
                <!-- 基础信息 -->
                <a-divider orientation="left">基础信息</a-divider>
                <a-form-item label="ID">
                    <a-input v-model:value="formData.id" @change="updateId" />
                </a-form-item>
                <a-form-item label="名称">
                    <a-input v-model:value="formData.name" @change="updateName" />
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea v-model:value="formData.documentation" @change="updateDocumentation" />
                </a-form-item>

                <!-- 流程/任务扩展属性 -->
                <template v-if="isUserTask">
                    <a-divider orientation="left">任务配置</a-divider>
                    <a-form-item label="处理人 (Assignee)">
                        <!-- Support selecting from users or entering manually -->
                        <a-select
                            v-model:value="formData.assignee"
                            :options="userOptions"
                            show-search
                            allowClear
                            placeholder="选择用户或输入ID"
                            mode="combobox"
                            @change="updateProperty('assignee')"
                        />
                    </a-form-item>
                    <a-form-item label="候选用户 (Candidate Users)">
                        <a-select
                            v-model:value="formData.candidateUsers"
                            :options="userOptions"
                            mode="multiple"
                            placeholder="选择多个用户"
                            @change="val => updateProperty('candidateUsers', val)"
                        />
                    </a-form-item>
                    <a-form-item label="候选组 (Candidate Groups)">
                        <a-select
                            v-model:value="formData.candidateGroups"
                            :options="roleOptions"
                            mode="multiple"
                            placeholder="选择角色/组"
                            @change="val => updateProperty('candidateGroups', val)"
                        />
                    </a-form-item>
                    <a-form-item label="到期时间 (Due Date)">
                        <a-date-picker
                            show-time
                            v-model:value="formData.dueDate"
                            @change="updateProperty('dueDate')"
                            style="width: 100%"
                        />
                    </a-form-item>
                </template>

                <template v-if="isSequenceFlow">
                    <a-divider orientation="left">连线配置</a-divider>
                    <a-form-item label="条件表达式">
                        <a-input
                            v-model:value="formData.conditionExpression"
                            @change="updateCondition"
                            placeholder="${var == 'value'}"
                        />
                    </a-form-item>
                </template>
            </a-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { getRoleList, getEmployeeList } from '../api/index';

const props = defineProps<{
    modeler: any;
    element: any;
}>();

const formData = ref({
    id: '',
    name: '',
    documentation: '',
    assignee: undefined as string | undefined,
    candidateUsers: [] as string[],
    candidateGroups: [] as string[],
    dueDate: null as any,
    conditionExpression: '',
});

const roleOptions = ref<Array<{ value: string; label: string }>>([]);
const userOptions = ref<Array<{ value: string; label: string }>>([]);

onMounted(async () => {
    try {
        const [roleRes, userRes] = await Promise.all([getRoleList({ limit: 100 }), getEmployeeList({ limit: 100 })]);

        if (roleRes.data.success) {
            roleOptions.value = roleRes.data.data.map((r: any) => ({
                label: r.displayName,
                value: r.name, // Use role name (e.g., 'manager') as ID
            }));
        }

        if (userRes.data.success) {
            userOptions.value = userRes.data.data.map((u: any) => ({
                label: `${u.realName} (${u.username})`,
                value: u.username, // Use username as ID
            }));
        }
    } catch (e) {
        console.error(e);
    }
});

const isUserTask = computed(() => {
    return props.element?.type === 'bpmn:UserTask';
});

const isSequenceFlow = computed(() => {
    return props.element?.type === 'bpmn:SequenceFlow';
});

// Load element data when element changes
watch(
    () => props.element,
    element => {
        if (!element) return;
        const businessObject = element.businessObject;

        const candidateUsers = businessObject.get('flowable:candidateUsers');
        const candidateGroups = businessObject.get('flowable:candidateGroups');

        formData.value = {
            id: businessObject.id,
            name: businessObject.name || '',
            documentation: businessObject.documentation?.[0]?.text || '',
            assignee: businessObject.get('flowable:assignee') || undefined,
            candidateUsers: candidateUsers ? candidateUsers.split(',') : [],
            candidateGroups: candidateGroups ? candidateGroups.split(',') : [],
            dueDate: businessObject.get('flowable:dueDate') ? dayjs(businessObject.get('flowable:dueDate')) : null,
            conditionExpression: businessObject.conditionExpression?.body || '',
        };
    },
    { immediate: true }
);

const updateId = () => {
    if (!props.modeler || !props.element) return;
    const modeling = props.modeler.get('modeling');
    modeling.updateProperties(props.element, {
        id: formData.value.id,
    });
};

const updateName = () => {
    if (!props.modeler || !props.element) return;
    const modeling = props.modeler.get('modeling');
    modeling.updateProperties(props.element, {
        name: formData.value.name,
    });
};

const updateDocumentation = () => {
    if (!props.modeler || !props.element) return;
    const bpmnFactory = props.modeler.get('bpmnFactory');
    const documentation = bpmnFactory.create('bpmn:Documentation', {
        text: formData.value.documentation,
    });
    const modeling = props.modeler.get('modeling');
    modeling.updateProperties(props.element, {
        documentation: [documentation],
    });
};

const updateProperty = (key: string, val?: any) => {
    if (!props.modeler || !props.element) return;
    const modeling = props.modeler.get('modeling');

    // Handle array to comma-separated string for multi-selects
    let value = val !== undefined ? val : (formData.value as any)[key];

    if (Array.isArray(value)) {
        value = value.join(',');
    }

    if (key === 'dueDate' && value) {
        value = dayjs(value).toISOString();
    }

    modeling.updateProperties(props.element, {
        [`flowable:${key}`]: value,
    });
};

const updateCondition = () => {
    if (!props.modeler || !props.element) return;
    const moddle = props.modeler.get('moddle');
    const modeling = props.modeler.get('modeling');

    const conditionExpression = moddle.create('bpmn:FormalExpression', {
        body: formData.value.conditionExpression,
    });

    modeling.updateProperties(props.element, {
        conditionExpression: conditionExpression,
    });
};
</script>

<style scoped>
.properties-panel {
    width: 300px;
    height: 100%;
    border-left: 1px solid #ddd;
    background: #f8f8f8;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.panel-header {
    padding: 10px;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    background: #fff;
}

.panel-content {
    padding: 15px;
    flex: 1;
}

.empty-text {
    padding: 20px;
    text-align: center;
    color: #999;
}
</style>
