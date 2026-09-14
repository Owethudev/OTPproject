const form = document.querySelector('#otp-form');
const emailInput = document.querySelector('#email');
const sendButton = document.querySelector('#send-button');
const resendButton = document.querySelector('#resend-button');
const verifyForm = document.querySelector('#verify-form');
const otpInput = document.querySelector('#otp');
const verifyButton = document.querySelector('#verify-button');
const message = document.querySelector('#message');

async function requestOtp() {
  const email = emailInput.value.trim();

  if (!email) {
    message.textContent = 'Enter an email address first.';
    message.className = 'message error';
    emailInput.focus();
    return;
  }

  sendButton.disabled = true;
  resendButton.disabled = true;
  message.textContent = 'Sending OTP request...';
  message.className = 'message';

  try {
    const response = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'The OTP request could not be sent.');
    }

    message.textContent = result.message;
    message.className = 'message';
  } catch (error) {
    message.textContent = error.message || 'Unable to contact the OTP service.';
    message.className = 'message error';
  } finally {
    sendButton.disabled = false;
    resendButton.disabled = false;
  }
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    requestOtp();
  });

  resendButton.addEventListener('click', requestOtp);
}

async function verifyOtp() {
  const email = emailInput.value.trim();
  const otp = otpInput.value.trim();

  if (!email || !otp) {
    message.textContent = 'Enter an email address and a 6-digit OTP.';
    message.className = 'message error';
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    message.textContent = 'OTP must be exactly 6 digits.';
    message.className = 'message error';
    otpInput.focus();
    return;
  }

  verifyButton.disabled = true;
  message.textContent = 'Checking OTP...';
  message.className = 'message';

  try {
    const response = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, otp })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'The OTP could not be verified.');
    }

    message.textContent = result.message;
    message.className = 'message';
  } catch (error) {
    message.textContent = error.message || 'Unable to contact the OTP service.';
    message.className = 'message error';
  } finally {
    verifyButton.disabled = false;
  }
}

if (verifyForm) {
  verifyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    verifyOtp();
  });
}
