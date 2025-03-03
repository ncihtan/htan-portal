import fs from 'fs';
import path from 'path';
import { fillInEntities, LoadDataResult } from '@htan/data-portal-commons';

export function fetchAndFillInEntities() {
    const processedSynapseData = fs.readFileSync(
        path.join(process.cwd(), 'public/processed_syn_data.json'),
        'utf8'
    );

    return fillInEntities(
        (JSON.parse(processedSynapseData) as unknown) as LoadDataResult
    );
}
