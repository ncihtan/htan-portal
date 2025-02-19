import type { NextApiRequest, NextApiResponse } from 'next';
import {
    DashboardData,
    Entity,
    getDashboardData,
} from '@htan/data-portal-commons';
import { fetchAndFillInEntities } from '../../../lib/fetchEntities';

enum Endpoint {
    Dashboard = 'dashboard',
}

let entities: Entity[] | undefined;

function getFiles(): Entity[] {
    if (!entities) {
        // entities = fetchAndFillInEntities();
        entities = [];
    }

    return entities;
}

function dashboard(req: NextApiRequest, res: NextApiResponse<DashboardData>) {
    res.status(200).json(getDashboardData(getFiles()));
}

const requestMapping: { [key: string]: Function } = {
    [Endpoint.Dashboard]: dashboard,
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string;
    const requestHandler = requestMapping[id];

    if (requestHandler) {
        requestHandler(req, res);
    } else {
        res.status(404).json({ message: `Invalid request: ${id}` });
    }
}
