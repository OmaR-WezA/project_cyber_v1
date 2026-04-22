# Secure Messaging Web Application (University Project)

## Project Overview
This project is a secure, end-to-end encrypted messaging web application built for the **Security Two** course. It demonstrates how cryptographic concepts like **Hash Functions** and **Asymmetric Encryption** are used to protect user data.

## 🚀 Built With
- **Backend**: Node.js & Express
- **Database**: MySQL (using Sequelize ORM)
- **Security**:
  - `bcrypt`: For secure password hashing.
  - `node-forge`: For RSA-2048 Asymmetric Encryption.
- **Frontend**: Vanilla HTML/CSS/JS (Modern Academic Interface)

## 🔐 Security Implementation

### 1. Password Hashing (Bcrypt)
Passwords are never stored in plain text. When a user registers, their password is hashed using `bcrypt` with 10 salt rounds. During login, the system compares the hashed version of the entered password with the one stored in the MySQL database.
```javascript
// Example Hashing
const password_hash = await bcrypt.hash(password, 10);
```

### 2. Message Encryption (RSA)
The system uses **Asymmetric Encryption (RSA)** via the `node-forge` library.
- **Key Generation**: Upon registration, each student receives a unique RSA-2048 Public and Private key pair.
- **Message Confidentiality**: All messages are encrypted on the **client side** using the receiver's **Public Key**.
- **Decryption**: Only the holder of the receiver's **Private Key** can decrypt and read the message.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js installed.
- MySQL Server running.

### Installation
1. **Clone/Download** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Database Configuration**:
   Create a `.env` file in the root directory and fill in your MySQL credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=secure_messaging
   JWT_SECRET=supersecretkey
   ```
4. **Create the Database**:
   Run our automated setup script:
   ```bash
   npm run db:setup
   ```
5. **Start the Portal**:
   ```bash
   npm start
   ```
   Access the application at `http://localhost:3000`.

## 📁 Project Structure
- `backend/`: Server, models (Sequelize), and API controllers.
- `frontend/`: Clean, responsive UI with academic styling.
- `backend/utils/`: Cryptographic utilities.
