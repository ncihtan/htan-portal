import Select from 'react-select';
import { VictoryChart } from 'victory-chart';
import { VictoryContainer, VictoryLabel, VictoryTheme } from 'victory-core';
import { VictoryAxis } from 'victory-axis';
import { VictoryBar } from 'victory-bar';
import React from 'react';
import { observer, useLocalStore } from 'mobx-react';
import _ from 'lodash';
import { Entity } from '../lib/helpers';

interface IExplorePlotProps {
    groupsByPropertyFiltered: Record<string, Entity[]>;
    filteredCases: Entity[];
    filteredSamples: Entity[];
}

enum PlotMode {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

type IExploreTabsState = {
    selectedField: any;
    xaxis: any;
    mode: () => PlotMode;
};

const ExplorePlot: React.FunctionComponent<IExplorePlotProps> = observer(
    function ({ groupsByPropertyFiltered, filteredCases, filteredSamples }) {
        let options = _.map(groupsByPropertyFiltered, (value, key) => {
            return {
                value: key,
                label: key
                    .replace(/[A-Z]/g, (s) => ` ${s}`)
                    .replace(/of|or/g, (s) => ` ${s}`)
                    .replace(/$./, (s) => s.toUpperCase()),
                type: 'CASE',
            };
        });

        const xaxisOptions = [
            { value: 'ParticipantID', label: 'Case Count' },
            { value: 'BiospecimenID', label: 'Specimen Count' },
        ];

        const myStore = useLocalStore<IExploreTabsState>((props) => {
            return {
                xaxis: xaxisOptions[0],
                mode() {
                    return this.xaxis.value === 'ParticipantID'
                        ? PlotMode.CASE
                        : PlotMode.SAMPLE;
                },
                get selectedField() {
                    return this._selectedField || options[0];
                },
                _selectedField: null,
            };
        });

        const casesByIdMap = _.keyBy(filteredCases, (c) => c.ParticipantID);

        const propertyType: PlotMode = PlotMode.CASE;

        const samplesByValueMap = _.groupBy(filteredSamples, (sample) => {
            // these will result in the counts
            if (propertyType === PlotMode.CASE) {
                // should actually be propery type
                // this will group the samples by a property of the case to which they belong,
                // allowing us to count them by a case property
                return casesByIdMap[sample.ParticipantID][
                    myStore.selectedField.value
                ];
            } else {
                return sample[myStore.selectedField.value];
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

        // transform reports into format required by plot
        const plotData = _(reportsByValueMap)
            .map((v, k) => {
                return {
                    label: k,
                    count:
                        myStore.mode() === PlotMode.CASE
                            ? v.caseCount
                            : v.sampleCount,
                };
            })
            .sortBy((datum) => datum.count)
            .value();

        const ops = _.chain(filteredCases)
            .flatMap(_.entries)
            .reduce((agg: string[], [k, v]) => {
                if (!!v) agg.push(k);
                return agg;
            }, [])
            .uniq()
            .map((k) => {
                return {
                    value: k,
                    label: k
                        .replace(/[A-Z]/g, (s) => ` ${s}`)
                        .replace(/of|or/g, (s) => ` ${s}`)
                        .replace(/$./, (s) => s.toUpperCase()),
                };
            })
            .value();

        debugger;

        return (
            <>
                <div style={{ display: 'flex' }}>
                    <div style={{ width: 300, marginRight: 10 }}>
                        <Select
                            classNamePrefix={'react-select'}
                            isSearchable={false}
                            isClearable={false}
                            name={'field'}
                            controlShouldRenderValue={true}
                            options={ops}
                            defaultValue={options[0]}
                            hideSelectedOptions={false}
                            closeMenuOnSelect={true}
                            onChange={(e) => {
                                myStore._selectedField = e;
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
                <VictoryChart
                    theme={VictoryTheme.material}
                    scale={{ x: 'linear', y: 'log' }}
                    width={900}
                    height={plotData.length * 50}
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
                            myStore.mode() === PlotMode.SAMPLE
                                ? `Samples (log)`
                                : `Cases (log10)`
                        }
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
