import _ from 'lodash';
import Row from 'react-bootstrap/Row';
import {
    computeUniqueAttributeValueCount,
    EntityReportByAttribute,
} from '../lib/entityReportHelpers';
import SummaryChart from './SummaryChart';
import Container from 'react-bootstrap/Container';
import React from 'react';
import { ScalePropType } from 'victory-core';

const chartScale: { x: ScalePropType; y: ScalePropType } = {
    x: 'linear',
    y: 'log',
};

// starting from y=1 doesn't work when case count=1.
// so we start from a slightly smaller value for a better bar chart visualization
const minDomain = { y: 0.95 };

function dependentAxisTickFormat(t: number) {
    // only show tick labels for the integer powers of 10
    return _.isInteger(Math.log10(t)) ? t : '';
}
export interface IPlotsProps {
    organSummary: EntityReportByAttribute[];
    assaySummary: EntityReportByAttribute[];
    summaryDataDescriptor?: string;
    footerContent?: JSX.Element;
}

const Plots: React.FunctionComponent<IPlotsProps> = ({
    organSummary,
    assaySummary,
    summaryDataDescriptor,
    footerContent,
}) => {
    summaryDataDescriptor =
        summaryDataDescriptor || 'The latest HTAN data release';

    return (
        <Container
            fluid
            style={{
                paddingTop: '20px',
                paddingBottom: '60px',
            }}
        >
            <Row className="justify-content-md-center">
                <p style={{ fontSize: 'medium' }}>
                    {summaryDataDescriptor} includes tumors originating from{' '}
                    <strong>
                        {computeUniqueAttributeValueCount(organSummary)}
                    </strong>{' '}
                    primary tumor sites:
                </p>
            </Row>
            <Row className="pr-5 pl-5">
                <SummaryChart
                    data={organSummary}
                    dependentAxisEntityName="Case"
                    stackedByCenter={false}
                    scale={chartScale}
                    minDomain={minDomain}
                    dependentAxisTickFormat={dependentAxisTickFormat}
                />
            </Row>
            <Row className="justify-content-md-center">
                <p style={{ fontSize: 'medium' }}>
                    The tumors were profiled with{' '}
                    <strong>
                        {computeUniqueAttributeValueCount(assaySummary)}
                    </strong>{' '}
                    different types of assays:
                </p>
            </Row>
            <Row className="pr-5 pl-5">
                <SummaryChart
                    data={assaySummary}
                    dependentAxisEntityName="Case"
                    stackedByCenter={false}
                    scale={chartScale}
                    minDomain={minDomain}
                    dependentAxisTickFormat={dependentAxisTickFormat}
                />
            </Row>
            {footerContent !== undefined && (
                <Row className="justify-content-md-center">{footerContent}</Row>
            )}
        </Container>
    );
};

export default Plots;
