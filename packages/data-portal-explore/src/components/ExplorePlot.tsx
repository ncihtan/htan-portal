import { VictoryChart } from 'victory-chart';
import { VictoryContainer, VictoryLabel, VictoryTheme } from 'victory-core';
import { VictoryAxis } from 'victory-axis';
import { VictoryBar } from 'victory-bar';
import React, { useEffect, useState } from 'react';
import { observer, useLocalStore } from 'mobx-react';
import _ from 'lodash';
import { Option } from 'react-select/src/filters';
import { Entity } from '@htan/data-portal-commons';
import remoteData from 'mobxpromise';
import { doQuery, plotQuery } from '../../../../lib/clickhouseStore.ts';

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
    selectedField: Option;
    width?: number;
    logScale: boolean;
    metricType: any;
    hideNA?: boolean;
    normalizeNA?: boolean;
    query?: string;
}

enum EntityType {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

function dependentAxisTickFormat(t: number) {
    // only show tick labels for the integer powers of 10
    return _.isInteger(Math.log10(t)) ? t : '';
}

function normalizeUnknownValues(
    entity: Entity,
    accessor?: (entity: Entity) => Entity[keyof Entity]
) {
    const val = accessor ? accessor(entity) || '' : '';

    if (val === '' || /^unknown|not reported|^NA/i.test(val.toString())) {
        return 'NA';
    } else {
        return val;
    }
}

export const DEFAULT_EXPLORE_PLOT_OPTIONS = [
    // {
    //     data: { type: 'SAMPLE' },
    //     label: 'Assay',
    //     value: 'assayName',
    //     table: '',
    // },
    {
        value: 'TissueorOrganofOrigin',
        label: 'Organ',
        table: 'diagnosis',
        data: { type: 'CASE' },
    },
    {
        value: 'PrimaryDiagnosis',
        label: 'Primary Diagnosis',
        table: 'diagnosis',
        data: { type: 'CASE' },
    },
    {
        value: 'Ethnicity',
        label: 'Ethnicity',
        table: 'cases',
        data: { type: 'CASE' },
    },
    {
        value: 'Gender',
        table: 'cases',
        label: 'Gender',
        data: { type: 'CASE' },
    },
    {
        value: 'Race',
        table: 'cases',
        label: 'Race',
        data: { type: 'CASE' },
    },
];

export const ExplorePlot: React.FunctionComponent<IExplorePlotProps> = observer(
    function ({
        selectedField,
        width = 800,
        logScale,
        metricType,
        hideNA,
        query,
    }) {
        const mode =
            metricType.value === 'ParticipantID'
                ? EntityType.CASE
                : EntityType.SAMPLE;

        const store = useLocalStore(() => ({
            plotData: new remoteData({
                invoke: async () => {
                    const q =
                        query ||
                        plotQuery({
                            field: selectedField.value,
                            table: selectedField.table,
                            filterString: '',
                        });

                    const d = await doQuery(q);

                    // clickhouse returns counts as strings, so fix this
                    d.forEach((item) => {
                        item.count = parseInt(item.count);
                    });

                    return _.orderBy(d, 'count');
                },
            }),
        }));

        if (!store.plotData.isComplete) {
            return <></>;
        }

        const entityField: keyof Entity = selectedField.value as keyof Entity;

        let plotData = store.plotData.result;

        // these are used only if we are in logscale
        let ticks = [];
        if (plotData && plotData.length) {
            ticks = _.times(
                Math.ceil(Math.log10(plotData[plotData.length - 1].count)),
                (i) => {
                    return 10 ** (i + 1);
                }
            );
        }

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
                    />
                </VictoryChart>
            </>
        );
    }
);

export default ExplorePlot;
