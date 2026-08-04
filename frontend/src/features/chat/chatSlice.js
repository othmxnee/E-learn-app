import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Conversations are held per module and only in memory: the specification
// calls for no persistence, so a refresh starts a fresh thread. Keying by
// allocation id means switching modules switches conversations rather than
// mixing them.

// Only the last few turns are sent back to the server; the model needs enough
// to resolve pronouns, not the whole transcript.
const HISTORY_TURNS = 6;

export const sendChatMessage = createAsyncThunk(
    'chat/send',
    async ({ allocationId, message }, { getState, rejectWithValue }) => {
        const thread = getState().chat.threads[allocationId];
        const history = (thread?.messages || [])
            .filter((entry) => !entry.error)
            .slice(-HISTORY_TURNS)
            .map((entry) => ({ role: entry.role, content: entry.content }));

        try {
            const { data } = await api.post('/chat', { moduleId: allocationId, message, history });
            return { allocationId, ...data };
        } catch (error) {
            return rejectWithValue({
                allocationId,
                message:
                    error.response?.data?.message
                    || 'The assistant could not answer that. Please try again.',
                status: error.response?.status,
            });
        }
    }
);

const emptyThread = { messages: [], pending: false, remaining: null };

const ensureThread = (state, allocationId) => {
    if (!state.threads[allocationId]) {
        state.threads[allocationId] = { ...emptyThread, messages: [] };
    }
    return state.threads[allocationId];
};

const chatSlice = createSlice({
    name: 'chat',
    initialState: { threads: {}, openFor: null },
    reducers: {
        openChat(state, action) {
            state.openFor = action.payload;
            ensureThread(state, action.payload);
        },
        closeChat(state) {
            state.openFor = null;
        },
        clearThread(state, action) {
            state.threads[action.payload] = { ...emptyThread, messages: [] };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendChatMessage.pending, (state, action) => {
                const { allocationId, message } = action.meta.arg;
                const thread = ensureThread(state, allocationId);
                thread.messages.push({ role: 'user', content: message });
                thread.pending = true;
            })
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                const thread = ensureThread(state, action.payload.allocationId);
                thread.messages.push({
                    role: 'assistant',
                    content: action.payload.answer,
                    sources: action.payload.sources || [],
                });
                thread.pending = false;
                thread.remaining = action.payload.remaining ?? thread.remaining;
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                const allocationId = action.payload?.allocationId || action.meta.arg.allocationId;
                const thread = ensureThread(state, allocationId);
                thread.messages.push({
                    role: 'assistant',
                    content: action.payload?.message || 'Something went wrong.',
                    error: true,
                });
                thread.pending = false;
            });
    },
});

export const { openChat, closeChat, clearThread } = chatSlice.actions;
export default chatSlice.reducer;
