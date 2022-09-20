import React from 'react';
import TruncateMarkup, { TruncateProps } from 'react-truncate-markup';

interface ValidValuesProps {
    attributes: string[];
    truncateProps?: TruncateProps;
}

const ValidValues: React.FunctionComponent<ValidValuesProps> = (props) => {
    const options = props.attributes
        .filter((attribute) => attribute.length > 0)
        .map((attribute) => <div>- {attribute.toLowerCase()}</div>);

    const ellipsis = (
        <div>
            ... <i>Number of valid options: {props.attributes.length}.</i>
        </div>
    );

    return (
        <TruncateMarkup
            lines={10}
            tokenize="words"
            ellipsis={ellipsis}
            {...props.truncateProps}
        >
            <span>{options}</span>
        </TruncateMarkup>
    );
};

export default ValidValues;
