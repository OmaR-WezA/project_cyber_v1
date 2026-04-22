const Message = require('../models/message.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');

const sendMessage = async (req, res) => {
    try {
        const { receiverId, ciphertext: clientCiphertext } = req.body;
        const senderId = req.user.id;

        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        const newMessage = await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            ciphertext: clientCiphertext
        });

        res.status(201).json({ message: 'Message sent', data: newMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username'] },
                { model: User, as: 'receiver', attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

module.exports = { sendMessage, getMessages };
