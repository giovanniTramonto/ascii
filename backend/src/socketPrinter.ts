enum PrintStatus {
  Processing = 'processing',
  Complete = 'complete'
}
interface PrintMessage {
  line: string,
  progress: number,
  status: PrintStatus
}

export default (() => {
  const lines : string[] = [];
  let interval : number;
  let initTime : number;
  let maxLength : number;
  let clientSocket : WebSocket | null;
  // If line is not filled with white-space until end of line,
  // the width of centered output can vary while printing. 
  // To avoid this effect, fill up with space char.
  function fillChars(line : string) : string {
    const { length } = line
    if (maxLength > length) {
      for (let i = length; i < maxLength; i++) {
        line += ' ';
      }
    }
    return line
  }
  return {
    set(wss: any, socketProtocol : string, ms : number = 0) : void {
      initTime = Date.now()
      interval = ms
      lines.length = 0
      maxLength = 0
      clientSocket = null

      for (const [client, _] of wss.clients.entries()) {
        if (socketProtocol === client.protocol) {
          clientSocket = client
        }
      }
    },
    addLine(line : string) : void {
      const { length } = line
      if (length > maxLength) {
        maxLength = length
      }
      lines.push(line)
    },
    print: async () : Promise<void> => {
      if (!clientSocket) {
        console.warn('NO SOCKET')
        return
      }
      let index = 0;
      for (const line of lines) {
        index++;
        const progress : number = Math.round(100 / lines.length * index);
        const message : PrintMessage = {
          line: fillChars(line),
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
