import * as React from 'react';

interface ISimpleScrollPaneProps {
    width: number;
    height: number;
    style?: any;
    children: any;
}

export default function SimpleScrollPane(props: ISimpleScrollPaneProps) {
    return (
        <div
            style={{
                width: props.width,
                height: props.height,
                overflow: 'scroll',
                ...props.style,
            }}
        >
            {props.children}
        </div>
    );
}
