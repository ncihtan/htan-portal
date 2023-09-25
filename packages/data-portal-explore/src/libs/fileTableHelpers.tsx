import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import React from 'react';

import { Entity } from '../../../data-portal-commons/src/libs/entity';
import interleave from '../../../data-portal-utils/src/libs/interleave';
import SimpleScrollPane from '../components/SimpleScrollPane';
import { selectorToColumnName } from '../../../data-portal-table/src/libs/helpers';

export function makeListColumn(selector: keyof Entity, pluralName: string) {
    return {
        name: selectorToColumnName(selector),
        selector: (file: Entity) => file[selector] as string,
        cell: (file: Entity) => {
            const fileFieldValue = file[selector];
            const uniqueElts = fileFieldValue
                ? _.uniq((fileFieldValue as string).split(','))
                : [];
            if (uniqueElts.length === 0) {
                return '';
            } else if (uniqueElts.length === 1) {
                return uniqueElts[0];
            } else {
                return (
                    <Tooltip
                        overlay={
                            <SimpleScrollPane
                                width={150}
                                height={150}
                                style={{
                                    background: 'white',
                                    color: 'black',
                                    padding: '5px 10px 5px 10px',
                                }}
                            >
                                {interleave(uniqueElts, <br />)}
                            </SimpleScrollPane>
                        }
                    >
                        <span>
                            {uniqueElts.length} {pluralName}
                        </span>
                    </Tooltip>
                );
            }
        },
        wrap: true,
        sortable: true,
    };
}
