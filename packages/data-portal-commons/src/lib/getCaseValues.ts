import _ from 'lodash';
import { Entity } from './entity';
import { getNormalizedOrgan } from '@htan/data-portal-commons';

export function getCaseValues(propName: keyof Entity) {
    return (e: Entity) => {
        if (e.cases) {
            return _.uniq(e.cases.map((c) => c[propName] as string));
        } else {
            return [e[propName] as string];
        }
    };
}

export function getNormalizedOrganCaseValues() {
    return (e: Entity) => {
        if (e.cases) {
            return _.uniq(e.cases.map((c) => getNormalizedOrgan(c) as string));
        } else {
            return [getNormalizedOrgan(e) as string];
        }
    };
}
