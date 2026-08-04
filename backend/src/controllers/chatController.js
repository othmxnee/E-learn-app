// Course-material chatbot.
//
// Retrieval-augmented: the question is embedded, the most similar passages
// from that module are retrieved, and the model is asked to answer strictly
// from them. Grounding the answer in retrieved text is what makes the
// citations meaningful — the model is never asked to recall course content.

const { GoogleGenAI } = require('@google/genai');

const { ModuleAllocation, Module, User, teacherInclude, isTeacherOf } = require('../models');
const { retrieveContext } = require('../rag/retrieve');
const { isConfigured, withRetry } = require('../rag/embeddings');
const { consume, peek } = require('../rag/rateLimit');
const { isUuid } = require('../utils/uuid');

// Free-tier keys reject dated model ids, so the rolling alias is the default.
const CHAT_MODEL = process.env.CHAT_MODEL || 'gemini-flash-latest';

// Only the last few turns are replayed. The widget keeps the visible thread in
// Redux; the model only needs enough to resolve "it" and "that".
const HISTORY_TURNS = 6;

const SYSTEM_PROMPT = `You are a teaching assistant for a university course. Answer the student's question using ONLY the course excerpts provided below.

Rules:
- If the excerpts do not contain the answer, say so plainly and suggest what the student might look for instead. Never answer from outside knowledge.
- Cite the material name and page for every claim, like: (Week 3 — Normalization, p. 2).
- Quote or paraphrase the excerpts; do not invent definitions, figures, or examples.
- Keep answers concise and direct. Use plain prose; short lists only when the material is genuinely a list.
- Write mathematics as plain text, never LaTeX: no dollar signs, no backslash commands, no braces. Write T(n) = aT(n/b) + f(n) and n^(log_b a), not $T(n)$ or $n^{\\log_b a}$.
- Answer in the language the student asks in.`;

let client = null;
const getClient = () => {
    if (!client) {
        client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        });
    }
    return client;
};

// A student may only ask about a module allocated to their own class; a
// teacher only about modules they teach. This is the same rule the rest of the
// app applies to content, restated here because the chat endpoint reads
// material text directly.
const authoriseAccess = async (user, allocationId) => {
    const allocation = await ModuleAllocation.findOne({
        where: { id: allocationId, adminId: user.adminId },
        include: [
            { model: Module, as: 'module', attributes: ['id', 'name'] },
            teacherInclude(['id']),
        ],
    });

    if (!allocation) return { ok: false, status: 404, message: 'Module not found' };

    if (user.role === 'ADMIN') return { ok: true, allocation };

    if (user.role === 'TEACHER') {
        return isTeacherOf(allocation, user.id)
            ? { ok: true, allocation }
            : { ok: false, status: 403, message: 'Not authorized for this module' };
    }

    // Students: the module must be allocated to the level their class sits in.
    const student = await User.findByPk(user.id, { attributes: ['id', 'classId'] });
    if (!student || !student.classId) {
        return { ok: false, status: 403, message: 'You are not assigned to a class' };
    }

    const { Class } = require('../models');
    const studentClass = await Class.findByPk(student.classId, { attributes: ['id', 'levelId'] });

    if (!studentClass || String(studentClass.levelId) !== String(allocation.levelId)) {
        return { ok: false, status: 403, message: 'This module is not part of your programme' };
    }

    return { ok: true, allocation };
};

const buildPrompt = ({ question, matches, history }) => {
    const excerpts = matches
        .map(
            (match, index) =>
                `[${index + 1}] ${match.materialName}${match.page ? `, page ${match.page}` : ''}\n${match.text}`
        )
        .join('\n\n---\n\n');

    const priorTurns = (history || [])
        .slice(-HISTORY_TURNS)
        .filter((turn) => turn && turn.role && turn.content)
        .map((turn) => `${turn.role === 'assistant' ? 'Assistant' : 'Student'}: ${turn.content}`)
        .join('\n');

    return [
        SYSTEM_PROMPT,
        priorTurns ? `\nEarlier in this conversation:\n${priorTurns}` : '',
        `\nCourse excerpts:\n${excerpts}`,
        `\nStudent's question: ${question}`,
    ].join('\n');
};

// @desc    Ask a question about a module's materials
// @route   POST /api/chat
// @access  Private (student/teacher/admin)
const chat = async (req, res) => {
    try {
        // The spec names this `moduleId`; it is an allocation id, which is what
        // identifies a module as taught to a given level.
        const allocationId = req.body.allocationId || req.body.moduleId;
        const message = String(req.body.message || '').trim();
        const history = Array.isArray(req.body.history) ? req.body.history : [];

        if (!message) {
            return res.status(400).json({ message: 'A question is required' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ message: 'Question is too long (2000 characters max)' });
        }
        if (!isUuid(allocationId)) {
            return res.status(400).json({ message: 'A valid module is required' });
        }
        if (!isConfigured()) {
            return res.status(503).json({
                message: 'The assistant is not configured on this deployment.',
            });
        }

        const access = await authoriseAccess(req.user, allocationId);
        if (!access.ok) {
            return res.status(access.status).json({ message: access.message });
        }

        // Rate limit is consumed only once the request is known to be valid and
        // authorised, so a rejected request never costs a student their quota.
        const quota = consume(req.user.id);
        if (!quota.allowed) {
            return res.status(429).json({
                message: `You have reached the limit of 20 questions per hour. Try again in ${Math.ceil(
                    quota.retryAfterSeconds / 60
                )} minutes.`,
                retryAfterSeconds: quota.retryAfterSeconds,
            });
        }

        const { matches, indexed } = await retrieveContext({
            question: message,
            allocationId,
            adminId: req.user.adminId,
        });

        if (!indexed) {
            return res.json({
                answer: "This module's materials haven't been indexed yet, so I can't answer from them. Ask your administrator to build the chat index.",
                sources: [],
                remaining: quota.remaining,
            });
        }

        if (!matches.length) {
            return res.json({
                answer: "I couldn't find anything about that in this module's materials. Try rephrasing, or ask about a topic the course notes cover.",
                sources: [],
                remaining: quota.remaining,
            });
        }

        const response = await withRetry(
            () =>
                getClient().models.generateContent({
                    model: CHAT_MODEL,
                    contents: buildPrompt({ question: message, matches, history }),
                }),
            { label: 'chat' }
        );

        const answer = (response.text || '').trim()
            || 'I could not produce an answer from the course material for that question.';

        // Sources are deduplicated by material and page: several retrieved
        // passages often come from the same page, and one chip per page reads
        // better than three identical ones.
        const seen = new Set();
        const sources = [];
        for (const match of matches) {
            const key = `${match.materialId}:${match.page}`;
            if (seen.has(key)) continue;
            seen.add(key);
            sources.push({
                materialId: match.materialId,
                materialName: match.materialName,
                page: match.page,
                score: Math.round(match.score * 1000) / 1000,
            });
        }

        res.json({ answer, sources, remaining: quota.remaining });
    } catch (error) {
        console.error('Chat error:', error);
        const status = error?.status ?? error?.code;
        if (status === 429) {
            return res.status(503).json({
                message: 'The assistant is busy right now (API quota). Please try again shortly.',
            });
        }
        res.status(500).json({ message: 'The assistant could not answer that. Please try again.' });
    }
};

// @desc    Whether the assistant is usable, and the caller's remaining quota
// @route   GET /api/chat/status
// @access  Private
const getChatStatus = async (req, res) => {
    const { remaining, limit } = peek(req.user.id);
    res.json({ available: isConfigured(), remaining, limit });
};

module.exports = { chat, getChatStatus };
