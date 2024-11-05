import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import nReadlines from 'n-readlines'
import WebSocket from 'ws';
import socketPrinter from './socketPrinter'

const port = process.env.PORT;
const wssPort : number = Number(process.env.WSS_PORT);
const wss = new WebSocket.Server({ port: wssPort });
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));

app.route('/api')
  .get((_req, res) => {
    res.status(200).send('Hello from the server!');
  })
  .post((_req, res) => {
    const { body, files } = _req;
    if (files?.file) {
      const uploadFile : any = files.file;
      if (uploadFile.mimetype === 'text/plain') {
        const nLines = new nReadlines(uploadFile.tempFilePath);
        if (nLines) {
          socketPrinter.set(wss, body.socketProtocol, body.interval);
          let line;
          while (line = nLines.next()) {
            socketPrinter.addLine(line.toString('ascii'));
          }
          socketPrinter.print() // do not await async
          res.status(200).send('UPLOAD COMPLETE');
        } else {
          res.status(400).send('NOTHING TO PRINT');
        }
      } else {
        res.status(400).send('NOT A PLAIN TEXT FILE');
      }
    } else {
      res.status(400).send('REQUEST INCOMPLETE');
    }
  });

app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('error', console.error);
  console.log(`Client socket ${ws.protocol} connected on port ${wssPort}`)
});
