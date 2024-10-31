import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

const PORT = process.env.PORT || 3000;

app.route('/api')
  .get((_req, res) => {
    res.status(200).json({ message: 'Hello from the server!' });
  })
  .post((_req, res) => {
    console.log(_req.body.interval)
    console.log(_req.files)
    res.status(200)
  });

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});
