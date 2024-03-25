import React, { useState } from 'react';
import TruncateMarkup, { TruncateProps } from 'react-truncate-markup';

import styles from './common.module.scss';

interface ExpandableTextProps {
    fullText: string;
    showMoreText?: string;
    showLessText?: string;
    truncateProps?: TruncateProps;
    value?: string
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

export const ExpandableText: React.FunctionComponent<ExpandableTextProps> = (
    props
) => {
    // truncate text by default
    const [truncated, setTruncated] = useState<{ [key: string]: boolean }>({});

    const showMoreText = props.showMoreText || 'show more';
    const showLessText = props.showLessText || 'show less';
    const cellKey = `${props.value}`;

    const toggleTruncate = () => {
        setTruncated((prevState) => ({
            ...prevState,
            [cellKey]: !prevState[cellKey],
          }));
    };

    const showMore = (
        <span>
            ... <Toggle text={showMoreText} onClick={toggleTruncate} />
        </span>
    );

    // render full text if expanded, truncated otherwise
    // return truncated  ? (
    //     <TruncateMarkup
    //         lines={10}
    //         tokenize="words"
    //         ellipsis={showMore}
    //         {...props.truncateProps}
    //     >
    //         <span>{props.fullText}</span>
    //     </TruncateMarkup>
    // ) : (
    //     <span>
    //         {props.fullText}{' '}
    //         <Toggle text={showLessText} onClick={toggleTruncate} />
    //     </span>
    // );
    return truncated[cellKey] ? (
        <span>
          {props.fullText}{' '}
          <Toggle text={showLessText} onClick={toggleTruncate} />
        </span>
      ) : (
        <TruncateMarkup
          lines={10}
          tokenize="words"
          ellipsis={showMore}
          {...props.truncateProps}
        >
          <span>{props.fullText}</span>
        </TruncateMarkup>
      );
};

export default ExpandableText;
