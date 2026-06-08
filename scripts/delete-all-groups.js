const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_chat';

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err.message));

const Group = mongoose.model('Group', new mongoose.Schema({
    name: String,
    description: String,
    type: String,
    code: String
}));

const GroupMember = mongoose.model('GroupMember', new mongoose.Schema({
    groupId: String,
    userEmail: String
}));

const MongoPost = mongoose.model('Post', new mongoose.Schema({
    group_id: String,
    author_email: String,
    author_name: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
}));

async function deleteAllGroups() {
    try {
        const groupsDeleted = await Group.deleteMany({});
        const membersDeleted = await GroupMember.deleteMany({});
        const postsDeleted = await MongoPost.deleteMany({});
        
        console.log(`✓ Deleted ${groupsDeleted.deletedCount} groups`);
        console.log(`✓ Deleted ${membersDeleted.deletedCount} group members`);
        console.log(`✓ Deleted ${postsDeleted.deletedCount} posts`);
        console.log('All groups and related data have been deleted successfully!');
        
        process.exit(0);
    } catch (err) {
        console.error('Error deleting groups:', err.message);
        process.exit(1);
    }
}

deleteAllGroups();
