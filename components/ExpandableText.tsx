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

    const showMore = (
        <span>
            ... <Toggle text={showMoreText} onClick={toggleTruncate} />
        </span>
    );

    // render full text if expanded, truncated otherwise
    return truncated ? (
        <TruncateMarkup
            lines={10}
            tokenize="words"
            ellipsis={showMore}
            {...props.truncateProps}
        >
            <span>{props.fullText}</span>
        </TruncateMarkup>
    ) : (
        <span>
            {props.fullText}{' '}
            <Toggle text={showLessText} onClick={toggleTruncate} />
        </span>
    );
};

export default ExpandableText;
