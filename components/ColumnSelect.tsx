import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import Select from 'react-select';

import { getColumnKey } from '../lib/dataTableHelpers';

type Option = {
    value: string;
    label: string | JSX.Element;
    disabled?: boolean;
};

export type ColumnVisibility = {
    id: string;
    name: string;
    visible: boolean;
    toggleable?: boolean;
};

export interface IColumnSelectProps {
    name?: string;
    placeholder?: string;
    width?: number;
    columnVisibility?: ColumnVisibility[];
    onColumnToggled?: (selectedColumnKeys: string[]) => void;
}

@observer
export class ColumnSelect extends React.Component<IColumnSelectProps, {}> {
    public static defaultProps: Partial<IColumnSelectProps> = {
        name: 'dataTableColumns',
        width: 180,
    };

    constructor(props: IColumnSelectProps) {
        super(props);
        makeObservable<ColumnSelect, 'onChange'>(this);
    }

    @computed get placeholder() {
        return (
            this.props.placeholder ||
            `Columns (${this.selectedOptions.length}/${this.options.length})`
        );
    }

    @computed
    public get selectedOptions() {
        return (this.props.columnVisibility || [])
            .filter((c) => c.visible)
            .map((c) => ({
                value: getColumnKey(c),
                label: <span>{getColumnKey(c)}</span>,
            }));
    }

    @computed
    public get options(): Option[] {
        return (this.props.columnVisibility || [])
            .filter((c) => c.toggleable)
            .map((c) => ({
                value: getColumnKey(c),
                label: <span>{getColumnKey(c)}</span>,
            }));
    }

    public render() {
        return (
            <div style={{ width: this.props.width }}>
                <Select
                    classNamePrefix={'react-select'}
                    isSearchable={false}
                    isClearable={false}
                    name={this.props.name}
                    placeholder={this.placeholder}
                    controlShouldRenderValue={false}
                    isMulti={true}
                    options={this.options as any}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={this.onChange as any}
                    value={this.selectedOptions}
                />
            </div>
        );
    }

    @action.bound
    private onChange(values: { value: string }[]) {
        if (this.props.onColumnToggled) {
            this.props.onColumnToggled(values.map((o) => o.value));
        }
    }
}

export default ColumnSelect;
