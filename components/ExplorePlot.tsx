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
import { getNormalizedOrgan } from '../lib/entityReportHelpers';
import { log } from 'util';

interface IExplorePlotProps {
    filteredCases: Entity[];
    filteredSamples: Entity[];
    selectedField?: Option;
    hideSelectors?: boolean;
    title: string;
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

type IExploreTabsState = {
    selectedField: Option;
    _selectedField: Option | null;
    xaxis: any;
};

const defaultOptions = [
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
    { value: 'assayName', label: 'Assay', data: { type: 'SAMPLE' } },
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

const ExplorePlot: React.FunctionComponent<IExplorePlotProps> = observer(
    function ({
        filteredCases,
        hideSelectors,
        filteredSamples,
        selectedField,
        title,
        width = 800,
        logScale,
        metricType,
        normalizersByField,
    }) {
        const xaxisOptions = [
            { value: 'ParticipantID', label: 'Case Count' },
            { value: 'BiospecimenID', label: 'Specimen Count' },
        ];

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

        let ops = [...caseOps, ...sampleOps];

        //ops = defaultOptions;

        const mode =
            metricType.value === 'ParticipantID'
                ? EntityType.CASE
                : EntityType.SAMPLE;

        const myStore = useLocalStore<IExploreTabsState>(() => {
            return {
                xaxis: xaxisOptions[0],
                get selectedField() {
                    return (
                        selectedField ||
                        this._selectedField ||
                        (ops[0] as Option)
                    );
                },
                _selectedField: null,
            };
        });

        const casesByIdMap = _.keyBy(filteredCases, (c) => c.ParticipantID);

        const propertyType = myStore.selectedField.data.type;

        const selectedValue: keyof Entity = myStore.selectedField
            .value as keyof Entity;

        let accessor =
            normalizersByField?.[selectedValue] ||
            ((e: Entity) => e[selectedValue]);

        // if (selectedValue === "TissueorOrganofOrigin") {
        //     accessor =
        // }

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
                ? `# Samples ${logScale ? '(log)' : ''}`
                : `# Cases ${logScale ? '(log)' : ''}`;

        const plotTitle = `${title ? title + ' ' : ''} ${metric}`;

        return (
            <>
                {!hideSelectors && (
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: 300, marginRight: 10 }}>
                            <Select
                                classNamePrefix={'react-select'}
                                isSearchable={false}
                                isClearable={false}
                                name={'field'}
                                controlShouldRenderValue={true}
                                options={ops}
                                defaultValue={ops[0]}
                                hideSelectedOptions={false}
                                closeMenuOnSelect={true}
                                onChange={(e) => {
                                    myStore._selectedField = e!;
                                }}
                            />
                        </div>
                        <div style={{ width: 300 }}>
                            <Select
                                classNamePrefix={'react-select'}
                                isSearchable={false}
                                isClearable={false}
                                name={'xaxis'}
                                controlShouldRenderValue={true}
                                options={xaxisOptions}
                                hideSelectedOptions={false}
                                closeMenuOnSelect={true}
                                onChange={(e) => {
                                    myStore.xaxis = e;
                                }}
                                defaultValue={xaxisOptions[0]}
                            />
                        </div>
                    </div>
                )}
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
