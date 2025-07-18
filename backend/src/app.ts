
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import routes from './routes/index.js';

export default function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'service ok' });
  });
  app.use('/api', routes);
  return app;
}
