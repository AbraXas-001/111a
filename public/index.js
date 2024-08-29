async function generatePairingCode() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    if (!phoneNumber) {
        document.getElementById('output').textContent = "Please enter a WhatsApp number";
        return;
    }

    const response = await fetch('/generate-pairing-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
    });

    const result = await response.json();
    if (result.success) {
        document.getElementById('output').textContent = `Session ID sent to WhatsApp: ${result.sessionId}`;
    } else {
        document.getElementById('output').textContent = "Error generating pairing code.";
    }
}

