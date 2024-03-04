import _ from 'lodash';
import React from 'react';
import { Table } from 'react-bootstrap';

interface IDataAvailabilityTableProps {}

export const DataAvailabilityTable: React.FunctionComponent<IDataAvailabilityTableProps> = (
    props
) => {
    const table = (
        <Table bordered hover responsive style={{ width: '40%' }}>
            <thead>
                <tr>
                    <th>Files</th>
                    <th>
                        <a href="/data-access">CDS/SB-CGC (dbGaP 🔒)</a>
                    </th>
                    <th>
                        <a href="/data-access">CDS/SB-CGC (Open Access)</a>
                    </th>
                    <th>
                        <a href="/data-access">Coming Soon</a>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>scRNASeqLevel3</td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">
                            10
                        </a>
                    </td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">0</a>
                    </td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">0</a>
                    </td>
                </tr>
                <tr>
                    <td>scRNASeqLevel4</td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">
                            30
                        </a>
                    </td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">0</a>
                    </td>
                    <td>
                        <a href="/htapp_mbc_klughammer_2023?tab=scrna-seq">0</a>
                    </td>
                </tr>
            </tbody>
        </Table>
    );
    return table;
};

export default DataAvailabilityTable;
