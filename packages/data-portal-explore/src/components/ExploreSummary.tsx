import React, { useMemo } from 'react';
import pluralize from 'pluralize';
import styles from './exploreSummary.module.scss';

pluralize.addPluralRule(/specimen$/i, 'specimens');

interface IExploreSummaryProps {
    summaryData: {
        values: any[];
        displayName: string;
    }[];
}

// Build the missing info message based on counts
function getMissingInfoMessage(
    caseCount: number,
    biospecimenCount: number
): string | null {
    const missingItems = [];
    if (caseCount === 0) missingItems.push('participant');
    if (biospecimenCount === 0) missingItems.push('biospecimen');

    if (missingItems.length === 0) return null;

    return `Note: Some files are missing associated ${missingItems.join(
        ' or '
    )} information.`;
}

export const ExploreSummary: React.FunctionComponent<IExploreSummaryProps> = (
    props
) => {
    // Extract counts from summaryData in a single pass
    const { caseCount, biospecimenCount, fileCount } = useMemo(() => {
        let caseCount = 0;
        let biospecimenCount = 0;
        let fileCount = 0;

        for (const item of props.summaryData) {
            if (item.displayName === 'Case') {
                caseCount = item.values.length;
            } else if (item.displayName === 'Biospecimen') {
                biospecimenCount = item.values.length;
            } else if (item.displayName === 'File') {
                fileCount = item.values.length;
            }
        }

        return { caseCount, biospecimenCount, fileCount };
    }, [props.summaryData]);

    // Check if there are files but no cases or biospecimens
    const hasMissingAssociations =
        fileCount > 0 && (caseCount === 0 || biospecimenCount === 0);

    const missingInfoMessage = hasMissingAssociations
        ? getMissingInfoMessage(caseCount, biospecimenCount)
        : null;

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
            {missingInfoMessage && (
                <div className={`alert alert-info ${styles.missingInfoBanner}`}>
                    {missingInfoMessage}
                </div>
            )}
        </>
    );
};

export default ExploreSummary;
