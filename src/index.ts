import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import hubspotRoutes from './routes/hubspot';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/hubspot', hubspotRoutes);

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
