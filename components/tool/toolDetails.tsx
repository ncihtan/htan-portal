import CBioPortal from './cBioPortal';
import Minerva from './Minerva';
import Mcmicro from './Mcmicro';
import GoogleBigQuery from './GoogleBigQuery';
import CellxGene from './CellxGene';
import CytoCommunity from './CytoCommunity';
import UCSCXena from './CytoCommunity';

export const ToolDetails: { [toolID: string]: JSX.Element } = {
    HTA8_T0: <CBioPortal />,
    HTA7_T4: <Minerva />,
    HTA7_T2: <Mcmicro />,
    HTAX_T0: <GoogleBigQuery />,
    HTAX_T1: <CellxGene />,
    HTAX_T2: <UCSCXena />,
    HTA4_T0: <CytoCommunity />,
};
