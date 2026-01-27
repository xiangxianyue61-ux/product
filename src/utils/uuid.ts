export function generateUUID(): string {
    const now = Date.now();
    const random = Math.random().toString(36).slice(2);

    return `req_${now}_${random}`;
}
