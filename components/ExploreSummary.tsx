import React from "react";
import _ from "lodash";
import {PropNames} from "../lib/types";
import {Button} from "react-bootstrap";
import {Entity} from "../lib/helpers";

interface IExploreSummaryProps {
    filteredFiles: Entity[];
    getGroupsByPropertyFiltered: any;
    patientCount: number;
}

export const ExploreSummary: React.FunctionComponent<IExploreSummaryProps> = props => {
    return (
        <>
            <div className={'summary'}>
                <div>
                    <strong>Summary:</strong>
                </div>

                <div>{props.filteredFiles.length} Files</div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.AtlasName
                                ]
                        ).length
                    }{' '}
                    Atlases
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.TissueorOrganofOrigin
                                ]
                        ).length
                    }{' '}
                    Organs
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.PrimaryDiagnosis
                                ]
                        ).length
                    }{' '}
                    Cancer Types
                </div>

                <div>{props.patientCount} Cases</div>

                <div>
                    {
                        _(props.filteredFiles)
                            .map((f) => f.HTANParentBiospecimenID)
                            .uniq()
                            .value().length
                    }{' '}
                    Biospecimens
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.Component
                                ]
                        ).length
                    }{' '}
                    Assays
                </div>

            </div>
        </>
    );
}