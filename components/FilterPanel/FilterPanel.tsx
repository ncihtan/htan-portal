import React, { FunctionComponent, useEffect, useRef } from 'react';
import styles from './styles.module.scss';
import { Portal } from 'react-portal';
import { observer, useLocalStore } from 'mobx-react';
import Select from 'react-select';
import $ from 'jquery';

const FilterPanelMenu: FunctionComponent<{
    panelStyle: any;
    closeMenu: () => void;
}> = function ({ panelStyle, closeMenu, children }) {
    useEffect(() => {
        const clickHandler = function () {
            closeMenu();
        };

        $(window).on('click', clickHandler);

        return () => {
            console.log('removing');
            $(window).off('click', clickHandler);
        };
    }, []);

    return (
        <Portal>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                }}
                style={panelStyle}
                className={styles.panel}
            >
                {children}
            </div>
        </Portal>
    );
};

const FilterPanel: FunctionComponent<{ placeholder?:string }> = observer(function ({ placeholder, children }) {
    const buttonRef = useRef<HTMLDivElement>(null);

    const localStore = useLocalStore(() => ({ showPanel: false }));

    const MENU_VERTICAL_OFFSET = 5;

    const panelStyle: any = {};
    if (buttonRef && buttonRef.current) {
        const pos = buttonRef!.current.getBoundingClientRect();
        panelStyle.top =
            pos.y + pos.height + window.scrollY + MENU_VERTICAL_OFFSET;
    }

    const panel = buttonRef.current && (
        <FilterPanelMenu
            panelStyle={panelStyle}
            closeMenu={() => (localStore.showPanel = false)}
        >
            {children}
        </FilterPanelMenu>
    );

    return (
        <>
            <div
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    localStore.showPanel = !localStore.showPanel;
                }}
            >
                <Select
                    isSearchable={false}
                    placeholder={placeholder || 'Make a selection'}
                    menuIsOpen={false}
                />
                {localStore.showPanel && panel}
            </div>
        </>
    );
});

export default FilterPanel;
