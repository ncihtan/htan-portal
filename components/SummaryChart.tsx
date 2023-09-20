import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import pluralize from 'pluralize';
import React from 'react';
import { Popover, PopoverContent } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import * as ReactDOM from 'react-dom';
import { VictoryBar, VictoryBarTTargetType } from 'victory-bar';
import { VictoryChart, VictoryChartProps } from 'victory-chart';
import { VictoryAxis } from 'victory-axis';
import {
    D3Scale,
    ScalePropType,
    VictoryLabel,
    VictoryTheme,
} from 'victory-core';
import { VictoryStack } from 'victory-stack';

import { urlEncodeSelectedFilters } from '../lib/helpers';
import {
    DistributionByAttribute,
    EntityReportByCenter,
    EntityReportByAttribute,
    entityReportByAttributeToByCenter,
    dataWithoutUnknownValues,
} from '../lib/entityReportHelpers';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { SelectedFilter } from '../packages/data-portal-filter/src/libs/types';
import { AttributeNames } from '../packages/data-portal-utils/src/libs/types';
import { FileAttributeMap } from '../packages/data-portal-commons/src/libs/types';

export interface SummaryChartProps {
    data: EntityReportByAttribute[];
    stackedByCenter?: boolean; // each bar will be stacked to visualize an additional distribution by center
    dependentAxisEntityName?: string; // case, file, biospecimen, etc.
    dependentAxisTickFormat?:
        | any[]
        | ((tick: any, index: number, ticks: any[]) => string | number);
    entityColorMap?: { [attribute: string]: string };
    defaultBarColor?: string;
    categoricalAxisSortValues?: ((r: EntityReportByAttribute) => any)[]; // sort criteria for the categorical axis labels
    categoricalAxisSortDirections?: ('asc' | 'desc')[]; // sort direction for the categorical axis labels
    scale?: // log, linear, etc.
    | ScalePropType
        | D3Scale
        | {
              x?: ScalePropType | D3Scale;
              y?: ScalePropType | D3Scale;
          };
    minDomain?: number | { x?: number; y?: number }; // useful when using a non linear scale
    tooltipContent?: (datum: any) => JSX.Element;
}

export const VERTICAL_OFFSET = 17;
export const HORIZONTAL_OFFSET = 8;

interface TooltipDatum {
    attributeName: string;
    attributeValue?: string;
    totalCount: number;
    countColumnEntityName: string;
    attributeFilterValues: string[];
    center?: string;
    distributionByAttribute?: DistributionByAttribute[];
}

export const DEFAULT_BAR_COLOR = 'rgb(36, 202, 213)';

// TODO these colors are mostly random
const CENTER_COLORS: { [center: string]: string } = {
    'HTAN BU': '#e6194B',
    'HTAN HTAPP': '#f58231',
    'HTAN CHOP': '#ffe119',
    'HTAN Duke': '#bfef45',
    'HTAN HMS': '#3cb44b',
    'HTAN MSK': '#42d4f4',
    'HTAN OHSU': '#4363d8',
    'HTAN Stanford': '#ffa600',
    'HTAN Vanderbilt': '#911eb4',
    'HTAN WUSTL': '#f032e6',
};

// TODO these colors are mostly random
export const assayColorMap: { [center: string]: string } = {
    'Bulk DNA': '#e6194B',
    'Bulk RNA-seq': '#f58231',
    CyCIF: '#ffe119',
    'H&E': '#666add',
    IMC: '#bfef45',
    'LC-MS/MS': '#3cb44b',
    'LC-MS3': '#42d4f4',
    'Shotgun MS (lipidomics)': '#4363d8',
    mIHC: '#ffa600',
    'scATAC-seq': '#911eb4',
    'scRNA-seq': '#f032e6',
};

// TODO these should not be random!
export const organColorMap: { [organ: string]: string } = {
    'Bone Marrow': '#e6194B',
    Breast: '#f58231',
    Colorectal: '#ffe119',
    Lung: '#bfef45',
    Pancreas: '#3cb44b',
};

function generateBaseExploreUrl(
    attributeId: string,
    attributeFilterValues: string[],
    center?: string
) {
    const filters: SelectedFilter[] = [];

    // filter by original attribute values
    filters.push(
        ...attributeFilterValues.map((value) => ({
            group: attributeId,
            value,
        }))
    );

    if (center) {
        // filter by atlas name
        filters.push({
            group: 'AtlasName',
            value: center,
        });
    }

    const urlParams = urlEncodeSelectedFilters(filters);

    return `/explore?selectedFilters=${urlParams}`;
}

const TooltipContent: React.FunctionComponent<TooltipDatum> = (props) => {
    const attributeName = props.distributionByAttribute?.length
        ? props.distributionByAttribute[0].attributeName
        : 'unknown';

    const columns = [
        {
            name:
                FileAttributeMap[attributeName as AttributeNames]
                    ?.displayName || attributeName,
            selector: (distribution: DistributionByAttribute) =>
                distribution.attributeValue,
            sortable: true,
            grow: 3,
        },
        {
            name: `# ${props.countColumnEntityName}s`,
            selector: (distribution: DistributionByAttribute) =>
                distribution.caseCount,
            sortable: true,
        },
    ];

    const tableStyle = getDefaultDataTableStyle();
    tableStyle.headCells.style.fontSize = 14;
    tableStyle.cells.style.fontSize = 12;

    const baseUrl = generateBaseExploreUrl(
        props.attributeName,
        props.attributeFilterValues,
        props.center
    );
    const caseHref = `${baseUrl}&tab=cases`;
    const biospecimenHref = `${baseUrl}&tab=biospecimen`;
    const fileHref = `${baseUrl}&tab=file`;

    const dataTable = props.distributionByAttribute?.length ? (
        <DataTable
            columns={columns}
            data={props.distributionByAttribute}
            striped={true}
            dense={true}
            noHeader={true}
            pagination={false}
            customStyles={tableStyle}
            defaultSortField="caseCount"
            defaultSortAsc={false}
        />
    ) : null;

    const centerInfo = props.center ? (
        <>
            {' '}
            from <strong>{props.center}</strong>
        </>
    ) : null;

    return (
        <PopoverContent>
            <div>
                <strong>{props.totalCount}</strong>{' '}
                {pluralize(
                    props.countColumnEntityName.toLowerCase(),
                    props.totalCount
                )}
                {centerInfo}. Explore <a href={caseHref}>cases</a>,{' '}
                <a href={biospecimenHref}>biospecimens</a>, or{' '}
                <a href={fileHref}>files</a>.
            </div>
            {dataTable}
        </PopoverContent>
    );
};

@observer
export default class SummaryChart extends React.Component<SummaryChartProps> {
    constructor(props: SummaryChartProps) {
        super(props);
        makeObservable(this);
    }

    @observable private toolTipCounter = 0;
    @observable private isTooltipHovered = false;
    @observable private shouldUpdatePosition = false; // prevents chasing tooltip
    @observable private tooltipDatum: TooltipDatum | null = null;

    @observable mousePosition = { x: 0, y: 0 };

    get rightPadding() {
        return 0;
    }

    get leftPadding() {
        if (this.categoryLabels) {
            const longestLabel = _.maxBy(this.categoryLabels, (l) => l.length);
            return longestLabel!.length * 8;
        } else {
            return 100;
        }
    }

    get barWidth() {
        return 15;
    }

    get barSeparation() {
        return 20;
    }

    get chartHeight() {
        return (
            this.categoryLabels.length * (this.barWidth + this.barSeparation) +
            100
        );
    }

    get chartWidth() {
        // TODO responsive?
        return this.leftPadding + 500;
    }

    private get svgHeight() {
        return this.chartHeight;
    }

    get svgWidth() {
        return this.chartWidth + this.rightPadding + this.leftPadding;
    }

    get domainPadding() {
        return 20;
    }

    get categoryAxisDomainPadding() {
        return this.domainPadding;
    }

    get numericalAxisDomainPadding() {
        return this.domainPadding;
    }

    get chartDomainPadding() {
        return {
            y: this.numericalAxisDomainPadding,
            x: this.categoryAxisDomainPadding,
        };
    }

    get dependentAxisEntityName() {
        return this.props.dependentAxisEntityName
            ? _.capitalize(this.props.dependentAxisEntityName)
            : 'Case';
    }
    get dependentAxisLabel() {
        return `# of ${this.dependentAxisEntityName}s`;
    }

    get categoryLabels(): string[] {
        return this.data.map((d) => d.attributeValue!);
    }

    /*
     * returns events configuration for Victory chart
     */
    get barPlotEvents() {
        const self = this;
        return [
            {
                target: 'data' as VictoryBarTTargetType,
                eventHandlers: {
                    onMouseEnter: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    self.shouldUpdatePosition = true;
                                    self.tooltipDatum = props.datum;
                                    self.toolTipCounter++;
                                },
                            },
                        ];
                    },
                    onMouseLeave: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    // Freeze tool tip position and give user a moment to mouse over it
                                    self.shouldUpdatePosition = false;

                                    setTimeout(() => {
                                        // If they don't, get rid of it
                                        if (
                                            !self.isTooltipHovered &&
                                            self.toolTipCounter === 1
                                        ) {
                                            self.tooltipDatum = null;
                                        }
                                        self.toolTipCounter--;
                                    }, 100);
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    get data() {
        return _.orderBy(
            dataWithoutUnknownValues(this.props.data),
            this.props.categoricalAxisSortValues || [
                // first sort by count
                (r) => r.totalCount,
                // then alphabetically in case of a tie
                (r) => r.attributeValue,
            ],
            this.props.categoricalAxisSortDirections || ['asc', 'desc']
        );
    }

    get diagnosisReportByCenter() {
        return entityReportByAttributeToByCenter(this.data);
    }

    get simpleBars() {
        const data: TooltipDatum[] = this.data.map((r) => ({
            attributeName: r.attributeName,
            attributeValue: r.attributeValue,
            totalCount: r.totalCount,
            countColumnEntityName: this.dependentAxisEntityName,
            attributeFilterValues: r.attributeFilterValues,
            distributionByAttribute: r.distributionByCenter.map((d) => ({
                attributeName: 'Atlas',
                attributeValue: d.center,
                caseCount: d.totalCount,
            })),
        }));

        return (
            <VictoryBar
                horizontal={true}
                style={{
                    data: {
                        width: this.barWidth,
                        fill: (d) => {
                            const color = this.props.entityColorMap
                                ? this.props.entityColorMap[
                                      d.datum.attributeValue
                                  ]
                                : undefined;
                            return (
                                color ||
                                this.props.defaultBarColor ||
                                DEFAULT_BAR_COLOR
                            );
                        },
                    },
                }}
                events={this.barPlotEvents}
                data={data}
                x="attributeValue"
                y="totalCount"
            />
        );
    }

    get bars() {
        return this.props.stackedByCenter ? (
            <VictoryStack>{this.stackedBars}</VictoryStack>
        ) : (
            this.simpleBars
        );
    }

    get stackedBars() {
        return this.diagnosisReportByCenter.map(
            (r: EntityReportByCenter, i: number) => {
                const data: TooltipDatum[] = r.distributionByAttribute
                    .filter((d) => d.attributeValue?.length)
                    .map((d) => ({
                        attributeName: d.attributeName,
                        attributeValue: d.attributeValue,
                        totalCount: d.totalCount,
                        countColumnEntityName: this.dependentAxisEntityName,
                        center: r.center,
                        distributionByAttribute:
                            d.distributionByAdditionalAttribute,
                        attributeFilterValues: d.attributeFilterValues,
                    }));

                const dataByAttribute = _.keyBy(data, (d) => d.attributeValue!);
                const attributeName = data[0]?.attributeName || 'N/A';

                // add zero counts to properly sort data
                const barData: TooltipDatum[] = this.categoryLabels.map(
                    (value) =>
                        dataByAttribute[value]
                            ? dataByAttribute[value]
                            : {
                                  attributeName: attributeName,
                                  attributeValue: value,
                                  totalCount: 0,
                                  countColumnEntityName: this
                                      .dependentAxisEntityName,
                                  center: r.center,
                                  attributeFilterValues: [],
                                  distributionByAdditionalAttribute: [],
                              }
                );

                return (
                    <VictoryBar
                        horizontal={true}
                        style={{
                            data: {
                                width: this.barWidth,
                                fill: (d) => CENTER_COLORS[d.datum.center],
                            },
                        }}
                        events={this.barPlotEvents}
                        data={barData}
                        key={i}
                        x="attributeValue"
                        y="totalCount"
                    />
                );
            }
        );
    }

    private get barChart() {
        return (
            <svg
                style={{
                    width: this.svgWidth,
                    height: this.svgHeight,
                    pointerEvents: 'all',
                }}
                height={this.svgHeight}
                width={this.svgWidth}
                role="img"
                viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                onMouseMove={this.onMouseMove}
            >
                <g>
                    <VictoryChart
                        theme={VictoryTheme.material}
                        width={this.chartWidth}
                        height={this.chartHeight}
                        standalone={false}
                        domainPadding={this.chartDomainPadding}
                        singleQuadrantDomainPadding={{
                            y: true,
                            x: false,
                        }}
                        padding={{ left: this.leftPadding, top: 70 }}
                        scale={this.props.scale}
                        minDomain={this.props.minDomain}
                    >
                        <VictoryAxis
                            dependentAxis={true}
                            label={this.dependentAxisLabel}
                            style={{
                                tickLabels: { fontSize: 16 },
                                axisLabel: { fontSize: 14, padding: 40 },
                            }}
                            orientation="top"
                            tickFormat={this.props.dependentAxisTickFormat}
                        />

                        <VictoryAxis
                            orientation="left"
                            crossAxis={false}
                            tickValues={this.categoryLabels}
                            tickLabelComponent={
                                <VictoryLabel textAnchor="end" />
                            }
                            style={{
                                ticks: { size: 0 },
                                tickLabels: { fontSize: 16 },
                            }}
                        />

                        {this.bars}
                    </VictoryChart>
                </g>
            </svg>
        );
    }

    @computed
    private get tooltip() {
        if (!this.tooltipDatum) {
            return null;
        } else {
            const datum = this.tooltipDatum;
            const minWidth = 450;

            return (ReactDOM as any).createPortal(
                <Popover
                    id="diganosis-report-chart-popover"
                    onMouseLeave={this.tooltipMouseLeave}
                    onMouseEnter={this.tooltipMouseEnter}
                    style={{
                        minWidth,
                        left: this.mousePosition.x + VERTICAL_OFFSET,
                        top: this.mousePosition.y - HORIZONTAL_OFFSET,
                    }}
                    placement="right"
                >
                    {this.props.tooltipContent ? (
                        this.props.tooltipContent(datum)
                    ) : (
                        <TooltipContent {...datum} />
                    )}
                </Popover>,
                document.body
            );
        }
    }

    public render() {
        return (
            <div className="ml-auto mr-auto">
                {this.barChart}
                {this.tooltip}
            </div>
        );
    }

    @action.bound
    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    @action.bound
    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipDatum = null;
    }

    @action.bound
    private onMouseMove(e: React.MouseEvent<any>) {
        if (this.shouldUpdatePosition) {
            this.mousePosition.x = e.pageX;
            this.mousePosition.y = e.pageY;
        }
    }
}
