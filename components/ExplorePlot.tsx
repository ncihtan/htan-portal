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

interface IExplorePlotProps {
    filteredCases: Entity[];
    filteredSamples: Entity[];
    selectedField?: Option;
    hideSelectors?: boolean;
}

enum EntityType {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

type IExploreTabsState = {
    selectedField: Option;
    _selectedField: Option | null;
    xaxis: any;
    mode: () => EntityType;
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

        const myStore = useLocalStore<IExploreTabsState>(() => {
            return {
                xaxis: xaxisOptions[0],
                mode() {
                    return this.xaxis.value === 'ParticipantID'
                        ? EntityType.CASE
                        : EntityType.SAMPLE;
                },
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

        const samplesByValueMap = _.groupBy(filteredSamples, (sample) => {
            // these will result in the counts

            if (propertyType === EntityType.CASE) {
                // should actually be propery type
                // this will group the samples by a property of the case to which they belong,
                // allowing us to count them by a case property
                return casesByIdMap[sample.ParticipantID][
                    myStore.selectedField.value as keyof Entity
                ];
            } else {
                return sample[myStore.selectedField.value as keyof Entity];
            }
        });

        // generate reports
        const reportsByValueMap = _.mapValues(samplesByValueMap, (samples) => {
            const report = {
                sampleCount: _.uniqBy(samples, (s) => s.BiospecimenID).length,
                caseCount: _.uniqBy(samples, (s) => s.ParticipantID).length,
            };
            return report;
        });

        console.log(ops);

        // transform reports into format required by plot
        const plotData = _(reportsByValueMap)
            .map((v, k) => {
                return {
                    label: k,
                    count:
                        myStore.mode() === EntityType.CASE
                            ? v.caseCount
                            : v.sampleCount,
                };
            })
            .sortBy((datum) => datum.count)
            .value();

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
                    scale={{ x: 'linear', y: 'linear' }}
                    width={800}
                    height={plotData.length * 30 + 100}
                    containerComponent={<VictoryContainer responsive={false} />}
                    domainPadding={{
                        x: 30,
                        y: 100,
                    }}
                    padding={{
                        left: 0,
                        top: 70,
                        right: 400,
                    }}
                >
                    <VictoryAxis
                        dependentAxis={true}
                        label={
                            myStore.mode() === EntityType.SAMPLE
                                ? `Samples`
                                : `Cases`
                        }
                        //tickFormat={(t)=>_.isInteger(Math.log10(t)) ? t : ''}
                        orientation="top"
                        style={{
                            ticks: { size: 10 },
                            tickLabels: { fontSize: 10 },
                            axisLabel: { fontSize: 15, padding: 40 },
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
