import React, { FunctionComponent, useEffect, useRef } from 'react';
import styles from './styles.module.scss';
import { Portal } from 'react-portal';
import { observer, useLocalStore } from 'mobx-react';
import Select from 'react-select';
import $ from 'jquery';
import { clamp } from '../../lib/helpers';
import { action } from 'mobx';

const FilterPanelMenu: FunctionComponent<{
    panelStyle: any;
    closeMenu: () => void;
}> = observer(function ({ panelStyle, closeMenu, children }) {
    const panelRef = useRef<HTMLDivElement>(null);
    const localStore = useLocalStore(() => ({ adjustedLeft: panelStyle.left }));

    useEffect(
        action(() => {
            const clickHandler = function () {
                closeMenu();
            };

            $(window).on('click', clickHandler);

            if (panelRef && panelRef.current) {
                const rect = panelRef!.current.getBoundingClientRect();
                // make it so panel doesnt go offscreen
                localStore.adjustedLeft = clamp(
                    panelStyle.left,
                    window.scrollX,
                    document.body.clientWidth + window.scrollX - rect.width - 15
                );
            }

            return () => {
                $(window).off('click', clickHandler);
            };
        }),
        []
    );

    return (
        <Portal>
            <div
                ref={panelRef}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                style={{ ...panelStyle, left: localStore.adjustedLeft }}
                className={styles.panel}
            >
                {children}
            </div>
        </Portal>
    );
});

const FilterPanel: FunctionComponent<{ placeholder?: string }> = observer(
    function ({ placeholder, children }) {
        const buttonRef = useRef<HTMLDivElement>(null);

        const localStore = useLocalStore(() => ({ showPanel: false }));

        const MENU_VERTICAL_OFFSET = 5;

        const panelStyle: any = {};
        if (buttonRef && buttonRef.current) {
            const pos = buttonRef!.current.getBoundingClientRect();
            panelStyle.top =
                pos.y + pos.height + window.scrollY + MENU_VERTICAL_OFFSET;
            panelStyle.left = pos.x + window.scrollX;
        }

        const panel = buttonRef.current && (
            <FilterPanelMenu
                panelStyle={panelStyle}
                closeMenu={action(() => (localStore.showPanel = false))}
            >
                {children}
            </FilterPanelMenu>
        );

        return (
            <>
                <div
                    ref={buttonRef}
                    onClick={action(() => {
                        localStore.showPanel = !localStore.showPanel;
                    })}
                >
                    <Select
                        classNamePrefix={'react-select'}
                        isSearchable={false}
                        placeholder={placeholder || 'Make a selection'}
                        menuIsOpen={false}
                    />
                    {localStore.showPanel && panel}
                </div>
            </>
        );
    }
);

export default FilterPanel;
