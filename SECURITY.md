# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email the maintainers directly at: Bannister.grayson@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 48 hours
- Investigate and provide updates within 5 business days
- Coordinate a fix and disclosure timeline with you
- Credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices for Users

### API Keys & Credentials
- Never commit API keys, passwords, or tokens to git
- Use environment variables or secure credential stores
- Rotate API keys regularly
- Use different keys for development and production

### Running Omni Code
- Keep your API keys secure and private
- Use ngrok's authenticated tunnels for remote access
- Enable rate limiting on the remote server
- Don't share QR codes containing connection credentials

### Development
- Run `gitleaks detect --source .` before committing
- Use pre-commit hooks to prevent secret commits
- Review your code for accidental credential inclusion

## Known Security Considerations

### Remote Server Access
- The remote server feature uses ngrok to expose local endpoints
- API keys are generated locally and should be kept private
- QR codes contain credentials - treat them as sensitive
- The server has built-in rate limiting to prevent abuse

### Third-Party Services
- Omni Code integrates with various AI providers
- API keys for these services are stored locally
- No data is sent to our servers - all processing happens locally or with your chosen providers
