import path from 'path';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import v1Router from './routes/v1';
import { setupSwagger } from './swagger/setup';

const app = express();

app.use(express.json());
setupSwagger(app);
app.use('/api/v1', v1Router);
app.use(express.static(path.join(__dirname, '../public')));
app.use(errorHandler);

export default app;
