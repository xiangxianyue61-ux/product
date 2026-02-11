<template>
    <div class="auto-approval-rules-page">
        <div class="page-header">
            <h2>自动审批规则管理</h2>
            <button class="btn-primary" @click="showCreateDialog">
                <span class="icon">+</span>
                新建规则
            </button>
        </div>

        <div class="filter-section">
            <div class="filter-item">
                <label>流程类型：</label>
                <select v-model="filters.processKey" @change="loadRules">
                    <option value="">全部</option>
                    <option value="leave-process">请假流程</option>
                    <option value="expense-process">报销流程</option>
                    <option value="purchase-process">采购流程</option>
                </select>
            </div>
            <div class="filter-item">
                <label>状态：</label>
                <select v-model="filters.status" @change="loadRules">
                    <option value="">全部</option>
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                </select>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>规则名称</th>
                        <th>流程类型</th>
                        <th>节点ID</th>
                        <th>条件逻辑</th>
                        <th>操作</th>
                        <th>优先级</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="rule in rules" :key="rule._id">
                        <td>{{ rule.name }}</td>
                        <td>{{ getProcessKeyLabel(rule.processKey) }}</td>
                        <td>{{ rule.nodeId || '全部节点' }}</td>
                        <td>{{ rule.conditionLogic }}</td>
                        <td>
                            <span :class="['action-badge', rule.action]">
                                {{ rule.action === 'approve' ? '自动通过' : '自动拒绝' }}
                            </span>
                        </td>
                        <td>{{ rule.priority }}</td>
                        <td>
                            <span :class="['status-badge', rule.status]">
                                {{ rule.status === 'active' ? '启用' : '禁用' }}
                            </span>
                        </td>
                        <td>{{ formatDate(rule.createdAt) }}</td>
                        <td class="action-buttons">
                            <button class="btn-icon" @click="viewRule(rule)" title="查看">
                                <span>👁️</span>
                            </button>
                            <button class="btn-icon" @click="editRule(rule)" title="编辑">
                                <span>✏️</span>
                            </button>
                            <button
                                class="btn-icon"
                                @click="toggleStatus(rule)"
                                :title="rule.status === 'active' ? '禁用' : '启用'"
                            >
                                <span>{{ rule.status === 'active' ? '🔒' : '🔓' }}</span>
                            </button>
                            <button class="btn-icon danger" @click="deleteRule(rule)" title="删除">
                                <span>🗑️</span>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="rules.length === 0">
                        <td colspan="9" class="empty-message">暂无数据</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="showDialog" class="modal-overlay" @click.self="closeDialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        {{ dialogMode === 'create' ? '新建' : dialogMode === 'edit' ? '编辑' : '查看' }}自动审批规则
                    </h3>
                    <button class="close-btn" @click="closeDialog">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>
                            规则名称
                            <span class="required">*</span>
                        </label>
                        <input
                            v-model="formData.name"
                            type="text"
                            placeholder="请输入规则名称"
                            :disabled="dialogMode === 'view'"
                        />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <textarea
                            v-model="formData.description"
                            placeholder="请输入规则描述"
                            :disabled="dialogMode === 'view'"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            流程类型
                            <span class="required">*</span>
                        </label>
                        <select v-model="formData.processKey" :disabled="dialogMode === 'view'">
                            <option value="">请选择</option>
                            <option value="leave-process">请假流程</option>
                            <option value="expense-process">报销流程</option>
                            <option value="purchase-process">采购流程</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>节点ID（可选）</label>
                        <input
                            v-model="formData.nodeId"
                            type="text"
                            placeholder="留空则应用于所有节点"
                            :disabled="dialogMode === 'view'"
                        />
                    </div>

                    <div class="form-group">
                        <label>
                            条件
                            <span class="required">*</span>
                        </label>
                        <div class="conditions-container">
                            <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-item">
                                <select v-model="condition.field" :disabled="dialogMode === 'view'">
                                    <option value="">选择字段</option>
                                    <option value="days">天数</option>
                                    <option value="amount">金额</option>
                                    <option value="type">类型</option>
                                    <option value="department">部门</option>
                                </select>
                                <select v-model="condition.operator" :disabled="dialogMode === 'view'">
                                    <option value="eq">等于</option>
                                    <option value="ne">不等于</option>
                                    <option value="gt">大于</option>
                                    <option value="gte">大于等于</option>
                                    <option value="lt">小于</option>
                                    <option value="lte">小于等于</option>
                                    <option value="contains">包含</option>
                                    <option value="in">在列表中</option>
                                </select>
                                <input
                                    v-model="condition.value"
                                    type="text"
                                    placeholder="值"
                                    :disabled="dialogMode === 'view'"
                                />
                                <button
                                    v-if="dialogMode !== 'view'"
                                    class="btn-icon danger"
                                    @click="removeCondition(index)"
                                >
                                    ×
                                </button>
                            </div>
                            <button v-if="dialogMode !== 'view'" class="btn-secondary" @click="addCondition">
                                + 添加条件
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>条件逻辑</label>
                        <select v-model="formData.conditionLogic" :disabled="dialogMode === 'view'">
                            <option value="AND">全部满足（AND）</option>
                            <option value="OR">任一满足（OR）</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>
                            操作
                            <span class="required">*</span>
                        </label>
                        <select v-model="formData.action" :disabled="dialogMode === 'view'">
                            <option value="approve">自动通过</option>
                            <option value="reject">自动拒绝</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>自动备注</label>
                        <input
                            v-model="formData.autoComment"
                            type="text"
                            placeholder="自动审批时的备注"
                            :disabled="dialogMode === 'view'"
                        />
                    </div>

                    <div class="form-group">
                        <label>优先级</label>
                        <input
                            v-model.number="formData.priority"
                            type="number"
                            placeholder="数值越大优先级越高"
                            :disabled="dialogMode === 'view'"
                        />
                    </div>

                    <div class="form-group">
                        <label>状态</label>
                        <select v-model="formData.status" :disabled="dialogMode === 'view'">
                            <option value="active">启用</option>
                            <option value="inactive">禁用</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" @click="closeDialog">取消</button>
                    <button v-if="dialogMode !== 'view'" class="btn-primary" @click="saveRule">保存</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
    getAutoApprovalRules,
    createAutoApprovalRule,
    updateAutoApprovalRule,
    deleteAutoApprovalRule,
    toggleAutoApprovalRule,
    type AutoApprovalRule,
    type AutoApprovalCondition,
} from '@/api/modules/workflow';

const rules = ref<AutoApprovalRule[]>([]);
const showDialog = ref(false);
const dialogMode = ref<'create' | 'edit' | 'view'>('create');
const currentRuleId = ref<string | null>(null);

const filters = ref({
    processKey: '',
    status: '',
});

const formData = ref<Omit<AutoApprovalRule, '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    processKey: '',
    nodeId: '',
    conditions: [],
    conditionLogic: 'AND',
    action: 'approve',
    autoComment: '系统自动审批',
    priority: 0,
    status: 'active',
});

const loadRules = async () => {
    try {
        const params: any = {};
        if (filters.value.processKey) params.processKey = filters.value.processKey;
        if (filters.value.status) params.status = filters.value.status;

        const response = await getAutoApprovalRules(params);
        if (response.data.success) {
            rules.value = response.data.data;
        }
    } catch (error) {
        console.error('加载规则失败:', error);
        alert('加载规则失败，请稍后重试');
    }
};

const showCreateDialog = () => {
    dialogMode.value = 'create';
    currentRuleId.value = null;
    resetForm();
    showDialog.value = true;
};

const viewRule = (rule: AutoApprovalRule) => {
    dialogMode.value = 'view';
    currentRuleId.value = rule._id || null;
    formData.value = {
        name: rule.name,
        description: rule.description || '',
        processKey: rule.processKey,
        nodeId: rule.nodeId || '',
        conditions: [...rule.conditions],
        conditionLogic: rule.conditionLogic,
        action: rule.action,
        autoComment: rule.autoComment || '',
        priority: rule.priority || 0,
        status: rule.status,
    };
    showDialog.value = true;
};

const editRule = (rule: AutoApprovalRule) => {
    dialogMode.value = 'edit';
    currentRuleId.value = rule._id || null;
    formData.value = {
        name: rule.name,
        description: rule.description || '',
        processKey: rule.processKey,
        nodeId: rule.nodeId || '',
        conditions: [...rule.conditions],
        conditionLogic: rule.conditionLogic,
        action: rule.action,
        autoComment: rule.autoComment || '',
        priority: rule.priority || 0,
        status: rule.status,
    };
    showDialog.value = true;
};

const saveRule = async () => {
    if (!formData.value.name || !formData.value.processKey || formData.value.conditions.length === 0) {
        alert('请填写必填项');
        return;
    }

    try {
        if (dialogMode.value === 'create') {
            const response = await createAutoApprovalRule(formData.value);
            if (response.data.success) {
                alert('创建成功');
                closeDialog();
                loadRules();
            }
        } else if (dialogMode.value === 'edit' && currentRuleId.value) {
            const response = await updateAutoApprovalRule(currentRuleId.value, formData.value);
            if (response.data.success) {
                alert('更新成功');
                closeDialog();
                loadRules();
            }
        }
    } catch (error) {
        console.error('保存规则失败:', error);
        alert('保存失败，请稍后重试');
    }
};

const deleteRule = async (rule: AutoApprovalRule) => {
    if (!rule._id || !confirm('确定要删除此规则吗？')) return;

    try {
        const response = await deleteAutoApprovalRule(rule._id);
        if (response.data.success) {
            alert('删除成功');
            loadRules();
        }
    } catch (error) {
        console.error('删除规则失败:', error);
        alert('删除失败，请稍后重试');
    }
};

const toggleStatus = async (rule: AutoApprovalRule) => {
    if (!rule._id) return;

    try {
        const response = await toggleAutoApprovalRule(rule._id);
        if (response.data.success) {
            alert(response.data.message);
            loadRules();
        }
    } catch (error) {
        console.error('切换状态失败:', error);
        alert('操作失败，请稍后重试');
    }
};

const addCondition = () => {
    formData.value.conditions.push({
        field: '',
        operator: 'eq',
        value: '',
    });
};

const removeCondition = (index: number) => {
    formData.value.conditions.splice(index, 1);
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const resetForm = () => {
    formData.value = {
        name: '',
        description: '',
        processKey: '',
        nodeId: '',
        conditions: [],
        conditionLogic: 'AND',
        action: 'approve',
        autoComment: '系统自动审批',
        priority: 0,
        status: 'active',
    };
};

const getProcessKeyLabel = (key: string): string => {
    const map: Record<string, string> = {
        'leave-process': '请假流程',
        'expense-process': '报销流程',
        'purchase-process': '采购流程',
    };
    return map[key] || key;
};

const formatDate = (date?: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
    loadRules();
});
</script>

<style scoped>
.auto-approval-rules-page {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
}

.filter-section {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 4px;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.filter-item label {
    font-weight: 500;
    color: #666;
}

.filter-item select {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
}

.table-container {
    background: white;
    border-radius: 4px;
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background: #f8f8f8;
    font-weight: 600;
    color: #333;
}

.data-table tr:hover {
    background: #fafafa;
}

.action-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.action-badge.approve {
    background: #e8f5e9;
    color: #2e7d32;
}

.action-badge.reject {
    background: #ffebee;
    color: #c62828;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.active {
    background: #e3f2fd;
    color: #1976d2;
}

.status-badge.inactive {
    background: #f5f5f5;
    color: #757575;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.btn-primary,
.btn-secondary,
.btn-icon {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
}

.btn-primary {
    background: #1976d2;
    color: white;
}

.btn-primary:hover {
    background: #1565c0;
}

.btn-secondary {
    background: #f5f5f5;
    color: #333;
}

.btn-secondary:hover {
    background: #e0e0e0;
}

.btn-icon {
    padding: 6px 10px;
    background: transparent;
}

.btn-icon:hover {
    background: #f5f5f5;
}

.btn-icon.danger:hover {
    background: #ffebee;
    color: #c62828;
}

.empty-message {
    text-align: center;
    padding: 40px;
    color: #999;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-header h3 {
    margin: 0;
    font-size: 20px;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    line-height: 1;
}

.close-btn:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
}

.required {
    color: #f44336;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-group textarea {
    min-height: 80px;
    resize: vertical;
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.conditions-container {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 15px;
    background: #fafafa;
}

.condition-item {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
}

.condition-item select,
.condition-item input {
    flex: 1;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #eee;
}

.icon {
    font-size: 18px;
    margin-right: 4px;
}
</style>
