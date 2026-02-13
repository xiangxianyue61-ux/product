<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="部门编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="部门名称">
                    <a-input v-model:value="searchForm.name" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="noop">查询</a-button>
                        <a-button @click="noop">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <a-card :bordered="false">
            <div class="grid grid-cols-12 gap-4">
                <!-- 左侧树 -->
                <div class="col-span-4 border-r border-gray-200 pr-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="font-semibold text-gray-800">组织架构</div>
                        <a-button type="link" size="small" @click="noop" v-action="'POST'">新增</a-button>
                    </div>
                    <a-tree
                        :tree-data="treeData"
                        :default-expand-all="true"
                        v-model:selectedKeys="selectedKeys"
                        @select="handleSelect"
                    />
                </div>

                <!-- 右侧表单 -->
                <div class="col-span-8">
                    <a-tabs v-model:activeKey="tabKey">
                        <a-tab-pane key="base" tab="基本信息" />
                        <a-tab-pane key="perm" tab="部门权限" />
                    </a-tabs>

                    <a-form class="mt-2" :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="部门名称" required>
                                    <a-input v-model="form.name" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="上级部门" required>
                                    <a-input v-model="form.parentName" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="部门编码" required>
                                    <a-input v-model="form.code" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="机构类型" required>
                                    <a-input v-model="form.type" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="负责人">
                                    <a-input v-model="form.owner" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="排序">
                                    <a-input-number v-model="form.sort" :min="1" class="w-full" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="联系方式" required>
                                    <a-input v-model="form.phone" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="联系地址">
                                    <a-input v-model="form.address" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="24">
                                <a-form-item label="备注" required :label-col="{ span: 3 }" :wrapper-col="{ span: 21 }">
                                    <a-textarea v-model="form.remark" :rows="4" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                    </a-form>

                    <div class="mt-6 flex items-center justify-center gap-4">
                        <a-button @click="noop">返回</a-button>
                        <a-button type="primary" @click="noop" v-action="'PUT'">确定</a-button>
                    </div>
                </div>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';

const searchForm = reactive({ code: '', name: '' });

type TreeNode = { title: string; key: string; children?: TreeNode[] };

const treeData = ref<TreeNode[]>([
    {
        title: '华泰产业股份有限公司',
        key: 'root',
        children: [
            { title: '厂部', key: 'dept-1' },
            {
                title: '技术中心',
                key: 'dept-2',
                children: [
                    { title: '研发部', key: 'dept-2-1' },
                    { title: '技术1室', key: 'dept-2-2' },
                    { title: '技术2室', key: 'dept-2-3' },
                    { title: '技术3室', key: 'dept-2-4' },
                ],
            },
            {
                title: '第一事业部',
                key: 'dept-3',
                children: [
                    { title: '机电机加工车间', key: 'dept-3-1' },
                    {
                        title: '下料(包装)车间',
                        key: 'dept-3-2',
                        children: [
                            { title: '下料班组', key: 'dept-3-2-1' },
                            { title: '包装班组', key: 'dept-3-2-2' },
                            { title: '维修班组', key: 'dept-3-2-3' },
                            { title: '下料外协', key: 'dept-3-2-4' },
                        ],
                    },
                    {
                        title: '机电锻压车间',
                        key: 'dept-3-3',
                        children: [
                            { title: '锻造1班组', key: 'dept-3-3-1' },
                            { title: '锻造2班组', key: 'dept-3-3-2' },
                            { title: '热处理班组', key: 'dept-3-3-3' },
                            { title: '环扎班组', key: 'dept-3-3-4' },
                            { title: '锻压外协', key: 'dept-3-3-5' },
                        ],
                    },
                ],
            },
            { title: '第二事业部', key: 'dept-4' },
            { title: '第三事业部', key: 'dept-5' },
            { title: '质量控制部', key: 'dept-6' },
            { title: '财务部', key: 'dept-7' },
            { title: '设备部', key: 'dept-8' },
            { title: '综合管理部', key: 'dept-9' },
            { title: '综合事业部', key: 'dept-10' },
        ],
    },
]);

const selectedKeys = ref<string[]>(['dept-2-1']);
const tabKey = ref<'base' | 'perm'>('base');

const form = reactive({
    name: '研发部',
    parentName: '技术中心',
    code: 'BMBH00000001',
    type: '部门',
    owner: '李民浩',
    sort: 1,
    phone: '158****7894',
    address: '无',
    remark: '',
});

const handleSelect = (_keys: string[], info: { node: { title: string } }) => {
    form.name = info.node.title;
};

const noop = () => message.info('演示页面：此功能暂未接入后端');
</script>
