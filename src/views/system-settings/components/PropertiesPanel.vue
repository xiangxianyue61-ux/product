<template>
    <div class="properties-panel">
        <div class="panel-header">属性配置</div>
        <div v-if="!element" class="empty-text">请选择一个元素</div>
        <div v-else class="panel-content">
            <!-- 节点类型说明 -->
            <a-alert
                :message="nodeTypeInfo.title"
                :description="nodeTypeInfo.description"
                :type="nodeTypeInfo.type"
                show-icon
                style="margin-bottom: 16px"
            >
                <template #icon>
                    <component :is="nodeTypeInfo.icon" />
                </template>
            </a-alert>

            <a-form layout="vertical">
                <!-- 基础信息 -->
                <a-divider orientation="left">基础信息</a-divider>
                <a-form-item label="ID">
                    <a-input v-model:value="formData.id" @change="updateId" />
                </a-form-item>
                <a-form-item label="名称">
                    <a-input
                        v-model:value="formData.name"
                        @change="updateName"
                        placeholder="为节点设置一个易读的名称"
                    />
                </a-form-item>
                <a-form-item label="描述">
                    <a-textarea
                        v-model:value="formData.documentation"
                        @change="updateDocumentation"
                        :rows="2"
                        placeholder="节点功能说明"
                    />
                </a-form-item>

                <!-- 流程/任务扩展属性 -->
                <template v-if="isUserTask">
                    <a-divider orientation="left">审批任务配置</a-divider>

                    <a-alert message="变量表达式" type="info" show-icon style="margin-bottom: 12px">
                        <template #description>
                            <div style="font-size: 12px">
                                使用
                                <code>${'{变量名}'}</code>
                                从流程变量获取审批人ID
                                <br />
                                示例:
                                <code>${'{teamLeaderId}'}</code>
                                或
                                <code>${'{deptManagerId}'}</code>
                            </div>
                        </template>
                    </a-alert>

                    <a-form-item label="处理人 (Assignee)" help="支持直接输入变量表达式或选择用户">
                        <a-input
                            v-model:value="formData.assignee"
                            placeholder="如：${teamLeaderId}"
                            @change="updateAssignee"
                        >
                            <template #addonAfter>
                                <a-dropdown>
                                    <a @click.prevent>
                                        快速选择
                                        <DownOutlined />
                                    </a>
                                    <template #overlay>
                                        <a-menu @click="handleQuickSelect">
                                            <a-menu-item key="${teamLeaderId}">组长审批</a-menu-item>
                                            <a-menu-item key="${deptManagerId}">部门经理审批</a-menu-item>
                                            <a-menu-item key="${ceoId}">总经理审批</a-menu-item>
                                            <a-menu-divider />
                                            <a-menu-item-group title="系统用户">
                                                <a-menu-item v-for="user in userOptions" :key="user.value">
                                                    {{ user.label }}
                                                </a-menu-item>
                                            </a-menu-item-group>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </template>
                        </a-input>
                    </a-form-item>

                    <a-form-item label="候选用户 (Candidate Users)" help="多人可处理，任一人完成即可">
                        <a-select
                            v-model:value="formData.candidateUsers"
                            :options="userOptions"
                            mode="multiple"
                            placeholder="选择多个候选用户"
                            @change="val => updateProperty('candidateUsers', val)"
                        />
                    </a-form-item>

                    <a-form-item label="候选组 (Candidate Groups)" help="角色组内任一成员可处理">
                        <a-select
                            v-model:value="formData.candidateGroups"
                            :options="roleOptions"
                            mode="multiple"
                            placeholder="选择角色/组"
                            @change="val => updateProperty('candidateGroups', val)"
                        />
                    </a-form-item>
                </template>

                <template v-if="isExclusiveGateway">
                    <a-divider orientation="left">网关配置</a-divider>
                    <a-alert message="排他网关说明" type="warning" show-icon style="margin-bottom: 12px">
                        <template #description>
                            排他网关会评估所有出口的条件表达式，选择第一个为true的分支执行。
                            <br />
                            请在每条出口连线上配置条件表达式。
                        </template>
                    </a-alert>
                </template>

                <template v-if="isSequenceFlow">
                    <a-divider orientation="left">连线配置</a-divider>
                    <a-form-item label="条件表达式" help="设置流程流转的条件">
                        <a-input
                            v-model:value="formData.conditionExpression"
                            @change="updateCondition"
                            placeholder="如：${pass == true}"
                        />
                    </a-form-item>

                    <a-collapse style="margin-top: 12px">
                        <a-collapse-panel key="1" header="常用条件表达式示例">
                            <div class="expression-examples">
                                <div class="example-item" @click="useExpression('${pass == true}')">
                                    <code>${'{pass == true}'}</code>
                                    - 审批通过
                                </div>
                                <div class="example-item" @click="useExpression('${pass == false}')">
                                    <code>${'{pass == false}'}</code>
                                    - 审批拒绝
                                </div>
                                <div class="example-item" @click="useExpression('${days <= 3}')">
                                    <code>${'{days <= 3}'}</code>
                                    - 天数小于等于3
                                </div>
                                <div class="example-item" @click="useExpression('${cost < 1000}')">
                                    <code>${'{cost < 1000}'}</code>
                                    - 费用小于1000
                                </div>
                                <div class="example-item" @click="useExpression('${priority == \'urgent\'}')">
                                    <code>${'{priority == \'urgent\''}</code>
                                    - 优先级为紧急
                                </div>
                            </div>
                        </a-collapse-panel>
                    </a-collapse>
                </template>
            </a-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, h } from 'vue';
import dayjs from 'dayjs';
import {
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    ForkOutlined,
    ArrowRightOutlined,
    DownOutlined,
} from '@ant-design/icons-vue';
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
                value: r.name,
            }));
        }

        if (userRes.data.success) {
            userOptions.value = userRes.data.data.map((u: any) => ({
                label: `${u.realName} (${u.username})`,
                value: u.username,
            }));
        }
    } catch (e) {
        console.error(e);
    }
});

// 节点类型识别
const isUserTask = computed(() => {
    return props.element?.type === 'bpmn:UserTask';
});

const isStartEvent = computed(() => {
    return props.element?.type === 'bpmn:StartEvent';
});

const isEndEvent = computed(() => {
    return props.element?.type === 'bpmn:EndEvent';
});

const isExclusiveGateway = computed(() => {
    return props.element?.type === 'bpmn:ExclusiveGateway';
});

const isSequenceFlow = computed(() => {
    return props.element?.type === 'bpmn:SequenceFlow';
});

// 节点类型信息
const nodeTypeInfo = computed(() => {
    const type = props.element?.type;

    const typeMap: Record<string, any> = {
        'bpmn:StartEvent': {
            title: '🚀 开始事件',
            description: '流程的起点，当流程被启动时从这里开始执行。通常表示"发起申请"、"提交表单"等操作。',
            type: 'success',
            icon: PlayCircleOutlined,
        },
        'bpmn:EndEvent': {
            title: '🏁 结束事件',
            description: '流程的终点，到达此节点表示流程执行完毕。可以有多个结束节点，如"审批通过"、"审批拒绝"。',
            type: 'info',
            icon: CheckCircleOutlined,
        },
        'bpmn:UserTask': {
            title: '👤 用户任务（审批节点）',
            description:
                '需要人工处理的任务节点，如"组长审批"、"经理审批"。需要配置处理人（Assignee）或候选人。支持自动审批规则。',
            type: 'warning',
            icon: UserOutlined,
        },
        'bpmn:ExclusiveGateway': {
            title: '🔀 排他网关（条件分支）',
            description:
                '根据条件判断流程走向的分支节点。会评估所有出口的条件表达式，选择第一个为true的分支。常用于"审批通过/拒绝"判断。',
            type: 'warning',
            icon: ForkOutlined,
        },
        'bpmn:SequenceFlow': {
            title: '➡️ 流程连线',
            description:
                '连接各个节点的箭头，定义流程的执行顺序。可以配置条件表达式来控制流转逻辑，如 ${pass == true}。',
            type: 'info',
            icon: ArrowRightOutlined,
        },
    };

    return (
        typeMap[type] || {
            title: '⚙️ 流程元素',
            description: '请在右侧配置此元素的属性。',
            type: 'info',
            icon: PlayCircleOutlined,
        }
    );
});

// Load element data when element changes
watch(
    () => props.element,
    element => {
        if (!element) return;
        const businessObject = element.businessObject;

        // 获取assignee - 支持标准属性和flowable扩展
        const assignee =
            businessObject.assignee || businessObject.get('flowable:assignee') || businessObject.get('bpmn:assignee');

        const candidateUsers = businessObject.get('flowable:candidateUsers');
        const candidateGroups = businessObject.get('flowable:candidateGroups');

        formData.value = {
            id: businessObject.id,
            name: businessObject.name || '',
            documentation: businessObject.documentation?.[0]?.text || '',
            assignee: assignee || undefined,
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

// 更新审批人（支持变量表达式）
const updateAssignee = () => {
    if (!props.modeler || !props.element) return;
    const modeling = props.modeler.get('modeling');

    // 直接设置为标准BPMN属性
    modeling.updateProperties(props.element, {
        assignee: formData.value.assignee,
    });
};

// 快速选择审批人变量
const handleQuickSelect = ({ key }: { key: string }) => {
    formData.value.assignee = key;
    updateAssignee();
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

// 使用条件表达式示例
const useExpression = (expression: string) => {
    formData.value.conditionExpression = expression;
    updateCondition();
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
    width: 350px;
    height: 100%;
    border-left: 1px solid #ddd;
    background: #f8f8f8;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.panel-header {
    padding: 12px 16px;
    font-weight: bold;
    font-size: 14px;
    border-bottom: 1px solid #eee;
    background: #fff;
    color: #333;
}

.panel-content {
    padding: 16px;
    flex: 1;
}

.empty-text {
    padding: 40px 20px;
    text-align: center;
    color: #999;
    font-size: 13px;
}

/* 表达式示例样式 */
.expression-examples {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.example-item {
    padding: 10px 12px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
}

.example-item:hover {
    background: #e6f7ff;
    border-color: #1890ff;
    transform: translateX(2px);
}

.example-item code {
    color: #c41d7f;
    background: #fff;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    margin-right: 8px;
}

/* 表单样式优化 */
:deep(.ant-form-item) {
    margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
    padding-bottom: 4px;
}

:deep(.ant-form-item-label > label) {
    font-size: 13px;
    font-weight: 500;
    color: #333;
}

:deep(.ant-alert) {
    font-size: 12px;
}

:deep(.ant-alert-message) {
    font-weight: 600;
    margin-bottom: 4px;
}

:deep(code) {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    color: #c41d7f;
}
</style>
