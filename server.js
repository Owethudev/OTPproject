const express = require('express');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/otp', otpRoutes);

app.get('/', (request, response) => {
  response.json({ message: 'API is running.' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});