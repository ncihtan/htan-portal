import Cors from 'micro-cors'

const cors = Cors({
  allowMethods: ['GET', 'HEAD', 'POST'],
});

function handler(req, res) {
  //proxy requests to synapse

  res.json({ message: 'Hello world' })
}

export default cors(handler)
