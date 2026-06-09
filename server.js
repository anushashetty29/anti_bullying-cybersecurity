require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// File-based database fallback
const dbPath = path.join(__dirname, 'db.json');

const getFileDb = () => {
    let db = { users: [], groups: [], posts: [], members: [], reports: [], reportMessages: [] };
    try {
        if (fs.existsSync(dbPath)) {
            db = { ...db, ...JSON.parse(fs.readFileSync(dbPath, 'utf8')) };
        }
    } catch (err) {
        console.log('Creating new database file...');
    }
    db.users = db.users || [];
    db.groups = db.groups || [];
    db.posts = db.posts || [];
    db.members = db.members || [];
    db.reports = db.reports || [];
    db.reportMessages = db.reportMessages || [];
    return db;
};

const saveFileDb = (data, callback) => {
    fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) console.error('Error saving db.json:', err);
        if (callback) callback(err);
    });
};

let useFileDb = false;

// Connect to MongoDB for real-time chat data
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_chat';
const mongoPromise = mongoose.connect(mongoUri)
    .then(() => {
        console.log('Connected to MongoDB for real-time chat');
        useFileDb = false;
    })
    .catch(err => {
        console.error('⚠️ MongoDB connection error. Using file-based database for now:', err.message);
        useFileDb = true;
    });

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
    status: { type: String, default: 'offline' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isFrozen: { type: Boolean, default: false },
    freezeUntil: { type: Date, default: null },
    freezeReason: { type: String, default: null }
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


const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, 'build')));

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('📧 Nodemailer verification failed:', error.message);
    } else {
        console.log('📧 Email server connection successful. Ready to send emails.');
    }
});

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// API endpoint to get all groups
app.get('/api/groups', async (req, res) => {
    try {
        if (useFileDb) {
            const fileDb = getFileDb();
            const response = fileDb.groups.map(group => ({
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type
            }));
            res.json(response);
        } else {
            const groups = await Group.find({}, 'name description type').lean();
            const response = groups.map(group => ({
                id: group._id.toString(),
                name: group.name,
                description: group.description,
                type: group.type
            }));
            res.json(response);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get a single group's details with posts
app.get('/api/groups/:id', async (req, res) => {
    const groupId = req.params.id;
    if (!useFileDb && !isValidObjectId(groupId)) {
        return res.status(404).send('Group not found');
    }

    try {
        if (useFileDb) {
            const fileDb = getFileDb();
            const group = fileDb.groups.find(g => g._id === groupId);
            if (!group) {
                return res.status(404).send('Group not found');
            }
            const posts = fileDb.posts.filter(p => p.group_id === groupId) || [];
            res.json({
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                code: group.code,
                posts
            });
        } else {
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
        }
    } catch (err) {
        console.error('MongoDB fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch real-time messages' });
    }
});

// API endpoint to create a new group
app.post('/api/groups', async (req, res) => {
    const { name, description, type, code } = req.body;
    try {
        if (useFileDb) {
            const fileDb = getFileDb();
            const groupId = `gid_${Date.now()}`;
            fileDb.groups.push({ _id: groupId, name, description, type, code: type === 'private' ? code : null });
            saveFileDb(fileDb);
            res.status(201).json({ id: groupId, name, description, type, code: type === 'private' ? code : null });
        } else {
            const group = await Group.create({ name, description, type, code: type === 'private' ? code : null });
            res.status(201).json({ id: group._id.toString(), name, description, type, code: group.code });
        }
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
        if (useFileDb) {
            const fileDb = getFileDb();
            const existingUser = fileDb.users.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists', error: 'Email already exists' });
            }
            const hash = await bcrypt.hash(password, 10);
            fileDb.users.push({ email, password: hash, name, _id: `user_${Date.now()}` });
            saveFileDb(fileDb);
        } else {
            const existingUser = await User.findOne({ email }).lean();
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists', error: 'Email already exists' });
            }
            const hash = await bcrypt.hash(password, 10);
            await User.create({ name, email, password: hash });
        }

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
        let user;
        if (useFileDb) {
            const fileDb = getFileDb();
            user = fileDb.users.find(u => u.email === email);
        } else {
            user = await User.findOne({ email }).lean();
        }

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

// In-memory store for password reset tokens (avoids db.json writes that trigger nodemon restarts)
// Map<token, { email, name, expires }>
const passwordResetTokens = new Map();

// =====================================================================
// CONTENT MODERATION SYSTEM
// =====================================================================

// In-memory freeze store for fileDb mode (avoids db.json writes)
// Map<email, { until: timestamp, reason: string }>
const frozenUsers = new Map();

// In-memory message history for spam/rate limit checks
const userMessageHistory = new Map(); // email -> Array of timestamps
const userLastMessage = new Map(); // email -> { content: string, count: number }

// Bad words list (common offensive/abusive terms, and illegal/harmful content keywords)
const BAD_WORDS = [
    'idiot', 'stupid', 'dumb', 'moron', 'loser', 'freak', 'ugly', 'fat', 'retard', 'retarded',
    'hate', 'kill', 'murder', 'die', 'suicide', 'shut up', 'shutup', 'bitch', 'bastard',
    'ass', 'asshole', 'crap', 'damn', 'hell', 'piss', 'shit', 'fuck', 'fucker', 'fucking',
    'sex', 'porn', 'nude', 'naked', 'whore', 'slut', 'rape', 'bully', 'bullying',
    'harass', 'harassment', 'threat', 'abuse', 'abuser', 'abusive', 'racist', 'racism',
    'nigger', 'faggot', 'fag', 'gay', 'lesbian', 'homo', 'tranny', 'cunt',
    'worthless', 'useless', 'pathetic', 'disgusting', 'trash', 'garbage', 'scum',
    // illegal or harmful content keywords
    'hack', 'malware', 'exploit', 'ddos', 'virus', 'pirate', 'cocaine', 'heroin', 'meth', 'weed',
    'illegal drugs', 'weapons', 'bombs', 'bomb', 'gun', 'weapon',
    // additional harmful terms
    'kys', 'kill yourself', 'go die', 'nobody likes you', 'you should die',
    'self harm', 'selfharm', 'cut yourself', 'end your life'
];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Detects violations in a message.
 * Returns { type, reason } if found, or null if clean.
 */
const detectViolation = (message, email) => {
    const lower = message.toLowerCase();

    // Check for URLs
    if (URL_REGEX.test(message)) {
        URL_REGEX.lastIndex = 0; // reset regex state
        return { type: 'url', reason: 'Sending external links is not allowed in the community chat.' };
    }

    // Check for bad words / illegal content
    for (const word of BAD_WORDS) {
        const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(lower)) {
            return { type: 'bad_word', reason: `Use of offensive, abusive, or illegal/harmful language is not permitted.` };
        }
    }

    // Spam check 1: Duplicate messages (3 times in a row)
    if (email) {
        const trimmedMsg = message.trim();
        const lastMsg = userLastMessage.get(email);
        if (lastMsg && lastMsg.content === trimmedMsg) {
            const newCount = lastMsg.count + 1;
            userLastMessage.set(email, { content: trimmedMsg, count: newCount });
            if (newCount >= 3) {
                return { type: 'spam', reason: 'Sending repeated spam messages is not allowed.' };
            }
        } else {
            userLastMessage.set(email, { content: trimmedMsg, count: 1 });
        }

        // Spam check 2: Message rate limit (> 5 messages in 10 seconds)
        const now = Date.now();
        if (!userMessageHistory.has(email)) {
            userMessageHistory.set(email, []);
        }
        const history = userMessageHistory.get(email);
        const recentTimestamps = history.filter(t => now - t < 10000);
        recentTimestamps.push(now);
        userMessageHistory.set(email, recentTimestamps);

        if (recentTimestamps.length > 5) {
            return { type: 'spam', reason: 'Sending too many messages in a short time is not allowed (spam).' };
        }
    }

    return null;
};

/**
 * Sends a freeze notification email to the user (HTML formatted).
 */
const sendFreezeEmail = (userName, userEmail, reason, violatingMessage, freezeUntil) => {
    const unfreezeTime = new Date(freezeUntil).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'short'
    });

    const displayName = userName || 'there';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e0a3c,#0a1e50);padding:32px 40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🛡️❄️</div>
            <h1 style="color:#91c8ff;margin:0;font-size:22px;font-weight:800;letter-spacing:1px;">ACCOUNT TEMPORARILY FROZEN</h1>
            <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:13px;">CyberShield Community Safety System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#e0e0e0;font-size:16px;margin:0 0 24px;">Hi <strong style="color:#fff;">${displayName}</strong>,</p>
            <p style="color:#a0a0b0;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Your CyberShield account has been <strong style="color:#ff6b6b;">temporarily frozen for 30 minutes</strong> due to a community guidelines violation detected in a group chat.
            </p>

            <!-- Reason Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td style="background:#1a0a0a;border:1px solid #ff4444;border-radius:10px;padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;color:#ff4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;">❌ Reason for Freeze</p>
                <p style="margin:0;color:#ffcccc;font-size:14px;">${reason}</p>
              </td></tr>
            </table>

            <!-- Violating Message Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td style="background:#1a1a0a;border:1px solid #ff8800;border-radius:10px;padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;color:#ff8800;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⚠️ Message That Triggered Freeze</p>
                <p style="margin:0;color:#ffe0aa;font-size:14px;font-style:italic;">&ldquo;${violatingMessage}&rdquo;</p>
              </td></tr>
            </table>

            <!-- Unfreeze Time Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="background:#0a1a2a;border:1px solid #6495ed;border-radius:10px;padding:16px 20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;color:#6495ed;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⏰ Account Unfreezes At</p>
                <p style="margin:0;color:#91c8ff;font-size:15px;font-weight:700;">${unfreezeTime} (IST)</p>
              </td></tr>
            </table>

            <!-- Guidelines -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="background:#0f0f1a;border:1px solid #2a2a4a;border-radius:10px;padding:20px;">
                <p style="margin:0 0 12px;font-size:12px;color:#8080a0;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📋 Community Guidelines Reminder</p>
                <ul style="margin:0;padding-left:18px;color:#a0a0c0;font-size:13px;line-height:2;">
                  <li>No cyberbullying, harassment, or hate speech</li>
                  <li>No sharing external links in chat</li>
                  <li>No personal attacks or threats</li>
                  <li>No inappropriate or adult content</li>
                  <li>No spamming or repeated messages</li>
                  <li>Treat all members with kindness and respect</li>
                </ul>
              </td></tr>
            </table>

            <p style="color:#606070;font-size:12px;line-height:1.6;margin:0;">
              Your account will automatically unfreeze after 30 minutes and you may resume chatting.
              Repeated violations may result in <strong style="color:#ff6b6b;">permanent suspension</strong>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a0a12;border-top:1px solid #1e1e2e;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#404050;font-size:12px;">The CyberShield Safety Team 🛡️ &nbsp;|&nbsp; This is an automated message</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
        from: 'anushashetty242@gmail.com',
        to: userEmail,
        subject: 'CyberShield: Your account has been temporarily frozen ❄️',
        html: htmlBody,
        text: `Hi ${displayName},\n\nYour CyberShield account has been temporarily frozen for 30 minutes.\n\nREASON: ${reason}\n\nVIOLATING MESSAGE: "${violatingMessage}"\n\nUNFREEZES AT: ${unfreezeTime} (IST)\n\nThe CyberShield Safety Team`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) console.error('[Freeze] Email error:', err.message);
        else console.log(`[Freeze] Freeze notification sent to ${userEmail}`);
    });
};

/**
 * Checks if a user is currently frozen. Auto-unfreezes if expired.
 * Returns { isFrozen, minutesLeft, reason } for fileDb or MongoDB.
 */
const checkFreezeStatus = async (email) => {
    const now = Date.now();
    if (useFileDb) {
        const fileDb = getFileDb();
        const userIndex = fileDb.users.findIndex(u => u.email === email);
        if (userIndex === -1) return { isFrozen: false, minutesLeft: 0, reason: '' };
        const user = fileDb.users[userIndex];
        if (!user.isFrozen) return { isFrozen: false, minutesLeft: 0, reason: '' };

        if (!user.freezeUntil || new Date(user.freezeUntil) <= new Date(now)) {
            fileDb.users[userIndex].isFrozen = false;
            fileDb.users[userIndex].freezeUntil = null;
            fileDb.users[userIndex].freezeReason = null;
            saveFileDb(fileDb);
            return { isFrozen: false, minutesLeft: 0, reason: '' };
        }
        return {
            isFrozen: true,
            minutesLeft: Math.ceil((new Date(user.freezeUntil) - now) / 60000),
            reason: user.freezeReason,
            frozenUntil: user.freezeUntil
        };
    } else {
        const user = await User.findOne({ email }).lean();
        if (!user || !user.isFrozen) return { isFrozen: false, minutesLeft: 0, reason: '' };
        if (!user.freezeUntil || new Date(user.freezeUntil) <= new Date()) {
            await User.findOneAndUpdate({ email }, { isFrozen: false, freezeUntil: null, freezeReason: null });
            return { isFrozen: false, minutesLeft: 0, reason: '' };
        }
        return {
            isFrozen: true,
            minutesLeft: Math.ceil((new Date(user.freezeUntil) - now) / 60000),
            reason: user.freezeReason,
            frozenUntil: user.freezeUntil
        };
    }
};

// Cleanup expired tokens every 30 minutes
setInterval(() => {
    const now = Date.now();
    for (const [tok, data] of passwordResetTokens.entries()) {
        if (data.expires < now) passwordResetTokens.delete(tok);
    }
}, 30 * 60 * 1000);

// API endpoint to handle forgot password requests
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        // Look up user (read-only, no db.json write)
        let userName = '';
        if (useFileDb) {
            const fileDb = getFileDb();
            const user = fileDb.users.find(u => u.email === email);
            if (!user) {
                return res.status(404).json({ message: 'No account with that email address exists.' });
            }
            userName = user.name || '';
        } else {
            const user = await User.findOne({ email }).lean();
            if (!user) {
                return res.status(404).json({ message: 'No account with that email address exists.' });
            }
            userName = user.name || '';
        }

        const token = require('crypto').randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        // Store token in memory — no file/db write, so nodemon won't restart
        passwordResetTokens.set(token, { email, name: userName, expires });

        const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

        console.log(`\n==================================================`);
        console.log(`[DEBUG] Password reset link for ${email}:`);
        console.log(`${resetUrl}`);
        console.log(`==================================================\n`);

        const mailOptions = {
            from: 'anushashetty242@gmail.com',
            to: email,
            subject: 'Reset Your CyberShield Password 🛡️',
            text: `Hi ${userName || 'there'},\n\nWe received a request to reset the password for your CyberShield account.\n\nTo reset your password, please click on the link below or copy and paste it into your browser:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.\n\nWith care,\nThe CyberShield Safety Team 💛`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending reset email:', error);
                return res.json({ message: 'Password reset link generated. Check the server console for the reset link (dev mode).' });
            }
            res.json({ message: 'An email has been sent to ' + email + ' with further instructions.' });
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// API endpoint to handle password reset requests
app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    try {
        // Look up token in memory store
        const tokenData = passwordResetTokens.get(token);
        if (!tokenData || tokenData.expires < Date.now()) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const { email, name } = tokenData;
        const hash = await bcrypt.hash(password, 10);

        // Update password in db (fileDb or MongoDB)
        if (useFileDb) {
            const fileDb = getFileDb();
            const userIndex = fileDb.users.findIndex(u => u.email === email);
            if (userIndex !== -1) {
                fileDb.users[userIndex].password = hash;
                // Use async write so nodemon doesn't restart mid-response
                const dbSnapshot = JSON.parse(JSON.stringify(fileDb));
                process.nextTick(() => saveFileDb(dbSnapshot));
            }
        } else {
            await User.findOneAndUpdate({ email }, { password: hash });
        }

        // Remove token from memory (one-time use)
        passwordResetTokens.delete(token);

        const mailOptions = {
            from: 'anushashetty242@gmail.com',
            to: email,
            subject: 'Your CyberShield Password Has Been Reset 🛡️',
            text: `Hi ${name || 'there'},\n\nThis is a confirmation that the password for your CyberShield account (${email}) has just been changed.\n\nIf you did not make this change, please contact us immediately.\n\nWith care,\nThe CyberShield Safety Team 💛`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending confirmation email:', error);
            }
        });

        res.json({ message: 'Success! Your password has been changed.' });
    } catch (err) {
        console.error('Reset password error:', err);
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
        if (useFileDb) {
            const fileDb = getFileDb();
            const group = fileDb.groups.find(g => g.code === code && g.type === 'private');
            if (!group) {
                return res.status(404).json({ message: 'Invalid group code' });
            }
            const groupId = group._id;
            const exists = fileDb.members.some(m => m.groupId === groupId && m.userEmail === email);
            if (!exists) {
                fileDb.members.push({ groupId, userEmail: email });
                saveFileDb(fileDb);
            }
            res.status(200).json({ success: true, groupId });
        } else {
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
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error while finding group' });
    }
});

// API to get group members
app.get('/api/groups/:id/members', async (req, res) => {
    const groupId = req.params.id;
    try {
        let emails = [];
        let userMap = new Map();

        if (useFileDb) {
            const fileDb = getFileDb();
            const members = fileDb.members.filter(m => m.groupId === groupId);
            emails = members.map(member => member.userEmail);
            fileDb.users.forEach(user => {
                userMap.set(user.email, user.name);
            });
        } else {
            const members = await GroupMember.find({ groupId }).lean();
            emails = members.map(member => member.userEmail);
            const users = await User.find({ email: { $in: emails } }, 'email name').lean();
            userMap = new Map(users.map(user => [user.email, user.name]));
        }

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
    if (!useFileDb && !isValidObjectId(groupId)) {
        return res.status(404).json({ error: 'Group not found' });
    }

    try {
        if (useFileDb) {
            const fileDb = getFileDb();
            fileDb.groups = fileDb.groups.filter(g => g._id !== groupId);
            fileDb.members = fileDb.members.filter(m => m.groupId !== groupId);
            fileDb.posts = fileDb.posts.filter(p => p.group_id !== groupId);
            saveFileDb(fileDb);
            res.json({ success: true, message: 'Group deleted successfully' });
        } else {
            await GroupMember.deleteMany({ groupId });
            await Group.deleteOne({ _id: groupId });
            await MongoPost.deleteMany({ group_id: groupId.toString() });
            res.json({ success: true, message: 'Group deleted successfully' });
        }
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
        if (useFileDb) {
            const fileDb = getFileDb();
            fileDb.members = fileDb.members.filter(m => !(m.groupId === groupId && m.userEmail === email));
            saveFileDb(fileDb);
            res.json({ success: true, message: 'Left group successfully' });
        } else {
            await GroupMember.deleteOne({ groupId, userEmail: email });
            res.json({ success: true, message: 'Left group successfully' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error leaving group' });
    }
});

// API endpoint to verify a private group code
app.post('/api/groups/:id/verify', async (req, res) => {
    const { code } = req.body;
    const userEmail = req.body.email; // Assuming email is sent in the request
    const groupId = req.params.id;
    if (!useFileDb && !isValidObjectId(groupId)) {
        return res.status(401).json({ success: false, message: 'Invalid code' });
    }

    try {
        if (useFileDb) {
            const fileDb = getFileDb();
            const group = fileDb.groups.find(g => g._id === groupId && g.type === 'private' && g.code === code);
            if (group) {
                const exists = fileDb.members.some(m => m.groupId === groupId && m.userEmail === userEmail);
                if (!exists) {
                    fileDb.members.push({ groupId, userEmail });
                    saveFileDb(fileDb);
                }
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false, message: 'Invalid code' });
            }
        } else {
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
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API endpoint to handle user reports and send emails
app.post('/api/report', async (req, res) => {
    const reportData = req.body;
    try {
        let reportId;
        if (useFileDb) {
            const fileDb = getFileDb();
            reportId = `rep_${Date.now()}`;
            fileDb.reports.push({
                _id: reportId,
                name: reportData.name,
                email: reportData.email,
                anonymous: reportData.anonymous,
                platform: reportData.platform,
                type: reportData.type,
                severity: reportData.severity,
                details: reportData.description,
                status: 'pending',
                trusted_contact_name: reportData.trustedContactName,
                trusted_contact_email: reportData.trustedContactEmail,
                timestamp: new Date().toISOString()
            });
            saveFileDb(fileDb);
        } else {
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
            reportId = report._id.toString();
        }

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
        let reports = [];
        if (useFileDb) {
            const fileDb = getFileDb();
            reports = fileDb.reports.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else {
            reports = await Report.find({}).sort({ timestamp: -1 }).lean();
        }
        const response = reports.map(report => ({
            id: report._id ? report._id.toString() : report.id,
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
        if (useFileDb) {
            const fileDb = getFileDb();
            const reportIndex = fileDb.reports.findIndex(r => r._id === req.params.id);
            if (reportIndex !== -1) {
                fileDb.reports[reportIndex].status = status;
                saveFileDb(fileDb);
            }
        } else {
            await Report.updateOne({ _id: req.params.id }, { $set: { status } });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get messages for a specific report
app.get('/api/reports/:id/messages', async (req, res) => {
    const reportId = req.params.id;
    try {
        let messages = [];
        if (useFileDb) {
            const fileDb = getFileDb();
            messages = fileDb.reportMessages.filter(m => m.reportId === reportId)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else {
            messages = await ReportMessage.find({ reportId }).sort({ timestamp: 1 }).lean();
        }
        const response = messages.map(message => ({
            id: message._id ? message._id.toString() : message.id,
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
        let created;
        if (useFileDb) {
            const fileDb = getFileDb();
            created = {
                _id: `repm_${Date.now()}`,
                reportId,
                sender,
                message,
                timestamp: new Date().toISOString()
            };
            fileDb.reportMessages.push(created);
            saveFileDb(fileDb);
        } else {
            const reportMsg = await ReportMessage.create({ reportId, sender, message });
            created = {
                _id: reportMsg._id,
                reportId,
                sender,
                message,
                timestamp: reportMsg.timestamp
            };
        }
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

        if (useFileDb) {
            const fileDb = getFileDb();
            const exists = fileDb.members.some(m => m.groupId === groupId && m.userEmail === userEmail);
            if (!exists) {
                fileDb.members.push({ groupId, userEmail });
                saveFileDb(fileDb);
            }
        } else {
            GroupMember.updateOne(
                { groupId, userEmail },
                { $setOnInsert: { groupId, userEmail } },
                { upsert: true }
            ).catch(err => console.error('Error adding user to group:', err));
        }
    });

    socket.on('send_message', async (data) => {
        const { group, author, author_name, content } = data;

        // Basic validation
        if (!author || !content || !content.trim()) return;

        try {
            // ---- 1. Check if sender is currently frozen ----
            const freezeStatus = await checkFreezeStatus(author);
            if (freezeStatus.isFrozen) {
                // Re-notify the client in case they reconnected
                socket.emit('account_frozen', freezeStatus);
                return; // Block message entirely
            }

            // ---- 2. Content moderation check ----
            const violation = detectViolation(content, author);
            if (violation) {
                const freezeUntil = new Date(Date.now() + 30 * 60 * 1000);

                // Look up the user's real name from DB for the email
                let userName = author_name || author.split('@')[0];

                if (useFileDb) {
                    const fileDb = getFileDb();
                    const dbUserIndex = fileDb.users.findIndex(u => u.email === author);
                    if (dbUserIndex !== -1) {
                        userName = fileDb.users[dbUserIndex].name || userName;
                        fileDb.users[dbUserIndex].isFrozen = true;
                        fileDb.users[dbUserIndex].freezeUntil = freezeUntil.toISOString();
                        fileDb.users[dbUserIndex].freezeReason = violation.reason;
                    }
                    saveFileDb(fileDb);
                } else {
                    // Get name from MongoDB first, then update
                    const dbUser = await User.findOne({ email: author }, 'name').lean();
                    if (dbUser && dbUser.name) userName = dbUser.name;

                    await User.findOneAndUpdate(
                        { email: author },
                        {
                            isFrozen: true,
                            freezeUntil: freezeUntil,
                            freezeReason: violation.reason
                        }
                    );
                }

                // Send freeze notification email (HTML)
                sendFreezeEmail(userName, author, violation.reason, content, freezeUntil);

                console.log(`[Moderation] ❄️  Froze user ${author} | Reason: ${violation.reason} | Type: ${violation.type}`);

                // Notify the sender their account is now frozen
                socket.emit('account_frozen', {
                    isFrozen: true,
                    minutesLeft: 30,
                    reason: violation.reason,
                    frozenUntil: freezeUntil.toISOString()
                });
                return; // ❌ Do NOT broadcast the bad message to the group
            }

            // ---- 3. Clean message — save and broadcast ----
            let savedPost;
            if (useFileDb) {
                const fileDb = getFileDb();
                savedPost = {
                    _id: `post_${Date.now()}`,
                    group_id: group.toString(),
                    author_email: author,
                    author_name: author_name || author.split('@')[0],
                    content: content.trim(),
                    timestamp: new Date().toISOString()
                };
                fileDb.posts.push(savedPost);
                saveFileDb(fileDb);
            } else {
                const newPost = new MongoPost({
                    group_id: group.toString(),
                    author_email: author,
                    author_name: author_name || author.split('@')[0],
                    content: content.trim()
                });
                savedPost = await newPost.save();
            }

            const newMessage = {
                ...data,
                content: content.trim(),
                id: savedPost._id.toString(),
                timestamp: savedPost.timestamp
            };
            io.to(group).emit('receive_message', newMessage);
        } catch (err) {
            console.error('Error in send_message handler:', err);
        }
    });

    // Allow client to check freeze status on connect
    socket.on('check_freeze', async ({ email }) => {
        if (!email) return;
        const status = await checkFreezeStatus(email);
        socket.emit('freeze_status', status);
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
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            console.log('Admin email or password not set in environment variables.');
            return;
        }
        const existing = await User.findOne({ email: adminEmail }).lean();
        if (!existing) {
            const hash = await bcrypt.hash(adminPassword, 10);
            await User.create({ email: adminEmail, password: hash, name: 'Admin' });
            console.log('Default admin user created.');
        }
    } catch (err) {
        console.log('Could not create admin user (MongoDB may not be connected yet):', err.message);
    }
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await ensureAdminUser();
    console.log(`Server is running on port ${PORT}`);
});

