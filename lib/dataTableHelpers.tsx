import { getDefaultDataTableStyle } from '../packages/data-portal-table/src/libs/helpers';

export function getDataSchemaDataTableStyle() {
    const defaultStyle = getDefaultDataTableStyle();

    return {
        ...defaultStyle,
        header: {
            style: {
                fontSize: 16,
            },
        },
        cells: {
            ...defaultStyle.cells,
            lineHeight: '1.5em',
        },
        rows: {
            style: {
                paddingTop: '10px',
                paddingBottom: '10px',
            },
        },
    };
}
