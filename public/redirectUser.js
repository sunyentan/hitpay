function checkPaymentStatus(paymentId) {
    fetch(`/check-payment-status/${paymentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'completed') {
                console.log('Payment confirmed. Redirecting to external site...');
                window.location.href = 'https://nanast.com'; // External website URL
            } else {
                console.log('Payment not confirmed yet. Checking again...');
                setTimeout(() => checkPaymentStatus(paymentId), 5000); // Check every 5 seconds
            }
        })
        .catch(error => console.error('Error checking payment status:', error));
}
