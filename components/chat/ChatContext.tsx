import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

interface ChatContextValue {
    isEnabled: boolean;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FunctionComponent<{}> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true';
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    const value = useMemo(() => ({ isEnabled, isOpen, open, close, toggle }), [
        isEnabled,
        isOpen,
        open,
        close,
        toggle,
    ]);
    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};

export function useChatContext(): ChatContextValue {
    const ctx = useContext(ChatContext);
    if (!ctx) {
        // Render-time fallback so the navbar still works on pages that haven't
        // wrapped with ChatProvider yet. Reports disabled and is a no-op.
        return {
            isEnabled: false,
            isOpen: false,
            open: () => undefined,
            close: () => undefined,
            toggle: () => undefined,
        };
    }
    return ctx;
}
