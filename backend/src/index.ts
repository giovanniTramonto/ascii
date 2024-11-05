import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import nReadlines from 'n-readlines'
import WebSocket from 'ws';

enum PrintStatus {
  Processing = 'processing',
  Complete = 'complete'
}
interface PrintMessage {
  line: string,
  progress: number,
  status: PrintStatus
}

const port = process.env.PORT;
const wssPort : number = Number(process.env.WSS_PORT);
const wss = new WebSocket.Server({ port: wssPort });
const app = express();
const printer = (() => {
  const lines : string[] = [];
  let interval : number = 0;
  let initTime : number = 0;
  return {
    set: (ms : number = 0) : void => {
      initTime = Date.now()
      interval = ms
      lines.length = 0
    },
    addLine(line : string) {
      lines.push(line)
    },
    print: async () : Promise<void> => {
      let index = 0
      for (const line of lines) {
        index++;
        const progress : number = Math.round(100 / lines.length * index);
        const message : PrintMessage = {
          line,
          progress,
          status: progress === 100 ? PrintStatus.Complete : PrintStatus.Processing
        }
        clientSocket.send(JSON.stringify(message));
        const time : number = await new Promise(resolve => {
          const t : number = initTime
          setTimeout(() => resolve(t), interval)
        });
        if(time !== initTime) {
          break
        }
      }
    }
  };
})();
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
      const interval : number = body.interval
      const uploadFile : any = files.file;
      if (uploadFile.mimetype === 'text/plain') {
        const nLines = new nReadlines(uploadFile.tempFilePath);
        if (nLines) {
          printer.set(interval);
          let line;
          while (line = nLines.next()) {
            printer.addLine(line.toString('ascii'));
          }
          printer.print() // do not await async
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
  clientSocket = ws
  ws.on('error', console.error);
  console.log(`Client socket connected on port ${wssPort}`)
});
