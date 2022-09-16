import React, { useState } from 'react';
import TruncateMarkup, { TruncateProps } from 'react-truncate-markup';

import styles from './common.module.scss';

interface ExpandableTextProps {
    fullText: string;
    showMoreText?: string;
    showLessText?: string;
    truncateProps?: TruncateProps;
}

const Toggle: React.FunctionComponent<{
    text: string;
    onClick: () => void;
}> = (props) => {
    return (
        <span className={styles.clickable} onClick={props.onClick}>
            {props.text}
        </span>
    );
};

const ExpandableText: React.FunctionComponent<ExpandableTextProps> = (
    props
) => {
    // truncate text by default
    const [truncated, setTruncated] = useState<boolean>(true);

    const showMoreText = props.showMoreText || 'show more';
    const showLessText = props.showLessText || 'show less';

    const toggleTruncate = () => {
        setTruncated(!truncated);
    };

    // Disable toggler for now
    const tokens = props.fullText.split('#');
    const options = tokens
        .filter((token) => token.length > 0)
        .map((token) => (
            <span>
                - {token.toLowerCase()}
                <br />
            </span>
        ));
    const showMore = (
        <span>
            <br />
            ... <i>Number of valid options: {tokens.length}.</i>
            <p />
        </span>
    );

    return truncated ? (
        <TruncateMarkup
            lines={10}
            tokenize="words"
            ellipsis={showMore}
            {...props.truncateProps}
        >
            <span>{options}</span>
        </TruncateMarkup>
    ) : (
        <span>
            {options} <Toggle text={showLessText} onClick={toggleTruncate} />
        </span>
    );
};

export default ExpandableText;
