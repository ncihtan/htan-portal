import React from 'react';
import { GetStaticProps } from 'next';
import { observer } from 'mobx-react';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getDataSchema, SchemaDataId } from '@htan/data-portal-schema';
import { FilterSearch, OptionType } from '@htan/data-portal-filter';
import { DataStandardFilterControl } from 'packages/data-portal-filter/src/components/DataStandardFilterControl';

@observer
class Biospecimen extends React.Component<DataStandardProps> {
    filterControl: DataStandardFilterControl;

    constructor(props: DataStandardProps) {
        super(props);
        this.filterControl = new DataStandardFilterControl(
            props.dataSchemaData || [],
            props.schemaDataById
        );
    }

    render() {
        const selectedOptions: OptionType[] = this.filterControl.allAttributeNames.map(
            (attribute: string) => ({
                label: attribute,
                value: attribute,
                group: attribute,
                isSelected: this.filterControl.selectedAttributes.includes(
                    attribute
                ),
            })
        );

        return (
            <DataStandard
                {...this.props}
                getSelectedFilters={this.filterControl.getSelectedFilters}
                onFilterChange={this.filterControl.handleFilterChange}
                onClearFilter={this.filterControl.clearFilter}
                onClearAllFilters={this.filterControl.clearAllFilters}
            >
                <div className="standards-content">
                    <h1>HTAN Biospecimen Data</h1>
                    <p>
                        The HTAN biospecimen data model is designed to capture
                        essential biospecimen data elements, including:
                    </p>
                    <ul>
                        <li>
                            Acquisition method, e.g. autopsy, biopsy, fine
                            needle aspirate, etc.
                        </li>
                        <li>
                            Topography Code, indicating site within the body,
                            e.g. based on ICD-O-3.
                        </li>
                        <li>
                            Collection information e.g. time, duration of
                            ischemia, temperature, etc.
                        </li>
                        <li>
                            Processing of parent biospecimen information e.g.
                            fresh, frozen, etc.
                        </li>
                        <li>
                            Biospecimen and derivative clinical metadata i.e.
                            Histologic Morphology Code, e.g. based on ICD-O-3.
                        </li>
                        <li>
                            Coordinates for derivative biospecimen from their
                            parent biospecimen.
                        </li>
                        <li>
                            Processing of derivative biospecimen for downstream
                            analysis e.g. dissociation, sectioning, analyte
                            isolation, etc.
                        </li>
                    </ul>
                    <p>
                        HTAN biospecimen metadata leverages existing common data
                        elements from four sources:
                    </p>
                    <ul>
                        <li>
                            <a href="https://gdc.cancer.gov/about-data/data-harmonization-and-generation/biospecimen-data-harmonization">
                                Genomic Data Commons (GDC)
                            </a>
                        </li>
                        <li>
                            <a href="https://mcl.nci.nih.gov/resources/standards/mcl-cdes">
                                Consortium for Molecular and Cellular
                                Characterization of Screen-Detected Lesions
                                (MCL)
                            </a>
                        </li>
                        <li>
                            <a href="https://data.humancellatlas.org/metadata">
                                Human Cell Atlas (HCA)
                            </a>
                        </li>
                        <li>
                            <a href="https://cdebrowser.nci.nih.gov/cdebrowserClient/cdeBrowser.html#/search">
                                NCI standards described in the caDSR system
                            </a>
                        </li>
                    </ul>
                </div>
                <FilterSearch
                    selectOptions={[
                        { label: 'Attributes', options: selectedOptions },
                    ]}
                    setFilter={this.filterControl.handleFilterChange}
                />
            </DataStandard>
        );
    }
}

export const getStaticProps: GetStaticProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Biospecimen,
    ]);

    return { props: { dataSchemaData, schemaDataById } };
};

export default Biospecimen;
