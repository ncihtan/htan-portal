import CBioPortal from './cBioPortal';
import Minerva from './Minerva';
import Mcmicro from './Mcmicro';
import GoogleBigQuery from './GoogleBigQuery';
import CelloType from './CelloType';
import CellxGene from './CellxGene';
import CytoCommunity from './CytoCommunity';
import UCSCXena from './UCSCXena';
import CalicoST from './CalicoST';
import MIMCyCIF from './MIMCyCIF';
import ISCALE from './iSCALE';

export const ToolDetails: { [toolID: string]: JSX.Element } = {
    HTA8_T0: <CBioPortal />,
    HTA7_T4: <Minerva />,
    HTA7_T2: <Mcmicro />,
    HTAX_T0: <GoogleBigQuery />,
    HTAX_T1: <CellxGene />,
    HTAX_T2: <UCSCXena />,
    HTA4_T0: <CytoCommunity />,
    HTA4_T1: <CelloType />,
    HTA12_T0: <CalicoST />,
    HTA12_T1: <ISCALE />,
    HTA9_T0: <MIMCyCIF />,
};
