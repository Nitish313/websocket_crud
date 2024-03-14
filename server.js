const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/my_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define MongoDB schema and model
const itemSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model('Item', itemSchema);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('A client connected');

  // Retrieve items from MongoDB and send to client

  async function myItems() {
    const items= await Item.find({});
    items.forEach(function(item){
      socket.emit('initialData', items);
    });
  }
  myItems();

  // Handle 'addItem' event
  socket.on('addItem', (itemName) => {
    const newItem = new Item({ name: itemName });
    newItem.save();
    io.emit('itemAdded', newItem);
  });

  // Handle 'deleteItem' event
  socket.on('deleteItem', (itemId) => {
    Item.findByIdAndDelete(itemId, (err, item) => {
      if (err) {
        console.error(err);
      } else {
        io.emit('itemDeleted', itemId);
      }
    });
  });

  // Handle 'updateItem' event
  socket.on('updateItem', (updatedItem) => {
    Item.findByIdAndUpdate(updatedItem._id, updatedItem, (err, item) => {
      if (err) {
        console.error(err);
      } else {
        io.emit('itemUpdated', updatedItem);
      }
    });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
