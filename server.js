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

app.post('/payment-confirmation/webhook', (req, res) => {
    const secret = process.env.HITPAY_SECRET; // Your secret key from HitPay dashboard
    const data = req.body;

    // Verify the HMAC to ensure the webhook is from HitPay
    const generatedHmac = generateSignature(data, secret);

    // HitPay sends an HMAC header to verify the source
    const receivedHmac = req.headers['hmac'];

    if (receivedHmac === generatedHmac) {
        console.log('Webhook verified successfully');

        // Handle confirmed payment status
        if (data.status === 'completed') {
            // Mark your order as paid in your database or perform other business logic
            console.log('Payment confirmed for payment_id:', data.payment_id);

            // Respond to HitPay to acknowledge receipt of the webhook
            res.status(200).send('Webhook received and processed');
        } else {
            console.log('Payment not confirmed:', data.status);
            res.status(200).send('Webhook received but payment not confirmed');
        }
    } else {
        console.log('Webhook verification failed');
        res.status(400).send('Invalid webhook signature');
    }
});

function generateSignature(data, secret) {
    const sortedKeys = Object.keys(data).sort();
    const payload = sortedKeys.filter(key => key !== 'hmac').map(key => `${key}${data[key]}`).join('');
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payload).digest('hex');
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