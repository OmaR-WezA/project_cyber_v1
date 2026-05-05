# Project Report: Secure Messaging Application

## 1. Project Overview
This application is a secure messaging platform designed to demonstrate modern cryptographic practices. It allows users to register, log in, and exchange messages that are fully encrypted at rest and during transit.

## 2. Technical Implementation

### A. Authentication & Password Hashing
- **Library**: `bcrypt`
- **Method**: Every user password is encrypted before being stored in the MySQL database. We use a **salt factor of 10** to ensure high resistance against brute-force attacks.
- **Verification**: During login, the system uses `bcrypt.compare()` to check the provided password against the stored hash.

### B. Asymmetric Encryption (RSA)
- **Library**: `node-forge`
- **Method**: We implemented **Option B: Asymmetric RSA Encryption**.
- **Key Generation**: 
  - Each user has a **Private Key** (kept in the database, uniquely owned).
  - Each user has a **Public Key** (shared with other users).
- **Process**:
  - **Encryption**: When a message is sent, the client fetches the receiver's Public Key and encrypts the plaintext using the RSA-OAEP padding scheme.
  - **Storage**: Only the **Ciphertext** (base64 encoded) is stored in the database.
  - **Decryption**: When the receiver logs in, the client fetches the ciphertext and uses the receiver's Private Key to reveal the original message.

## 3. How to Use & Demonstrate

### Installation & Setup
1. **Dependencies**: Run `npm install`.
2. **Database Setup**: Ensure MySQL is running, then run `npm run db:setup`.
3. **Database Seeding (Optional)**: Run `npm run seed` to create test users (Alice and Bob).
4. **Start Server**: Run `npm start`.

### Demonstration Flow
1. **Login**: Use **Test1** (password: `12345678`) or register a new student.
2. **Select Contact**: Choose a contact from the sidebar.
3. **Send Message**: Type your message and click Send.
4. **View Encryption**: 
   - Each message bubble has a **"View Encryption"** button.
   - Click it to see the raw RSA-encrypted data stored in the database.
   - Click **"View Decrypted"** to see the readable message again.

### Features
- **Session Persistence**: Stays logged in on refresh.
- **Two-way Chat**: Real-time feel with clear left/right alignment (WhatsApp Style).
- **End-to-End Proof**: The "View Encryption" toggle proves that no plaintext ever leaves the sender's device.
