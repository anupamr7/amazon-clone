import React, { useState } from 'react'; // <-- Imported useState
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
    hidePostalCode: true,
};

const StripeForm = ({ clientSecret, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    
    // 👇 NEW STATE: Tracks if the payment is currently processing
    const [processing, setProcessing] = useState(false); 
    
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || processing) {
            // Disable submission if Stripe isn't loaded or if already processing
            return;
        }

        const cardElement = elements.getElement(CardElement);
        
        // 1. Disable the button and show processing status
        setProcessing(true); 

        // 2. Confirm the card payment
        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        // 3. Handle results and re-enable button on error
        if (error) {
            alert(`Payment Failed: ${error.message}`);
            console.error(error);
            setProcessing(false); // Re-enable button on failure
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment succeeded! Call the final order placement logic
            onPaymentSuccess();
        }
        
        // Note: setProcessing(false) is called inside the error block, 
        // and intentionally not called inside onPaymentSuccess 
        // since the user is redirected away from the page immediately.
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px' }}>
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            
            {/* 👇 BUTTON IS DISABLED WHILE 'processing' IS TRUE */}
            <button 
                type="submit" 
                disabled={!stripe || processing} 
                style={{ 
                    backgroundColor: processing ? '#ccc' : '#007185', // Change color while processing
                    color: 'white', 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '3px', 
                    cursor: processing ? 'default' : 'pointer' 
                }}
            >
                {processing ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
};

export default StripeForm;