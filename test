const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/users_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String }));

// ⚠️ SAST ISSUE: NoSQL Injection vulnerability ⚠️
app.get('/user', async (req, res) => {
    const username = req.query.username; // User-controlled input

    // 🚨 UNSAFE: Directly passing user input into MongoDB query 🚨
    const user = await User.findOne({ username: username });

    if (!user) {
        return res.status(404).send('User not found');
    }

    res.json(user);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
