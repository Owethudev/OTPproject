const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (request, response) => {
  response.send('OTP verification system is running.');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});