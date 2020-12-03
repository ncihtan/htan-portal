import Cors from 'micro-cors';

const cors = Cors({
    allowMethods: ['GET', 'HEAD', 'POST'],
});

function handler(req: any, res: any) {
    // TODO proxy requests to synapse if needed

    res.json({ message: 'Hello world' });
}

export default cors(handler);
