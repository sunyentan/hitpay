function requestPayment() {
    document.getElementById('payNowButton').style.display = 'none';

    fetch('/create-payment')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const qrCodeContainer = document.getElementById('qrCode');
            qrCodeContainer.innerHTML = ''; // Clear previous contents
            if (data.qrCode) {
                QRCode.toDataURL(data.qrCode, { errorCorrectionLevel: 'H', type: 'image/png' })
                    .then(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        qrCodeContainer.appendChild(img);
                    })
                    .catch(err => {
                        console.error('Error generating QR code:', err);
                        qrCodeContainer.textContent = 'Error generating QR code.';
                    });
            } else {
                throw new Error('QR Code data is missing');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('qrCode').textContent = 'Error fetching payment QR code.';
        });
}


// Add this line inside your requestPayment function after QR code is displayed
// Assuming you store paymentId from the server's response
checkPaymentStatus(data.paymentId);