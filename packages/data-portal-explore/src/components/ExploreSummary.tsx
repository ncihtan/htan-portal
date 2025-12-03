import React from 'react';
import pluralize from 'pluralize';
import styles from './exploreSummary.module.scss';

pluralize.addPluralRule(/specimen$/i, 'specimens');

interface IExploreSummaryProps {
    summaryData: {
        values: any[];
        displayName: string;
    }[];
}

export const ExploreSummary: React.FunctionComponent<IExploreSummaryProps> = (
    props
) => {
    // Extract counts from summaryData
    const caseCount =
        props.summaryData.find((d) => d.displayName === 'Case')?.values
            .length || 0;
    const biospecimenCount =
        props.summaryData.find((d) => d.displayName === 'Biospecimen')?.values
            .length || 0;
    const fileCount =
        props.summaryData.find((d) => d.displayName === 'File')?.values
            .length || 0;

    // Check if there are files but no cases or biospecimens
    const hasMissingAssociations =
        fileCount > 0 && (caseCount === 0 || biospecimenCount === 0);

    // Build the missing info message
    const getMissingInfoMessage = () => {
        if (!hasMissingAssociations) return null;

        const missingItems = [];
        if (caseCount === 0) missingItems.push('participant');
        if (biospecimenCount === 0) missingItems.push('biospecimen');

        return `Note: Some files are missing associated ${missingItems.join(
            ' or '
        )} information.`;
    };

    return (
        <>
            <div className={styles.summary}>
                <div>
                    <strong>Summary:</strong>
                </div>
                {props.summaryData.map((d) => (
                    <div key={d.displayName}>
                        {pluralize(d.displayName, d.values.length, true)}
                    </div>
                ))}
            </div>
            {hasMissingAssociations && (
                <div className={`alert alert-info ${styles.missingInfoBanner}`}>
                    {getMissingInfoMessage()}
                </div>
            )}
        </>
    );
};

export default ExploreSummary;
