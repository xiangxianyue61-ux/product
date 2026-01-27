export interface ApiMonitor {
    requestId: string;
    url?: string;
    method?: string;
    page?: string;
    action?: string;

    startTime: number;
    endTime: number;
    duration: number;

    status?: number;
    success: boolean;
    errorMsg?: string;
}
