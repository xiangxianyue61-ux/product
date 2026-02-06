import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { apiFetch, type ListResult, type ApiResult } from './apiClient';

export type CrudPagination = { current: number; pageSize: number; total: number };

type CrudTableOptions<TForm extends Record<string, any>, TRow extends { id?: number; _id?: string }> = {
    listUrl: string; // e.g. /api/productionWorkOrders/list OR /production/work-orders
    getUrl?: (id: string | number) => string;
    createUrl?: string;
    updateUrl?: (id: string | number) => string;
    deleteUrl?: (id: string | number) => string;
    buildListParams: (form: TForm) => Record<string, string>;
    rowId: (row: TRow) => string | number;
};

export function useCrudTable<TForm extends Record<string, any>, TRow extends { id?: number; _id?: string }>(
    options: CrudTableOptions<TForm, TRow>,
    initialForm: TForm
) {
    const form = reactive({ ...initialForm }) as TForm;
    const loading = ref(false);
    const tableData = ref<TRow[]>([]);
    const selectedRowKeys = ref<Array<string | number>>([]);
    const pagination = reactive<CrudPagination>({ current: 1, pageSize: 15, total: 0 });

    const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

    const load = async () => {
        loading.value = true;
        try {
            const params = new URLSearchParams();
            params.set('page', String(pagination.current));
            params.set('pageSize', String(pagination.pageSize));
            const extra = options.buildListParams(form);
            Object.entries(extra).forEach(([k, v]) => {
                if (v !== undefined && v !== null && String(v).trim() !== '') params.set(k, String(v));
            });

            const url = `${options.listUrl}?${params.toString()}`;
            const res = await apiFetch<ListResult<TRow>>(url);
            if (!res.success) throw new Error('接口返回失败');
            tableData.value = res.data ?? [];
            pagination.total = res.total ?? 0;
        } catch (e) {
            tableData.value = [];
            pagination.total = 0;
            message.error(`加载数据失败：${(e as Error).message || '未知错误'}`);
        } finally {
            loading.value = false;
        }
    };

    const search = async () => {
        pagination.current = 1;
        selectedRowKeys.value = [];
        await load();
        message.success('查询成功');
    };

    const reset = async () => {
        Object.keys(initialForm).forEach(k => {
            (form as Record<string, unknown>)[k] = (initialForm as Record<string, unknown>)[k];
        });
        pagination.current = 1;
        selectedRowKeys.value = [];
        await load();
    };

    const pageChange = async (page: number) => {
        pagination.current = page;
        selectedRowKeys.value = [];
        await load();
    };

    const pageSizeChange = async (_current: number, size: number) => {
        pagination.current = 1;
        pagination.pageSize = size;
        selectedRowKeys.value = [];
        await load();
    };

    const deleteOne = async (row: TRow) => {
        if (!options.deleteUrl) return;
        const id = options.rowId(row);
        try {
            await apiFetch<ApiResult<unknown>>(options.deleteUrl(id), { method: 'DELETE' });
            message.success('删除成功');
            await load();
        } catch (e) {
            message.error(`删除失败：${(e as Error).message || '未知错误'}`);
        }
    };

    return {
        form,
        loading,
        tableData,
        selectedRowKeys,
        pagination,
        maxPage,
        load,
        search,
        reset,
        pageChange,
        pageSizeChange,
        deleteOne,
    };
}
