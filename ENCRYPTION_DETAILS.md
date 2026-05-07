# 🔐 Encryption & Security Details | تفاصيل التشفير والأمان

## English
This application implements high-level security standards to protect user data:
- **Message Encryption (E2EE)**: We use **RSA-2048 Asymmetric Encryption**. Messages are encrypted on the sender's side using the recipient's public key and can only be decrypted by the recipient's private key.
- **Password Hashing**: Passwords are never stored in plain text. We use **Bcrypt** with **10 salt rounds** to ensure password safety.

## بالعربية
يطبق هذا التطبيق معايير أمان عالية لحماية بيانات المستخدم:
- **تشفير الرسائل (E2EE)**: نستخدم **تشفير RSA-2048 غير المتماثل**. يتم تشفير الرسائل لدى المرسل باستخدام المفتاح العام للمستلم، ولا يمكن فك تشفيرها إلا بواسطة المفتاح الخاص للمستلم.
- **تشفير كلمات المرور**: لا يتم تخزين كلمات المرور كنص متاح. نستخدم خوارزمية **Bcrypt** مع **10 دورات Salt** لضمان سلامة كلمات المرور.
