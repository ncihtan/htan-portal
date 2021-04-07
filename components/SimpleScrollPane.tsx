import * as React from 'react';

interface ISimpleScrollPaneProps {
    width: number;
    height: number;
    style?: any;
    className?: string;
    children: any;
}

export default function SimpleScrollPane(props: ISimpleScrollPaneProps) {
    const divProps: any = {
        style: {
            width: props.width,
            height: props.height,
            overflow: 'scroll',
            ...props.style,
        },
    };
    if (props.className) {
        divProps.className = props.className;
    }
    return <div {...divProps}>{props.children}</div>;
}
