import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import Select from 'react-select';

type Option = {
    value: string;
    label: string | JSX.Element;
    disabled?: boolean;
};

export type ColumnVisibilityDef = {
    id: string;
    name: string;
    visible: boolean;
    toggleable?: boolean;
};

export interface IColumnSelectProps {
    name?: string;
    placeholder?: string;
    width?: number;
    columnVisibility?: ColumnVisibilityDef[];
    onColumnToggled?: (selectedColumnIds: string[]) => void;
}

@observer
export class ColumnSelect extends React.Component<IColumnSelectProps, {}> {
    public static defaultProps: Partial<IColumnSelectProps> = {
        name: 'dataTableColumns',
        placeholder: 'Columns',
        width: 180,
    };

    constructor(props: IColumnSelectProps) {
        super(props);
        makeObservable<ColumnSelect, 'onChange'>(this);
    }

    @computed
    public get selectedOptions() {
        return (this.props.columnVisibility || [])
            .filter((c) => c.visible)
            .map((c) => ({ value: c.id, label: <span>{c.name}</span> }));
    }

    @computed
    public get options(): Option[] {
        return (this.props.columnVisibility || [])
            .filter((c) => c.toggleable)
            .map((c) => ({
                label: <span>{c.name}</span>,
                value: c.id,
            }));
    }

    public render() {
        return (
            <div style={{ width: this.props.width }}>
                <Select
                    isSearchable={false}
                    isClearable={false}
                    name={this.props.name}
                    placeholder={this.props.placeholder}
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
