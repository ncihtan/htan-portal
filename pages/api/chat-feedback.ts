import type { NextApiRequest, NextApiResponse } from 'next';
import { recordFeedback } from '../../lib/chat/logger';

interface FeedbackBody {
    turnId: string;
    rating: 'up' | 'down';
    comment?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end();
        return;
    }

    let body: FeedbackBody;
    try {
        body =
            typeof req.body === 'string'
                ? JSON.parse(req.body)
                : (req.body as FeedbackBody);
    } catch {
        res.status(400).json({ error: 'Invalid JSON body.' });
        return;
    }

    const { turnId, rating, comment } = body;
    if (!turnId || typeof turnId !== 'string') {
        res.status(400).json({ error: 'turnId is required.' });
        return;
    }
    if (rating !== 'up' && rating !== 'down') {
        res.status(400).json({ error: 'rating must be "up" or "down".' });
        return;
    }
    if (
        comment !== undefined &&
        (typeof comment !== 'string' || comment.length > 2000)
    ) {
        res.status(400).json({
            error: 'comment must be a string of 2000 characters or fewer.',
        });
        return;
    }

    await recordFeedback(turnId, rating, comment);
    res.status(200).json({ ok: true });
}
