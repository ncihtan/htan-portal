import { getDefaultDataTableStyle } from '@htan/data-portal-table';

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
