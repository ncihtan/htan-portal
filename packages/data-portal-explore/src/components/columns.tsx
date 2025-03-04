import { Entity } from '@htan/data-portal-commons';
import { convertAgeInDaysToYears } from '@htan/data-portal-utils';
import React from 'react';

export const commonColumns = {
    AgeatDiagnosis: {
        // we need to customize both the name and the tooltip since we convert days to years
        name: 'Age at Diagnosis (years)',
        sortable: true,
        headerTooltip:
            'Age at the time of diagnosis expressed in number of years since birth.',
        format: (sample: Entity) =>
            convertAgeInDaysToYears(sample.AgeatDiagnosis),
        cell: (sample: Entity) => {
            return (
                <span className="ml-auto">
                    {convertAgeInDaysToYears(sample.AgeatDiagnosis)}
                </span>
            );
        },
    },
};
