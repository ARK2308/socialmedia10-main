const io = require("socket.io")();
const userModel = require('./models/user.schema');
const messageModel = require("./models/message.schema");

const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", (socket) => {
    console.log("A user connected");

    // Listen for 'join' event to update the user's socket ID
    socket.on('join', async (username) => {
        try {
            await userModel.findOneAndUpdate(
                { username },
                { socketId: socket.id }
            );
        } catch (error) {
            console.error(`Error in 'join' event: ${error.message}`);
        }
    });

    // Listen for 'sony' event to handle sending messages
    socket.on('sony', async (messageObject) => {
        try {
            const receiver = await userModel.findOne({ username: messageObject.receiver });
            if (receiver) {
                const socketId = receiver.socketId;

                await messageModel.create({
                    sender: messageObject.sender,
                    receiver: messageObject.receiver,
                    text: messageObject.message
                });

                socket.to(socketId).emit('max', messageObject);
            } else {
                console.error(`Receiver ${messageObject.receiver} not found`);
            }
        } catch (error) {
            console.error(`Error in 'sony' event: ${error.message}`);
        }
    });

    // Listen for 'openChat' event to fetch and send chat history
    socket.on('openChat', async (userObject) => {
        try {
            const { sender, receiver } = userObject;
            const messages = await messageModel.find({
                $or: [
                    { sender, receiver },
                    { sender: receiver, receiver: sender }
                ]
            });

            socket.emit('openChat', messages);
        } catch (error) {
            console.error(`Error in 'openChat' event: ${error.message}`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });

});

module.exports = socketapi;
