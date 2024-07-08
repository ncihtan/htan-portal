import React, { useState } from 'react';
import TruncateMarkup, { TruncateProps } from 'react-truncate-markup';
import { Modal } from 'react-bootstrap';
import { commonStyles } from '@htan/data-portal-commons';

interface ConditionalIfValuesProps {
    attribute: string;
    attributes: string[];
    truncateProps?: TruncateProps;
}

interface ViewAllValuesModalProps {
    attribute: string;
    options: JSX.Element[];
    show: boolean;
    onClose: () => void;
}

const ViewAllValuesModal: React.FunctionComponent<ViewAllValuesModalProps> = (
    props
) => {
    return (
        <Modal show={props.show} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{props.attribute} required if</Modal.Title>
            </Modal.Header>
            <Modal.Body>{props.options}</Modal.Body>
        </Modal>
    );
};

const ConditionalIfValues: React.FunctionComponent<ConditionalIfValuesProps> = (
    props
) => {
    const [showModal, setShowModal] = useState(false);
    const onModalClose = () => setShowModal(false);
    const onClick = () => setShowModal(true);

    const options = props.attributes
        .filter((attribute) => attribute.length > 0)
        .map((attribute) => (
            <div key={attribute}>- {attribute.toLowerCase()}</div>
        ));

    const ellipsis = (
        <div>
            <ViewAllValuesModal
                attribute={props.attribute}
                options={options}
                show={showModal}
                onClose={onModalClose}
            />
            ... <i>Number of required if options: {options.length}</i> (
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

export default ConditionalIfValues;
