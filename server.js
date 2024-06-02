require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.use(express.json());

app.get('/create-payment', async (req, res) => {
    const url = 'https://api.hit-pay.com/v1/payment-requests';
    const data = {
        amount: "0.50",
        currency: "sgd",
        payment_methods: ["paynow_online"],
        generate_qr: true
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'X-BUSINESS-API-KEY': process.env.API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log('API response:', response.data);
        // Check if QR code data is present in the response
        if (response.data && response.data.qr_code_data) {
            // Extract QR code and other necessary details from the response
            const qrCodeData = {
                qrCode: response.data.qr_code_data.qr_code,
                qrCodeExpiry: response.data.qr_code_data.qr_code_expiry,
                id: response.data.id,
                status: response.data.status,
                url: response.data.url,
                redirectUrl: response.data.redirect_url,
                createdAt: response.data.created_at,
                updatedAt: response.data.updated_at
            };

            // Send the extracted data back to the client
            res.json(qrCodeData);
        } else {
            // Send an error if QR code data is not found
            throw new Error('QR Code data not found in the response');
        }
    } catch (error) {
        console.error('Error creating payment:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to create payment',
            message: error.response ? error.response.data.message : "Internal Server Error"
        });
    }
});

app.post('/payment-confirmation/webhook', express.json(), (req, res) => {
    // This is where you will handle the incoming webhook
    const data = req.body;
    const receivedSignature = req.headers['hitpay-signature'];

    if (validateSignature(JSON.stringify(data), receivedSignature, process.env.HITPAY_SALT)) {
        console.log('Webhook verified successfully!');
        // Process the webhook payload
        // For example, update the payment status in your database
        res.status(200).send('Webhook received and processed');
    } else {
        console.log('Webhook verification failed.');
        res.status(400).send('Invalid signature');
    }
});


const crypto = require('crypto');

function validateSignature(payload, receivedSignature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    const computedSignature = hmac.update(payload).digest('hex');
    return receivedSignature === computedSignature;
}


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

console.log(process.env.API_KEY);


app.get('/check-payment-status/:paymentId', async (req, res) => {
    const paymentId = req.params.paymentId;
    const url = `https://api.hit-pay.com/v1/payment-status/${paymentId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'X-BUSINESS-API-KEY': process.env.API_KEY,
                'Content-Type': 'application/json'
            }
        });
        res.json({status: response.data.status});
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({error: 'Failed to check payment status'});
    }
});