import React, { useState } from 'react';
import _ from 'lodash';
import { AtlasDataTable } from './AtlasDataTable';
import { Category } from '../types';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

export const AtlasWrapper: React.FunctionComponent<{ category: Category }> = ({
    category,
}) => {
    const [showCol, setShowCol] = useState(false);
    const [selectedCategory, setCategory] = useState(Object.keys(category)[0]);
    const [filteredCategory, setFilteredCategory] = useState(category);
    const [atlasData, setAtlasData] = useState(
        filteredCategory[selectedCategory]
    );
    const [displayCols, setDisplayCols] = useState(
        _.map(category[selectedCategory].data.attributes, (k, i) => {
            return {
                name: k.name,
                enabled: true,
            };
        })
    );
    const subCats = Object.keys(category);
    subCats.sort();

    function handleTableToggle(e: any) {
        setCategory(e.target.value);
        setDisplayCols(
            _.map(category[e.target.value].data.attributes, (k) => {
                return {
                    name: k.name,
                    enabled: true,
                };
            })
        );
        setAtlasData(filteredCategory[e.target.value]);
    }

    function handleColToggle(e: any, label: string) {
        let disabledColLabels: any = [];
        let disabledColNums: any = [];
        let newDisplayCols = displayCols.map((attribute, i) => {
            let enabled = attribute.enabled;
            if (attribute.name === label) {
                enabled = e.target.checked;
            }

            if (enabled == false) {
                disabledColLabels.push(attribute.name);
                disabledColNums.push(i);
            }

            return {
                name: attribute.name,
                enabled: enabled,
            };
        });
        setDisplayCols(newDisplayCols);

        let filteredCols = category[selectedCategory].data.attributes.filter(
            (k, i) => {
                return !disabledColLabels.includes(k.name);
            }
        );

        let filteredRows: Array<any> = [];
        category[selectedCategory].data.values.map((row) => {
            let tmp_filtered: Array<any> = [];
            row.filter((cell: Array<any>, cell_index: Number) => {
                if (!disabledColNums.includes(cell_index)) {
                    tmp_filtered.push(cell);
                }
            });
            filteredRows.push(tmp_filtered);
        });

        setAtlasData({
            data: {
                attributes: filteredCols,
                values: filteredRows,
            },
            dataLink: filteredCategory[selectedCategory].dataLink,
        });
    }

    if (category) {
        return (
            <>
                <Row style={{ marginBottom: 20 }}>
                    <Form>
                        <Form.Group controlId="atlas.categorySelect">
                            <Form.Control
                                as="select"
                                defaultValue={selectedCategory}
                                onChange={(e) => handleTableToggle(e)}
                            >
                                {_.map(subCats, (k, i) => {
                                    return <option key={i}>{k}</option>;
                                })}
                            </Form.Control>
                        </Form.Group>
                    </Form>
                    &nbsp;&nbsp;
                    <span>
                        <a
                            href={category[selectedCategory].dataLink}
                            className={`btn btn-primary`}
                        >
                            Download
                        </a>
                    </span>
                    &nbsp;&nbsp;
                    <span>
                        <Button
                            id={`${selectedCategory}`}
                            onClick={() => setShowCol(!showCol)}
                            className={`btn btn-primary button-dropdown`}
                        >
                            Columns ▾
                        </Button>

                        {showCol && (
                            <div className={'col-select-card-wrapper'}>
                                <Card className={'col-select-card'}>
                                    <Card.Body>
                                        <Form>
                                            <Form.Group>
                                                {_.map(displayCols, (k, i) => {
                                                    return (
                                                        <Form.Check
                                                            onChange={(
                                                                e: any
                                                            ) =>
                                                                handleColToggle(
                                                                    e,
                                                                    k.name
                                                                )
                                                            }
                                                            type="checkbox"
                                                            defaultChecked={
                                                                k.enabled
                                                            }
                                                            key={i}
                                                            label={k.name}
                                                        />
                                                    );
                                                })}
                                            </Form.Group>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </div>
                        )}
                    </span>
                </Row>
                <Row>
                    <AtlasDataTable subcategoryData={atlasData} />
                </Row>
            </>
        );
    } else {
        return <div>No data corresponding to category.</div>;
    }
};
