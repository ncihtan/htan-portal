import React from 'react';
import _ from 'lodash';
import pluralize from 'pluralize';

import { AttributeNames } from '../lib/types';
import { Entity } from '../lib/helpers';

pluralize.addPluralRule(/specimen$/i, 'specimens');

interface IExploreSummaryProps {
    filteredFiles: Entity[];
    filteredBiospecimenCount: number;
    filteredCaseCount: number;
    getGroupsByPropertyFiltered: any;
}

export const ExploreSummary: React.FunctionComponent<IExploreSummaryProps> = (
    props
) => {
    const atlasCount = _.keys(
        props.getGroupsByPropertyFiltered[AttributeNames.AtlasName]
    ).length;

    const organCount = _.keys(
        props.getGroupsByPropertyFiltered[AttributeNames.TissueorOrganofOrigin]
    ).length;

    const cancerTypeCount = _.keys(
        props.getGroupsByPropertyFiltered[AttributeNames.PrimaryDiagnosis]
    ).length;

    const assayCount = _.keys(
        props.getGroupsByPropertyFiltered[AttributeNames.assayName]
    ).length;

    const fileCount = props.filteredFiles.length;

    return (
        <>
            <div className={'summary'}>
                <div>
                    <strong>Summary:</strong>
                </div>

                <div>{pluralize('Team', atlasCount, true)}</div>
                <div>{pluralize('Organ', organCount, true)}</div>
                <div>{pluralize('Cancer Type', cancerTypeCount, true)}</div>
                <div>{pluralize('Case', props.filteredCaseCount, true)}</div>
                <div>
                    {pluralize(
                        'Biospecimen',
                        props.filteredBiospecimenCount,
                        true
                    )}
                </div>
                <div>{pluralize('Assay', assayCount, true)}</div>
                <div>{pluralize('File', fileCount, true)}</div>
            </div>
        </>
    );
};
