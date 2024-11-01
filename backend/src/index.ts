import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import { readFile } from 'node:fs/promises';
import WebSocket from 'ws';

interface printObject {
  interval: number,
  content: string | null,
  lines: string[]
}

const port = process.env.PORT;
const wssPort : number = Number(process.env.WSS_PORT);
const wss = new WebSocket.Server({ port: wssPort });
const app = express();
const printData : printObject = {
  interval: 0,
  content: null,
  lines: []
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));


app.route('/api')
  .get((_req, res) => {
    res.status(200).json({ message: 'Hello from the server!' });
  })
  .post(async (_req, res) : Promise<void> => {
    const { body, files } = _req;
    if (body.interval) {
      printData.interval = body.interval;
    }
    if (files?.file) {
      const uploadFile : any = files.file;
      if (uploadFile.mimetype === 'text/plain') {
        const content = await readFile(uploadFile.tempFilePath, 'utf8');
        if (content) {
          printData.content = content
          printData.lines = content.split(/\r?\n/)
          res.status(200).json(printData);
        }
      } else {
        res.status(400).json({
          message: 'NOT A PLAIN TEXT FILE'
        });
      }
    }
    res.status(200);
  });

app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.send('Hello from the Server!');
});
