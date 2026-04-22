# QR Code Connection

The QR Code Connection feature allows you to quickly connect your mobile device (omni-code-go) to your desktop omni-code instance by scanning a QR code, eliminating the need to manually type URLs and API keys.

## How It Works

1. **Desktop generates QR code**: When the remote server is running in omni-code-v2, a QR code containing the connection URL and API key can be displayed
2. **Mobile scans QR code**: The omni-code-go mobile app scans the QR code to automatically extract the connection credentials
3. **Auto-connect**: The mobile app automatically connects to the desktop server using the scanned credentials

## Setup

### Desktop (omni-code-v2)

1. Open Settings and navigate to the **Remote** tab
2. Enable **Remote Access** and configure your ngrok auth token
3. Click **Start Server** to start the remote server
4. Once running, click **Show QR Code** to display the connection QR code

### Mobile (omni-code-go)

1. Open the app and tap **Scan QR Code** on the connection screen
2. Point your camera at the QR code displayed on your desktop
3. The app will automatically extract the URL and API key, then connect

## QR Code Data Format

The QR code encodes a JSON object with the following structure:

```json
{
  "url": "https://xxx.ngrok.io",
  "key": "<YOUR_API_KEY_HERE>",
  "name": "Omni Code Desktop"
}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Keep QR codes private**: The QR code contains your API key. Anyone who scans it can connect to your server.
2. **QR codes are temporary**: When you regenerate your API key, the old QR code becomes invalid.
3. **Use HTTPS**: The remote server uses ngrok's HTTPS tunnels for encrypted communication.
4. **Rate limiting**: The server has built-in rate limiting (100 requests per 15 minutes by default).

## Troubleshooting

### QR Code Not Generating

- Ensure the remote server is running (check the Server Status section)
- Verify that both URL and API key are available
- Check the browser console for error messages

### Mobile Can't Scan QR Code

- Ensure camera permissions are granted to the app
- Make sure the QR code is clearly visible and not blurry
- Try adjusting the distance between the phone and the screen
- Ensure sufficient lighting

### Connection Fails After Scanning

- Verify that the desktop server is still running
- Check that your ngrok tunnel is active
- Ensure your mobile device has internet connectivity
- Try regenerating the API key and scanning the new QR code

## Platform-Specific Setup

### iOS

If building for iOS, add the following to your `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for connecting to the desktop server</string>
```

### Android

No additional configuration is required. The mobile_scanner package handles camera permissions automatically.

## Development

### Adding QR Code Dependencies

**Desktop (omni-code-v2)**:
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

**Mobile (omni-code-go)**:
Add to `pubspec.yaml`:
```yaml
dependencies:
  mobile_scanner: ^3.5.5
```

Then run:
```bash
flutter pub get
```

## Implementation Details

### Desktop IPC Handler

The desktop app uses an IPC handler (`remote:generate-qr`) that:
1. Gets the current remote server status
2. Generates a QR code as a data URL using the `qrcode` library
3. Returns the data URL for display in the UI

### Mobile QR Scanner

The mobile app uses the `mobile_scanner` package which:
1. Opens the camera for QR code detection
2. Parses the JSON data from the QR code
3. Returns the URL and API key to the connection screen
4. Auto-fills the connection form and initiates connection

## Testing

To test the end-to-end flow:

1. Start omni-code-v2 desktop app with remote access enabled
2. Navigate to Settings > Remote and start the server
3. Click "Show QR Code" to display the connection QR
4. Open omni-code-go on your mobile device
5. Tap "Scan QR Code" and point at the desktop screen
6. Verify that the connection form is auto-filled
7. Confirm successful connection to the desktop server
