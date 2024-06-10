import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';

import { CmsData } from '../types';
import DataSchema from './DataSchema';
import Footer from './Footer';
import { HtanNavbar } from './HtanNavbar';
import { DataSchemaData } from '@htan/data-portal-schema';
import { SelectedFilter } from '@htan/data-portal-filter';

export interface DataStandardProps {
    title: string;
    data: CmsData[];
    dataSchemaData?: DataSchemaData[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    getSelectedFilters?: () => SelectedFilter[];
    onFilterChange?: (filters: SelectedFilter[]) => void;
    onClearFilter?: (filterValue: string) => void;
    onClearAllFilters?: () => void;
}

const DataStandard: React.FunctionComponent<DataStandardProps> = (props) => {
    const handleFilterChange = (selectedFilters: SelectedFilter[]) => {
        if (props.onFilterChange) {
            props.onFilterChange(selectedFilters);
        }
    };

    const handleClearFilter = (filterValue: string) => {
        if (props.onClearFilter) {
            props.onClearFilter(filterValue);
        }
    };

    const handleClearAllFilters = () => {
        if (props.onClearAllFilters) {
            props.onClearAllFilters();
        }
    };

    const selectedFilters = props.getSelectedFilters
        ? props.getSelectedFilters()
        : [];

    const isUnwantedAttribute = (attribute: string) => {
        return (
            attribute === 'Bulk DNA Level 1' ||
            attribute === 'Bulk DNA Level 2' ||
            attribute === 'Bulk DNA Level 3' ||
            attribute === 'Imaging Level 3'
        );
    };

    const filteredSchemaDataById =
        selectedFilters.length > 0
            ? Object.fromEntries(
                  Object.entries(props.schemaDataById || {}).filter(
                      ([key, value]) => {
                          const attribute = value.attribute;
                          const isMatching = selectedFilters.some((filter) => {
                              const modifiedValue =
                                  'bts:' + filter.value.replace(/\s+/g, '');
                              return modifiedValue === key;
                          });
                          return !isUnwantedAttribute(attribute) && isMatching;
                      }
                  )
              )
            : Object.fromEntries(
                  Object.entries(props.schemaDataById || {}).filter(
                      ([key, value]) => {
                          const attribute = value.attribute;
                          return props.dataSchemaData?.some(
                              (data) => data.attribute === attribute
                          );
                      }
                  )
              );
    return (
        <>
            <HtanNavbar />
            <Container>
                <Row style={{ marginBottom: 10 }}>
                    <Col>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        &nbsp;
                        <Link href="/standards">Back to Data Standards</Link>
                    </Col>
                </Row>
                <Row>
                    <Col>{props.children}</Col>
                </Row>
                <Row>
                    <Col>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    marginTop: '10px',
                                }}
                            >
                                {selectedFilters.length === 0
                                    ? null
                                    : selectedFilters.map((filter, index) => (
                                          <div
                                              key={index}
                                              style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  marginRight: '10px',
                                                  background: '#E8E8E8',
                                                  padding: '5px',
                                              }}
                                          >
                                              <span>{filter.value}</span>
                                              <button
                                                  onClick={() =>
                                                      handleClearFilter(
                                                          filter.value
                                                      )
                                                  }
                                                  style={{
                                                      background: 'none',
                                                      border: 'none',
                                                      marginLeft: '5px',
                                                  }}
                                              >
                                                  <FontAwesomeIcon
                                                      icon={faTimes}
                                                  />
                                              </button>
                                          </div>
                                      ))}
                            </div>
                            {selectedFilters.length > 0 && (
                                <button
                                    onClick={handleClearAllFilters}
                                    style={{
                                        marginTop: '10px',
                                        border: 'none',
                                        padding: '10px',
                                    }}
                                >
                                    <span style={{ marginRight: '8px' }}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </Col>
                </Row>
                {filteredSchemaDataById && (
                    <Row>
                        <DataSchema
                            schemaData={Object.values(filteredSchemaDataById)}
                            dataSchemaMap={
                                props.schemaDataById ? props.schemaDataById : {}
                            }
                        />
                    </Row>
                )}
            </Container>
            <Footer />
        </>
    );
};

export default DataStandard;
