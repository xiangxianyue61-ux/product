declare module 'vuex' {
    export function useStore<TState = unknown>(): {
        state: TState & Record<string, unknown>;
        commit: (type: string, payload?: unknown) => void;
        dispatch: (type: string, payload?: unknown) => Promise<unknown>;
    };
}
