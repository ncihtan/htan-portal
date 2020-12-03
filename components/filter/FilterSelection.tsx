import React from 'react';
import { Portal } from 'react-portal';
import { Atlas, Entity } from '../../lib/helpers';
import styles from './filterSelection.module.scss';

interface IFilterSelectionProps {
    options: string[];
}

export default class FilterSelection extends React.Component<
    IFilterSelectionProps,
    { open: boolean }
> {
    constructor(props: any) {
        super(props);

        this.state = {
            open: false,
        };
    }

    togglePanel() {
        this.setState({
            open: !this.state.open,
        });
    }

    render() {
        return (
            <div className={styles.select} onClick={() => this.togglePanel()}>
                Select a thing
                {this.state.open && (
                    <div className={styles.selectPanel}>fdas</div>
                )}
            </div>
        );
    }
}
