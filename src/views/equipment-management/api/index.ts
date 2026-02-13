import http from '../../../api/http/index';

// 设备维修相关接口
export interface EquipmentRepair {
    _id?: string;
    code: string;
    equipmentCode: string;
    equipmentName: string;
    faultDescription: string;
    repairType: 'routine' | 'emergency' | 'preventive';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'approved' | 'rejected' | 'repairing' | 'completed' | 'cancelled';
    estimatedCost?: number;
    actualCost?: number;
    repairDate?: string;
    completionDate?: string;
    workflowInstanceId?: string;
    createdBy?: {
        _id: string;
        username: string;
        realName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface EquipmentScrapping {
    _id?: string;
    code: string;
    equipmentCode: string;
    equipmentName: string;
    reason: string;
    scrappingType: 'natural' | 'accident' | 'obsolete' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'scrapped' | 'cancelled';
    estimatedValue?: number;
    scrappingDate?: string;
    workflowInstanceId?: string;
    createdBy?: {
        _id: string;
        username: string;
        realName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

// 设备维修接口
export function getRepairList(params?: {
    page?: number;
    limit?: number;
    code?: string;
    equipmentName?: string;
    status?: string;
}) {
    return http.get('/api/equipment/repairs', {
        params,
        metadata: {
            action: 'equipment_repair',
        },
    });
}

export function createRepair(data: Partial<EquipmentRepair>) {
    return http.post('/api/equipment/repairs', data, {
        metadata: {
            action: 'equipment_repair',
        },
    });
}

export function updateRepair(id: string, data: Partial<EquipmentRepair>) {
    return http.put(`/api/equipment/repairs/${id}`, data, {
        metadata: {
            action: 'equipment_repair',
        },
    });
}

export function deleteRepair(id: string) {
    return http.delete(`/api/equipment/repairs/${id}`, {
        metadata: {
            action: 'equipment_repair',
        },
    });
}

// 设备报废接口
export function getScrappingList(params?: {
    page?: number;
    limit?: number;
    code?: string;
    equipmentName?: string;
    status?: string;
}) {
    return http.get('/api/equipment/scrappings', {
        params,
        metadata: {
            action: 'equipment_scrapping',
        },
    });
}

export function createScrapping(data: Partial<EquipmentScrapping>) {
    return http.post('/api/equipment/scrappings', data, {
        metadata: {
            action: 'equipment_scrapping',
        },
    });
}

export function updateScrapping(id: string, data: Partial<EquipmentScrapping>) {
    return http.put(`/api/equipment/scrappings/${id}`, data, {
        metadata: {
            action: 'equipment_scrapping',
        },
    });
}

export function deleteScrapping(id: string) {
    return http.delete(`/api/equipment/scrappings/${id}`, {
        metadata: {
            action: 'equipment_scrapping',
        },
    });
}
