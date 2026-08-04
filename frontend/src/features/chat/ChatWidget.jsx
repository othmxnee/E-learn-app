import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, X, Send, FileText, Loader2, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { sendChatMessage, openChat, closeChat, clearThread } from './chatSlice';
import AnswerText from './AnswerText';

// Floating assistant for a single module.
//
// Answers come from that module's own course materials, so the widget is only
// meaningful on a module page and takes the allocation id it is mounted with.

const ChatWidget = ({ allocationId, moduleName }) => {
    const dispatch = useDispatch();
    const { threads, openFor } = useSelector((state) => state.chat);

    const thread = threads[allocationId];
    const isOpen = openFor === allocationId;

    const [draft, setDraft] = useState('');
    const [available, setAvailable] = useState(null);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // The assistant is hidden entirely when the server has no API key, rather
    // than offering a button that always fails.
    useEffect(() => {
        let cancelled = false;
        api
            .get('/chat/status')
            .then(({ data }) => { if (!cancelled) setAvailable(data.available); })
            .catch(() => { if (!cancelled) setAvailable(false); });
        return () => { cancelled = true; };
    }, []);

    // Keep the newest message in view as the conversation grows.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread?.messages?.length, thread?.pending]);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const submit = (event) => {
        event.preventDefault();
        const message = draft.trim();
        if (!message || thread?.pending) return;

        dispatch(sendChatMessage({ allocationId, message }));
        setDraft('');
    };

    if (available === false) return null;

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => dispatch(openChat(allocationId))}
                className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
            >
                <MessageCircle className="h-5 w-5" />
                Ask about this module
            </button>
        );
    }

    const messages = thread?.messages || [];

    return (
        <div className="fixed bottom-6 right-6 z-40 flex h-[32rem] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">Course assistant</h3>
                    <p className="truncate text-xs text-gray-500">{moduleName || 'This module'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={() => dispatch(clearThread(allocationId))}
                            title="Clear conversation"
                            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => dispatch(closeChat())}
                        title="Close"
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {messages.length === 0 && (
                    <div className="pt-6 text-center">
                        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600">
                            Ask a question about this module
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Answers come only from the course materials, with the source cited.
                        </p>
                    </div>
                )}

                {messages.map((entry, index) => (
                    <div
                        key={index}
                        className={entry.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                        <div className={entry.role === 'user' ? 'max-w-[85%]' : 'max-w-[92%]'}>
                            <div
                                className={`rounded-2xl px-4 py-2.5 text-sm ${
                                    entry.role === 'user'
                                        ? 'whitespace-pre-wrap bg-primary text-white'
                                        : entry.error
                                        ? 'whitespace-pre-wrap bg-red-50 text-red-700'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {entry.role === 'assistant' && !entry.error
                                    ? <AnswerText content={entry.content} />
                                    : entry.content}
                            </div>

                            {/* Source chips: which material and page the answer came from. */}
                            {entry.sources?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {entry.sources.map((source) => (
                                        <span
                                            key={`${source.materialId}-${source.page}`}
                                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700"
                                        >
                                            <FileText className="h-3 w-3" />
                                            {source.materialName}
                                            {source.page ? ` · p.${source.page}` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {thread?.pending && (
                    <div className="flex justify-start">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Reading the course material…
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-end gap-2">
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Ask about this module…"
                        maxLength={2000}
                        disabled={thread?.pending}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || thread?.pending}
                        className="rounded-xl bg-primary p-2.5 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                {typeof thread?.remaining === 'number' && thread.remaining <= 5 && (
                    <p className="mt-2 text-[11px] text-gray-400">
                        {thread.remaining} question{thread.remaining === 1 ? '' : 's'} left this hour.
                    </p>
                )}
            </form>
        </div>
    );
};

export default ChatWidget;
