import React from 'react';
import styles from './styles.module.scss';

interface IFilterPropertyColumnShell {
    title: string;
}

const FilterPropertyColumnShell: React.FunctionComponent<IFilterPropertyColumnShell> = function (
    props
) {
    return (
        <div className={styles.column}>
            <div>
                <h4>{props.title}:</h4>
                <div className={styles.fileCountHeader}>Files</div>
            </div>
            {props.children}
        </div>
    );
};

export default FilterPropertyColumnShell;
