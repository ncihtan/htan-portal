import Select from 'react-select';
import { VictoryChart } from 'victory-chart';
import { VictoryContainer, VictoryLabel, VictoryTheme } from 'victory-core';
import { VictoryAxis } from 'victory-axis';
import { VictoryBar } from 'victory-bar';
import React from 'react';
import { observer, useLocalStore } from 'mobx-react';
import _ from 'lodash';
import { Entity } from '../lib/helpers';
import { Option } from 'react-select/src/filters';

export function getExploreChartOptions(
    filteredCases: Entity[],
    filteredSamples: Entity[]
) {
    const caseOps: Option[] = _.chain(filteredCases)
        .flatMap(_.entries)
        .reduce((agg: string[], [k, v]) => {
            if (!!v) agg.push(k);
            return agg;
        }, [])
        .uniq()
        .map((k) => {
            return {
                value: k,
                label: k + ':Case',
                data: { type: EntityType.CASE },
            };
        })
        .value();

    const sampleOps: Option[] = _.chain(filteredSamples)
        .flatMap(_.entries)
        .reduce((agg: string[], [k, v]) => {
            if (v !== undefined && v !== null) agg.push(k);
            return agg;
        }, [])
        .uniq()
        .map((k) => {
            return {
                value: k,
                label: k + ':Sample',
                data: { type: EntityType.SAMPLE },
            };
        })
        .value();

    return [...caseOps, ...sampleOps];
}

interface IExplorePlotProps {
    filteredCases: Entity[];
    filteredSamples: Entity[];
    selectedField: Option;
    normalizersByField?: Record<string, (entity: Entity) => string>;
    width?: number;
    logScale: boolean;
    metricType: any;
}

enum EntityType {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

function dependentAxisTickFormat(t: number) {
    // only show tick labels for the integer powers of 10
    return _.isInteger(Math.log10(t)) ? t : '';
}

export const DEFAULT_EXPLORE_PLOT_OPTIONS = [
    {
        value: 'Summary',
        label: 'Summary (Organ/Assay)',
        data: { type: 'CASE' },
    },
    {
        value: 'PrimaryDiagnosis',
        label: 'Primary Diagnosis',
        data: { type: 'CASE' },
    },
    {
        value: 'TissueorOrganofOrigin',
        label: 'Organ',
        data: { type: 'CASE' },
    },
    // { value: 'assayName', label: 'Assay', data: { type: 'SAMPLE' } },
    {
        value: 'Ethnicity',
        label: 'Ethnicity',
        data: { type: 'CASE' },
    },
    { value: 'Gender', label: 'Gender', data: { type: 'CASE' } },
    {
        value: 'Race',
        label: 'Race',
        data: { type: 'CASE' },
    },
];

const CustomTickComponent: React.FunctionComponent<any> = function (...args) {
    return null;
};

const ExplorePlot: React.FunctionComponent<IExplorePlotProps> = observer(
    function ({
        filteredCases,
        filteredSamples,
        selectedField,
        width = 800,
        logScale,
        metricType,
        normalizersByField,
    }) {
        const mode =
            metricType.value === 'ParticipantID'
                ? EntityType.CASE
                : EntityType.SAMPLE;

        const casesByIdMap = _.keyBy(filteredCases, (c) => c.ParticipantID);

        const propertyType = selectedField.data.type;

        const selectedValue: keyof Entity = selectedField.value as keyof Entity;

        let accessor =
            normalizersByField?.[selectedValue] ||
            ((e: Entity) => e[selectedValue]);

        const samplesByValueMap = _.groupBy(filteredSamples, (sample) => {
            // these will result in the counts
            let val: string | undefined = undefined;
            let entity: Entity;
            if (propertyType === EntityType.CASE) {
                // should actually be propery type
                // this will group the samples by a property of the case to which they belong,
                // allowing us to count them by a case property
                entity = casesByIdMap[sample.ParticipantID];
            } else {
                entity = sample;
            }

            return accessor(entity);
        });

        // generate reports
        const reportsByValueMap = _.mapValues(samplesByValueMap, (samples) => {
            const report = {
                sampleCount: _.uniqBy(samples, (s) => s.BiospecimenID).length,
                caseCount: _.uniqBy(samples, (s) => s.ParticipantID).length,
            };
            return report;
        });

        // transform reports into format required by plot
        const plotData = _(reportsByValueMap)
            .map((v, k) => {
                return {
                    label: k,
                    count:
                        mode === EntityType.CASE ? v.caseCount : v.sampleCount,
                };
            })
            .sortBy((datum) => datum.count)
            .value();

        const ticks = _.times(Math.ceil(Math.log10(plotData[0].count)), (i) => {
            return 10 ** i;
        });

        const tickProps = logScale
            ? {
                  tickFormat: dependentAxisTickFormat,
                  tickValues: ticks,
              }
            : {};

        const metric =
            mode === EntityType.SAMPLE
                ? `#Samples ${logScale ? '(log)' : ''}`
                : `#Cases ${logScale ? '(log)' : ''}`;

        const plotTitle = `${selectedField.label} ${metric}`;

        return (
            <>
                <VictoryChart
                    theme={VictoryTheme.material}
                    width={width}
                    height={plotData.length * 30 + 100}
                    containerComponent={<VictoryContainer responsive={false} />}
                    domainPadding={{
                        x: 30,
                        y: 100,
                    }}
                    singleQuadrantDomainPadding={{
                        y: true,
                        x: false,
                    }}
                    padding={{
                        left: 0,
                        top: 70,
                        right: 100,
                    }}
                    minDomain={{ y: 0.95 }}
                    scale={{ y: logScale ? 'log' : 'linear', x: 'linear' }}
                >
                    <VictoryAxis
                        dependentAxis={true}
                        label={plotTitle}
                        {...tickProps}
                        orientation="top"
                        //tickComponent={<CustomTickComponent />}
                        style={{
                            ticks: { size: 10 },
                            tickLabels: { fontSize: 10 },
                            axisLabel: { fontSize: 15, padding: 40 },
                            grid: {
                                stroke: 'none',
                            },
                        }}
                    />

                    <VictoryBar
                        horizontal={true}
                        data={plotData}
                        x={(datum) => {
                            return datum.label;
                        }}
                        labelComponent={
                            <VictoryLabel
                                text={(datum) => {
                                    return `${datum.datum.label} (${datum.datum.count})`;
                                }}
                            />
                        }
                        barWidth={20}
                        // data accessor for y values
                        y="count"
                        style={{
                            labels: { fontSize: 12 },
                            data: { fill: '#11c8d4' },
                        }}
                    ></VictoryBar>
                </VictoryChart>
            </>
        );
    }
);

export default ExplorePlot;