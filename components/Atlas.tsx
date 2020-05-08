import React, {useState} from "react";
import _ from 'lodash';
import {AtlasDataTable} from "./AtlasDataTable";
import {Category} from "../types";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";


export const AtlasWrapper: React.FunctionComponent<{ category: Category }> = ({category}) => {
    const [showCol, setShowCol] = useState(false);
    const [origCategory, setOrigCategory] = useState(category);

    function handleColToggle(e: any, label: string, displayCols: Array<any>, setDisplayCols: Function, selectedCategory: any) {
        let disabled: any = [];
        let colNums : any = [];

        displayCols = _.map(displayCols, ((k, i) => {
            let enabled = k.enabled;
            if (k.name === label) {
                enabled = e.target.checked;
            }

            if (enabled == false) {
                disabled.push(k.name)
                colNums.push(i)
            }

            return {
                name: k.name,
                enabled: enabled,
            }
        }))
        setDisplayCols(displayCols)

        let filteredAttributes = _.filter(category[selectedCategory].data.attributes, (k) => {
            return !disabled.includes(k.name);
        })


        let filteredData = _.map(category[selectedCategory].data.values, (row) => {
            _.map(row, (val, i) => {
                if (colNums.includes(i)) {
                    row = row.splice(i, 1);
                }
            })
            return row
        })
        // console.log(colNums)
        console.log(filteredAttributes)
    }

    if (category) {
        const [selectedCategory, setCategory] = useState(Object.keys(category)[0]);
        const [filteredCategory, setFilteredCategory] = useState(category);
        const subCats = Object.keys(category);
        subCats.sort();

        const [displayCols, setDisplayCols] = useState(_.map(category[selectedCategory].data.attributes, (k => {
            return {
                name: k.name,
                enabled: true,
            }
        })));

        return <div>
            <div style={{display: "flex", marginBottom: 20}}>
                <select defaultValue={selectedCategory} onChange={(e) => setCategory(e.target.value)}
                        className={"form-control"} style={{marginRight: 10}}>
                    {
                        _.map(subCats, ((k, i) => {
                            return <option key={i}>{k}</option>
                        }))
                    }
                </select>

                <a href={category[selectedCategory].dataLink} className={`btn btn-primary`}>
                    Download
                </a>
                &nbsp;&nbsp;
                <Button id={`${selectedCategory}`} onClick={() => setShowCol(!showCol)}
                        className={`btn btn-primary button-dropdown`}>
                    Columns ▾
                </Button>
            </div>
            {
                showCol &&
                <div className={'col-select-card-wrapper'}>
                    <Card className={'col-select-card'}>
                        <Card.Body>
                            <Card.Title>Columns</Card.Title>
                            <Card.Text>
                                <Form>
                                    <Form.Group>
                                        {
                                            _.map(displayCols, ((k) => {
                                                return <Form.Check
                                                    onChange={(e: any) => handleColToggle(e, k.name, displayCols, setDisplayCols, selectedCategory)}
                                                    type="checkbox"
                                                    defaultChecked={k.enabled}
                                                    label={k.name}/>
                                            }))
                                        }
                                    </Form.Group>
                                </Form>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </div>
            }
            <AtlasDataTable subcategoryData={filteredCategory[selectedCategory]}/>
        </div>

    } else {
        return <div>No data corresponding to category.</div>
    }
}
