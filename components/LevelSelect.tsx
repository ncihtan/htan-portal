import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import Select from 'react-select';

type Option = {
    value: string;
    label: string | JSX.Element;
};

export interface ILevelSelectProps {
    name?: string;
    placeholder?: string;
    width?: number;
    allLevels?: string[];
    selectedLevels?: string[];
    onLevelToggled?: (selectedLevels: string[]) => void;
}

@observer
export class LevelSelect extends React.Component<ILevelSelectProps, {}> {
    public static defaultProps: Partial<ILevelSelectProps> = {
        name: 'dataLevels',
        width: 180,
    };

    constructor(props: ILevelSelectProps) {
        super(props);
        makeObservable<LevelSelect, 'onChange'>(this);
    }

    @computed get placeholder() {
        return this.props.placeholder || `Level`;
    }

    @computed
    public get selectedOptions() {
        return (this.props.selectedLevels || []).map((l) => ({
            value: l,
            label: <span>{l}</span>,
        }));
    }

    @computed
    public get options(): Option[] {
        return (this.props.allLevels?.sort() || []).map((l) => ({
            value: l,
            label: <span>{l}</span>,
        }));
    }

    public render() {
        return (
            <div style={{ width: this.props.width, justifySelf: 'flex-end' }}>
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
        if (this.props.onLevelToggled) {
            this.props.onLevelToggled(values.map((o) => o.value));
        }
    }
}

export default LevelSelect;
