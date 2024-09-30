import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import TruncateMarkup, { TruncateProps } from 'react-truncate-markup';
import { commonStyles } from '@htan/data-portal-commons';
import { ATTRIBUTE_OVERRIDES } from '@htan/data-portal-schema';

interface TruncatedValuesListProps {
    attribute: string;
    attributes: string[];
    truncateProps?: TruncateProps;
    modalTitle: string;
    countLabel: string;
    formatValue?: (value: string) => string;
}

interface ViewAllValuesModalProps {
    attribute: string;
    options: JSX.Element[];
    show: boolean;
    onClose: () => void;
    modalTitle: string;
}

const ViewAllValuesModal: React.FunctionComponent<ViewAllValuesModalProps> = (
    props
) => {
    return (
        <Modal show={props.show} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{props.modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{props.options}</Modal.Body>
        </Modal>
    );
};

const TruncatedValuesList: React.FunctionComponent<TruncatedValuesListProps> = (
    props
) => {
    const [showModal, setShowModal] = useState(false);
    const onModalClose = () => setShowModal(false);
    const onClick = () => setShowModal(true);

    const options = props.attributes
        .filter((attribute) => attribute.length > 0)
        .map((attribute) => ATTRIBUTE_OVERRIDES[attribute] || attribute)
        .map((attribute, index) => (
            <div key={index}>
                - {props.formatValue ? props.formatValue(attribute) : attribute}
            </div>
        ));

    const attribute = ATTRIBUTE_OVERRIDES[props.attribute] || props.attribute;
    const ellipsis = (
        <div>
            <ViewAllValuesModal
                attribute={attribute}
                options={options}
                show={showModal}
                onClose={onModalClose}
                modalTitle={`${attribute} ${props.modalTitle}`}
            />
            ...{' '}
            <i>
                {props.countLabel}: {options.length}
            </i>{' '}
            (
            <span className={commonStyles.clickable} onClick={onClick}>
                Show all
            </span>
            )
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

export default TruncatedValuesList;
