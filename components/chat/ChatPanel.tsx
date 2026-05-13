import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import DataTable, { IDataTableColumn } from 'react-data-table-component';

import { useChatContext } from './ChatContext';
import { useChatStream, useCurrentPageContext } from './useChatStream';
import type { ChatTurn, ProposedView } from './useChatStream';
import styles from './ChatPanel.module.scss';

const EXAMPLE_QUESTIONS = [
    'How many files are in the HTAN portal?',
    'What assays are available for breast cancer?',
    'Most common preservation method across atlases?',
    'List recent HTAN publications.',
];

function makeColumns(
    rows: Record<string, unknown>[]
): IDataTableColumn<Record<string, unknown>>[] {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((k) => ({
        name: k,
        selector: k,
        sortable: true,
        wrap: true,
        cell: (row: Record<string, unknown>) => {
            const v = row[k];
            if (v === null || v === undefined) return '';
            if (Array.isArray(v)) return v.join(', ');
            if (typeof v === 'object') return JSON.stringify(v);
            return String(v);
        },
    }));
}

const ApplyToExploreButton: React.FunctionComponent<{
    view: ProposedView;
}> = ({ view }) => {
    const router = useRouter();
    const apply = () => {
        router.push({
            pathname: '/explore',
            query: {
                tab: view.tab,
                selectedFilters: JSON.stringify(view.filters),
            },
        });
    };
    return (
        <button
            type="button"
            className={styles.applyButton}
            onClick={apply}
            title="Open the Explore page with these filters applied"
        >
            → {view.label}
        </button>
    );
};

const AssistantTurn: React.FunctionComponent<{
    turn: ChatTurn;
    onFeedback: (turnId: string, rating: 'up' | 'down') => void;
}> = ({ turn, onFeedback }) => {
    const columns = useMemo(() => (turn.rows ? makeColumns(turn.rows) : []), [
        turn.rows,
    ]);

    return (
        <div className={`${styles.turn} ${styles.assistantTurn}`}>
            {turn.rateLimited || turn.unavailable ? (
                <div className={styles.warnBox}>{turn.text}</div>
            ) : (
                <>
                    {turn.text && (
                        <div className={styles.assistantText}>{turn.text}</div>
                    )}
                    {turn.sql && (
                        <details className={styles.sqlBlock} open>
                            <summary className={styles.sqlSummary}>
                                Generated SQL
                            </summary>
                            <pre className={styles.sqlPre}>
                                <code>{turn.sql}</code>
                            </pre>
                        </details>
                    )}
                    {turn.toolError && (
                        <div className={styles.errorBox}>
                            <strong>SQL error:</strong>{' '}
                            <code>{turn.toolError}</code>
                            {turn.toolHint && (
                                <div style={{ marginTop: 4 }}>
                                    Hint: {turn.toolHint}
                                </div>
                            )}
                        </div>
                    )}
                    {turn.rows && turn.rows.length > 0 && (
                        <div className={styles.tableWrap}>
                            <DataTable
                                columns={columns}
                                data={turn.rows}
                                dense
                                pagination={turn.rows.length > 10}
                                paginationPerPage={10}
                                noHeader
                            />
                        </div>
                    )}
                    {turn.rows && turn.rows.length === 0 && (
                        <div className={styles.resultMeta}>
                            No rows matched.
                        </div>
                    )}
                    {turn.rowCount !== undefined && turn.rowCount > 0 && (
                        <div className={styles.resultMeta}>
                            {turn.rowCount}
                            {turn.truncated ? '+ (truncated)' : ''} row
                            {turn.rowCount === 1 ? '' : 's'}
                        </div>
                    )}
                    {turn.proposedView && (
                        <ApplyToExploreButton view={turn.proposedView} />
                    )}
                    {turn.fatalError && (
                        <div className={styles.errorBox}>{turn.fatalError}</div>
                    )}
                    {turn.streaming && (
                        <span
                            className={styles.spinner}
                            aria-label="thinking"
                        />
                    )}
                    {!turn.streaming && !turn.fatalError && (
                        <div className={styles.feedbackRow}>
                            <span>Was this helpful?</span>
                            <button
                                type="button"
                                className={`${styles.thumbButton} ${
                                    turn.feedback === 'up' ? styles.active : ''
                                }`}
                                disabled={!!turn.feedback}
                                onClick={() => onFeedback(turn.turnId, 'up')}
                                aria-label="Helpful"
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                className={`${styles.thumbButton} ${
                                    turn.feedback === 'down'
                                        ? styles.active
                                        : ''
                                }`}
                                disabled={!!turn.feedback}
                                onClick={() => onFeedback(turn.turnId, 'down')}
                                aria-label="Not helpful"
                            >
                                No
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const ChatPanel: React.FunctionComponent<{}> = () => {
    const { isEnabled, isOpen, close } = useChatContext();
    const {
        history,
        pending,
        sendMessage,
        reset,
        setFeedback,
    } = useChatStream();
    const pageContext = useCurrentPageContext();
    const hasContext =
        (pageContext.filters?.length ?? 0) > 0 || !!pageContext.tab;
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the composer when the drawer opens.
            const t = setTimeout(() => inputRef.current?.focus(), 250);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    useEffect(() => {
        bodyRef.current?.scrollTo({
            top: bodyRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [history]);

    const submit = () => {
        const text = inputRef.current?.value ?? '';
        if (!text.trim() || pending) return;
        sendMessage(text);
        if (inputRef.current) inputRef.current.value = '';
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const onExampleClick = (q: string) => {
        if (inputRef.current) inputRef.current.value = q;
        sendMessage(q);
        if (inputRef.current) inputRef.current.value = '';
    };

    if (!isEnabled) return null;

    return (
        <>
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={close}
                aria-hidden={!isOpen}
            />
            <aside
                className={`${styles.panel} ${isOpen ? styles.open : ''}`}
                role="dialog"
                aria-label="Ask the Atlas"
                aria-hidden={!isOpen}
            >
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Ask the Atlas</h2>
                        <p className={styles.subtitle}>
                            Natural-language queries against the HTAN portal
                            database
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={reset}
                            title="Clear conversation"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={close}
                            aria-label="Close"
                            title="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className={styles.disclaimer}>
                    AI-generated answers may be wrong. Verify the SQL and the
                    rows before citing.
                </div>
                {hasContext && (
                    <div
                        className={styles.contextBar}
                        title="The assistant is aware of your current Explore tab and filters."
                    >
                        <span className={styles.contextLabel}>Context:</span>
                        {pageContext.tab && (
                            <span className={styles.chip}>
                                tab: {pageContext.tab}
                            </span>
                        )}
                        {pageContext.filters?.map((f, i) => (
                            <span
                                key={`${f.group}-${f.value}-${i}`}
                                className={styles.chip}
                            >
                                {f.group}: {f.value}
                            </span>
                        ))}
                    </div>
                )}
                <div className={styles.body} ref={bodyRef}>
                    {history.length === 0 ? (
                        <div className={styles.empty}>
                            Ask a question about HTAN data. The assistant will
                            generate ClickHouse SQL, run it, and explain the
                            result. Try one of these:
                            <ul>
                                {EXAMPLE_QUESTIONS.map((q) => (
                                    <li key={q}>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            onClick={() => onExampleClick(q)}
                                            disabled={pending}
                                        >
                                            {q}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        history.map((turn) =>
                            turn.role === 'user' ? (
                                <div
                                    key={turn.turnId}
                                    className={`${styles.turn} ${styles.userTurn}`}
                                >
                                    <div className={styles.bubble}>
                                        {turn.text}
                                    </div>
                                </div>
                            ) : (
                                <AssistantTurn
                                    key={turn.turnId}
                                    turn={turn}
                                    onFeedback={setFeedback}
                                />
                            )
                        )
                    )}
                </div>
                <div className={styles.composer}>
                    <div className={styles.composerRow}>
                        <textarea
                            ref={inputRef}
                            className={styles.input}
                            placeholder="Ask a question about HTAN data…"
                            onKeyDown={onKeyDown}
                            disabled={pending}
                            rows={1}
                        />
                        <button
                            type="button"
                            className={styles.sendButton}
                            onClick={submit}
                            disabled={pending}
                        >
                            {pending ? 'Thinking…' : 'Send'}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ChatPanel;
