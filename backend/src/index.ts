import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import nReadlines from 'n-readlines'
import WebSocket from 'ws';

interface printMessage {
  progress: number,
  line: string
}

const port = process.env.PORT;
const wssPort : number = Number(process.env.WSS_PORT);
const wss = new WebSocket.Server({ port: wssPort });
const app = express();
let clientSocket : WebSocket

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));

app.route('/api')
  .get((_req, res) => {
    res.status(200).send('Hello from the server!');
  })
  .post((_req, res) => {
    const { body, files } = _req;
    if (body.interval && files?.file) {
      const uploadFile : any = files.file;
      if (uploadFile.mimetype === 'text/plain') {
        const nLines = new nReadlines(uploadFile.tempFilePath);
        if (nLines) {
          const lines : string[] = [];
          let line;
          while (line = nLines.next()) {
            lines.push(line.toString('ascii'))
          }
          // do not wait for async function
          sendLinesToClient(lines, body.interval)
          res.status(200);
        } else {
          res.status(400).send('NOTHING TO PRINT');
        }
      } else {
        res.status(400).send('NOT A PLAIN TEXT FILE');
      }
    }
  });

app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});

wss.on('connection', (ws: WebSocket) => {
  clientSocket = ws
  ws.on('error', console.error);
  console.log(`Client socket connected on port ${wssPort}`)
});

async function sendLinesToClient(lines: string[], interval: number = 0) {
  let index = 0
  for (const line of lines) {
    index++;
    const message : printMessage = {
      progress: Math.round(100 / lines.length * index),
      line
    }
    clientSocket.send(JSON.stringify(message));
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}