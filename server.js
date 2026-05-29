const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Connect to MongoDB for real-time chat data
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_chat';
mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB for real-time chat'))
    .catch(err => console.error('⚠️ MongoDB connection error. Set MONGODB_URI or run MongoDB locally!', err.message));

const baseSchemaOptions = {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
};

// MongoDB Mongoose Model for fast, real-time message delivery
const MongoPost = mongoose.model('Post', new mongoose.Schema({
    group_id: String,
    author_email: String,
    author_name: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
}, baseSchemaOptions));

const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, index: true },
    password: String,
    bio: String,
    status: { type: String, default: 'offline' }
}, baseSchemaOptions));

const Group = mongoose.model('Group', new mongoose.Schema({
    name: String,
    description: String,
    type: String,
    code: String
}, baseSchemaOptions));

const GroupMember = mongoose.model('GroupMember', new mongoose.Schema({
    groupId: { type: String, index: true },
    userEmail: { type: String, index: true }
}, baseSchemaOptions));

GroupMember.schema.index({ groupId: 1, userEmail: 1 }, { unique: true });

const Report = mongoose.model('Report', new mongoose.Schema({
    name: String,
    email: String,
    anonymous: Boolean,
    platform: String,
    type: String,
    severity: String,
    details: String,
    status: { type: String, default: 'pending' },
    trusted_contact_name: String,
    trusted_contact_email: String,
    timestamp: { type: Date, default: Date.now }
}, baseSchemaOptions));

const ReportMessage = mongoose.model('ReportMessage', new mongoose.Schema({
    reportId: { type: String, index: true },
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
}, baseSchemaOptions));


const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, 'build')));

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'anushashetty242@gmail.com', // âš ï¸ Put your Gmail address here
        pass: 'zykjokqscfekjdkc' // âš ï¸ Put your Gmail App Password here
    }
});

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// API endpoint to get all groups
app.get('/api/groups', async (req, res) => {
    try {
        const groups = await Group.find({}, 'name description type').lean();
        const response = groups.map(group => ({
            id: group._id.toString(),
            name: group.name,
            description: group.description,
            type: group.type
        }));
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get a single group's details with posts
app.get('/api/groups/:id', async (req, res) => {
    const groupId = req.params.id;
    if (!isValidObjectId(groupId)) {
        return res.status(404).send('Group not found');
    }

    try {
        const group = await Group.findById(groupId).lean();
        if (!group) {
            return res.status(404).send('Group not found');
        }

        // Fetch posts from MongoDB in real-time
        const posts = await MongoPost.find({ group_id: groupId.toString() }).sort({ timestamp: 1 }).lean();
        res.json({
            id: group._id.toString(),
            name: group.name,
            description: group.description,
            type: group.type,
            code: group.code,
            posts
        });
    } catch (err) {
        console.error('MongoDB fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch real-time messages' });
    }
});

// API endpoint to create a new group
app.post('/api/groups', async (req, res) => {
    const { name, description, type, code } = req.body;
    try {
        const group = await Group.create({ name, description, type, code: type === 'private' ? code : null });
        res.status(201).json({ id: group._id.toString(), name, description, type, code: group.code });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// API endpoint to handle user registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }
    try {
        const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists', error: 'Email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hash });

        // Send welcoming email to the new user automatically
        const welcomeMailOptions = {
            from: 'anushashetty242@gmail.com',
            to: email,
            subject: 'Welcome to CyberShield - You Are Not Alone ðŸ›¡ï¸',
            text: `Hi ${name},\n\nWelcome to CyberShield. We are so glad you found us.\n\nIf you are going through a difficult time with cyberbullying, please know that you are absolutely not alone and things can get better. This platform was built as a safe, completely judgment-free space just for you.\n\nHere, you can share your experiences, meet and talk to amazing people who truly understand what you're going through, and support one another in our Community discussions.\n\nRemember, no matter what anyone else says online, your worth is immeasurable. Stay strong, and never hesitate to use the Report feature if you ever need immediate help or intervention.\n\nWith care,\nThe CyberShield Team ðŸ’›`
        };

        transporter.sendMail(welcomeMailOptions, (mailErr) => {
            if (mailErr) {
                console.error('Error sending welcome email to ' + email + ':', mailErr);
            } else {
                console.log('Welcome email sent to:', email);
            }
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration DB Error:', err);
        res.status(400).json({ message: 'Registration failed due to server error', error: 'Registration failed due to server error' });
    }
});

// API endpoint to handle login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).lean();
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const result = await bcrypt.compare(password, user.password);
        if (result) {
            const isAdmin = user.email === 'anushashetty242@gmail.com';
            res.json({ success: true, message: 'Login successful', isAdmin, name: user.name });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API endpoint to join a group with a code
app.post('/api/join-group', async (req, res) => {
    const { code, email } = req.body;
    if (!code || !email) {
        return res.status(400).json({ message: 'Group code and user email are required' });
    }
    try {
        const group = await Group.findOne({ code, type: 'private' }).lean();
        if (!group) {
            return res.status(404).json({ message: 'Invalid group code' });
        }

        const groupId = group._id.toString();
        await GroupMember.updateOne(
            { groupId, userEmail: email },
            { $setOnInsert: { groupId, userEmail: email } },
            { upsert: true }
        );

        res.status(200).json({ success: true, groupId });
    } catch (err) {
        res.status(500).json({ message: 'Server error while finding group' });
    }
});

// API to get group members
app.get('/api/groups/:id/members', async (req, res) => {
    const groupId = req.params.id;
    try {
        const members = await GroupMember.find({ groupId }).lean();
        const emails = members.map(member => member.userEmail);
        const users = await User.find({ email: { $in: emails } }, 'email name').lean();
        const userMap = new Map(users.map(user => [user.email, user.name]));
        const response = emails.map(email => ({
            email,
            name: userMap.get(email) || email.split('@')[0]
        }));
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to delete a group
app.delete('/api/groups/:id', async (req, res) => {
    const groupId = req.params.id;
    if (!isValidObjectId(groupId)) {
        return res.status(404).json({ error: 'Group not found' });
    }

    try {
        await GroupMember.deleteMany({ groupId });
        await Group.deleteOne({ _id: groupId });
        await MongoPost.deleteMany({ group_id: groupId.toString() });
        res.json({ success: true, message: 'Group deleted successfully' });
    } catch (err) {
        console.error('Error deleting group:', err.message);
        res.status(500).json({ error: 'Failed to delete group', details: err.message });
    }
});

// API endpoint for a user to leave a group
app.post('/api/groups/:id/leave', async (req, res) => {
    const groupId = req.params.id;
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'User email is required' });
    }
    try {
        await GroupMember.deleteOne({ groupId, userEmail: email });
        res.json({ success: true, message: 'Left group successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error leaving group' });
    }
});

// API endpoint to verify a private group code
app.post('/api/groups/:id/verify', async (req, res) => {
    const { code } = req.body;
    const userEmail = req.body.email; // Assuming email is sent in the request
    const groupId = req.params.id;
    if (!isValidObjectId(groupId)) {
        return res.status(401).json({ success: false, message: 'Invalid code' });
    }

    try {
        const group = await Group.findOne({ _id: groupId, type: 'private', code }).lean();
        if (group) {
            await GroupMember.updateOne(
                { groupId, userEmail },
                { $setOnInsert: { groupId, userEmail } },
                { upsert: true }
            );
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid code' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API endpoint to handle user reports and send emails
app.post('/api/report', async (req, res) => {
    const reportData = req.body;
    try {
        const report = await Report.create({
            name: reportData.name,
            email: reportData.email,
            anonymous: reportData.anonymous,
            platform: reportData.platform,
            type: reportData.type,
            severity: reportData.severity,
            details: reportData.description,
            trusted_contact_name: reportData.trustedContactName,
            trusted_contact_email: reportData.trustedContactEmail
        });

        const reportId = report._id.toString();

        // --- Alert Trusted Adult Logic ---
        if (reportData.trustedContactEmail) {
            let responsePlan = "";
            if (reportData.severity === "High") {
                responsePlan = "URGENT RESPONSE REQUIRED: Please have a conversation with them immediately. Ensure they are safe. If there are signs of physical threats or self-harm, please contact local authorities or crisis hotlines. Keep all evidence (screenshots, messages) secured.";
            } else if (reportData.severity === "Medium") {
                responsePlan = "RECOMMENDED ACTION: Sit down and discuss what's happening. Help them block or mute the individuals involved. Monitor their online activity and emotional state over the next few days. Save any evidence of the harassment.";
            } else {
                responsePlan = "SUGGESTED ACTION: Check in on them and keep an open dialogue. Validate their feelings and teach them how to use blocking/reporting tools on the platform. Let them know you are there for support.";
            }

            const adultMailOptions = {
                from: 'anushashetty242@gmail.com',
                to: reportData.trustedContactEmail,
                subject: `URGENT: CyberShield Notification from ${reportData.anonymous ? 'A Student/Child' : (reportData.name || 'Someone who trusts you')}`,
                text: `Dear ${reportData.trustedContactName || 'Trusted Adult'},

You are receiving this alert because someone identified you as a trusted adult while reporting an incident of cyberbullying on our platform, CyberShield.

INCIDENT DETAILS:
- Platform: ${reportData.platform}
- Issue: ${reportData.type}
- Severity: ${reportData.severity}
- Details Provided: "${reportData.description}"

${responsePlan}

Thank you for being part of their support system. 
- The CyberShield Safety Team 🛡️`
            };

            transporter.sendMail(adultMailOptions, (aErr, aInfo) => {
                if (aErr) console.error('Error sending alert to trusted adult:', aErr);
                else console.log('Successfully alerted trusted adult:', reportData.trustedContactEmail);
            });
        }
        // --- End Alert Logic ---

        if (!reportData.email) {
            return res.status(200).json({ success: true, message: 'Report submitted. No email provided for confirmation.', id: reportId });
        }
        
        const mailOptions = {
            from: 'anushashetty242@gmail.com', // ⚠️ Match this with auth user
            to: reportData.email, // Send to the email provided in the report form
            subject: `Your CyberShield Report: ${reportData.type} - We Hear You 🛡️`,
            text: `Hi ${reportData.anonymous ? 'there' : (reportData.name || 'there')},

We want to let you know that we have securely received your report regarding the incident on ${reportData.platform}. 

Thank you for being brave and taking the step to report this. We are looking into the situation immediately. Please know that you are not alone, and we are here to support you.

There is a group of people in the platform you can talk about it, you can create a group.

Details of your report:
- Incident Type: ${reportData.type}
- Severity: ${reportData.severity}

If you need immediate help, please reach out to local helplines or trusted adults. We will keep you updated.

With care,
The CyberShield Team 💛
            `
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email to user:', error);
                return res.status(200).json({ success: true, message: 'Report saved but failed to send confirmation email', id: reportId });
            }
            res.status(200).json({ success: true, message: 'Report submitted and confirmation email sent!', id: reportId });
        });
    } catch (err) {
        console.error('Error saving report to DB:', err);
        res.status(500).json({ success: false, message: 'Server error saving report' });
    }
});

// API endpoint to get all reports for the admin dashboard
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find({}).sort({ timestamp: -1 }).lean();
        const response = reports.map(report => ({
            id: report._id.toString(),
            name: report.name,
            email: report.email,
            anonymous: report.anonymous,
            platform: report.platform,
            type: report.type,
            severity: report.severity,
            details: report.details,
            status: report.status,
            trusted_contact_name: report.trusted_contact_name,
            trusted_contact_email: report.trusted_contact_email,
            timestamp: report.timestamp
        }));
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to update report status
app.put('/api/reports/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await Report.updateOne({ _id: req.params.id }, { $set: { status } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get messages for a specific report
app.get('/api/reports/:id/messages', async (req, res) => {
    const reportId = req.params.id;
    try {
        const messages = await ReportMessage.find({ reportId }).sort({ timestamp: 1 }).lean();
        const response = messages.map(message => ({
            id: message._id.toString(),
            report_id: reportId,
            sender: message.sender,
            message: message.message,
            timestamp: message.timestamp
        }));
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to add a message to a report
app.post('/api/reports/:id/messages', async (req, res) => {
    const reportId = req.params.id;
    const { sender, message } = req.body;
    try {
        const created = await ReportMessage.create({ reportId, sender, message });
        res.status(201).json({
            id: created._id.toString(),
            report_id: reportId,
            sender,
            message,
            timestamp: created.timestamp
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catch-all handler: for any request that doesn't match an API route, send back React's index.html
app.get('/:path(*)', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    } else {
        res.status(404).send('API route not found');
    }
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const userSockets = {};
const groupOnlineLists = {};

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('join_group', (data) => {
        const { groupId, userEmail, userName } = data;
        socket.join(groupId);
        console.log(`User ${userEmail} joined group ${groupId}`);

        userSockets[socket.id] = { groupId, userEmail };
        if (!groupOnlineLists[groupId]) {
            groupOnlineLists[groupId] = [];
        }
        
        // Add if not exists
        const existing = groupOnlineLists[groupId].find(u => u.email === userEmail);
        if (!existing) {
            groupOnlineLists[groupId].push({ email: userEmail, name: userName || userEmail.split('@')[0] });
        } else if (userName && existing.name === existing.email.split('@')[0]) {
            existing.name = userName;
        }
        
        io.to(groupId).emit('update_online_users', groupOnlineLists[groupId]);

        GroupMember.updateOne(
            { groupId, userEmail },
            { $setOnInsert: { groupId, userEmail } },
            { upsert: true }
        ).catch(err => console.error('Error adding user to group:', err));
    });

    socket.on('send_message', async (data) => {
        const { group, author, author_name, content } = data;
        
        try {
            // Save to MongoDB directly for faster real-time performance
            const newPost = new MongoPost({
                group_id: group.toString(),
                author_email: author,
                author_name: author_name || author.split('@')[0],
                content: content
            });
            const savedPost = await newPost.save();
            
            const newMessage = { 
                ...data, 
                id: savedPost._id, 
                timestamp: savedPost.timestamp 
            };
            io.to(group).emit('receive_message', newMessage);
        } catch (err) {
            console.error('Error saving real-time message to MongoDB:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        const userInfo = userSockets[socket.id];
        if (userInfo) {
            const { groupId, userEmail } = userInfo;
            if (groupOnlineLists[groupId]) {
                groupOnlineLists[groupId] = groupOnlineLists[groupId].filter(u => u.email !== userEmail);
                io.to(groupId).emit('update_online_users', groupOnlineLists[groupId]);
            }
            delete userSockets[socket.id];
        }
    });
});

const ensureAdminUser = async () => {
    const adminEmail = 'anushashetty242@gmail.com';
    const adminPassword = 'admin123';
    const existing = await User.findOne({ email: adminEmail }).lean();
    if (!existing) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await User.create({ email: adminEmail, password: hash, name: 'Admin' });
        console.log('Default admin user created.');
    }
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await ensureAdminUser();
    console.log(`Server is running on port ${PORT}`);
});

