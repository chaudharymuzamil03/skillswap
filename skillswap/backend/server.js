import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import promClient from 'prom-client';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://oryxstoreofficial_db_user:nVOd5QZqnowvmmCY@cluster0.uez7fco.mongodb.net/skillswap?retryWrites=true&w=majority&appName=Cluster0';

// ============================================
// SCHEMAS
// ============================================

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    skillCredits: { type: Number, default: 50 },
    reputationScore: { type: Number, default: 0 },
    teachSkills: [String],
    learnSkills: [String],
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const swapRequestSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposedSkills: [String],
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    message: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earned', 'spent', 'transfer', 'bonus'], required: true },
    amount: { type: Number, required: true },
    description: String,
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
    updatedAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true },
    scheduledTime: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    status: { 
        type: String, 
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], 
        default: 'scheduled' 
    },
    meetingLink: { type: String, default: 'https://meet.google.com/new' },
    notes: String,
    sessionNumber: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 1 },
    skillRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
    verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const skillProgressSchema = new mongoose.Schema({
    swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
    skill: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalSessions: { type: Number, required: true, default: 1 },
    completedSessions: { type: Number, default: 0 },
    completedSessionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }], // NEW: Track completed sessions
    status: { 
        type: String, 
        enum: ['in-progress', 'completed'], 
        default: 'in-progress' 
    },
    creditsTransferred: { type: Boolean, default: false }, // NEW: Prevent duplicate credit transfer
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

reviewSchema.index({ fromUser: 1, toUser: 1, sessionId: 1 }, { unique: true, sparse: true });

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);
const Session = mongoose.model('Session', sessionSchema);
const Review = mongoose.model('Review', reviewSchema);
const SkillProgress = mongoose.model('SkillProgress', skillProgressSchema);

console.log('🔄 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected!');
        startServer();
    })
    .catch(err => {
        console.log('❌ MongoDB Error:', err.message);
        startServer();
    });

const createTransaction = async (userId, type, amount, description, relatedUserId = null, swapRequestId = null) => {
    try {
        const transaction = new Transaction({
            userId,
            type,
            amount,
            description,
            relatedUser: relatedUserId,
            swapRequestId,
            createdAt: new Date()
        });
        await transaction.save();
        console.log(`✅ Transaction recorded: ${type} ${amount} credits for user ${userId}`);
        return transaction;
    } catch (error) {
        console.error('❌ Transaction creation error:', error);
        throw error;
    }
};

const validateName = (name) => {
    if (!name || name.trim().length === 0) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (/\d/.test(name)) return 'Name cannot contain numbers';
    return '';
};

const validateEmail = (email) => {
    if (!email || email.trim().length === 0) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
};

function startServer() {
    const createDefaultAdmin = async () => {
        try {
            const adminExists = await User.findOne({ email: 'admin@skillswap.com' });
            if (!adminExists) {
                const adminUser = new User({
                    name: 'System Admin',
                    email: 'admin@skillswap.com',
                    password: 'Admin-011',
                    role: 'admin'
                });
                await adminUser.save();
                console.log('✅ Default admin created: admin@skillswap.com / admin123');
            }
        } catch (error) {
            console.log('⚠️ Admin creation:', error.message);
        }
    };

    // ============================================
    // BASIC ROUTES
    // ============================================

    // Metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Prometheus metrics endpoint
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

    app.get('/', (req, res) => {
        res.json({ 
            message: 'SkillSwap Backend is RUNNING!',
            database: 'MongoDB Connected',
            status: 'OK'
        });
    });

    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            status: 'Server is healthy',
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
        });
    });

    // ============================================
    // AUTH ROUTES
    // ============================================

    app.post('/api/register', async (req, res) => {
        try {
            const { name, email, password } = req.body;
            
            console.log('📝 Registration attempt:', { name, email });
            
            const nameError = validateName(name);
            if (nameError) return res.status(400).json({ success: false, message: nameError });
            
            const emailError = validateEmail(email);
            if (emailError) return res.status(400).json({ success: false, message: emailError });
            
            if (!password || password.length === 0) return res.status(400).json({ success: false, message: 'Password is required' });
            
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingUser) return res.status(400).json({ success: false, message: 'User already exists with this email' });
            
            const newUser = new User({ 
                name: name.trim(), 
                email: email.toLowerCase().trim(), 
                password 
            });
            
            await newUser.save();
            
            console.log('✅ User registered:', newUser.email);
            
            res.json({ 
                success: true, 
                message: 'Registered successfully!',
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    skillCredits: newUser.skillCredits,
                    reputationScore: newUser.reputationScore,
                    teachSkills: newUser.teachSkills,
                    learnSkills: newUser.learnSkills
                }
            });
        } catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
        }
    });

    app.post('/api/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            
            console.log('🔐 Login attempt:', email);
            
            if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
            
            const user = await User.findOne({ email: email.toLowerCase().trim() });
            
            if (!user || user.password !== password) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            
            console.log('✅ Login successful:', user.email);
            
            res.json({ 
                success: true, 
                message: 'Login successful!',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    skillCredits: user.skillCredits,
                    reputationScore: user.reputationScore,
                    teachSkills: user.teachSkills,
                    learnSkills: user.learnSkills
                }
            });
        } catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
        }
    });

    // ============================================
    // PASSWORD CHANGE ROUTES
    // ============================================

    app.put('/api/admin/users/:id/password', async (req, res) => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            console.log('🔐 Admin changing password for user:', id);

            if (!newPassword) return res.status(400).json({ success: false, message: 'New password is required' });

            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            user.password = newPassword;
            await user.save();

            console.log(`✅ Password updated for user: ${user.email}`);
            
            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('❌ Update password error:', error);
            res.status(500).json({ success: false, message: 'Error updating password' });
        }
    });

    app.put('/api/users/:id/change-password', async (req, res) => {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            console.log('🔐 User changing own password:', id);

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current and new password are required' });
            }

            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            if (user.password !== currentPassword) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

            user.password = newPassword;
            await user.save();

            console.log(`✅ User changed own password: ${user.email}`);
            
            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('❌ Change password error:', error);
            res.status(500).json({ success: false, message: 'Error changing password' });
        }
    });

    // ============================================
    // USER MANAGEMENT ROUTES
    // ============================================

    app.get('/api/users', async (req, res) => {
        try {
            console.log('📋 /api/users endpoint hit');
            
            const users = await User.find({});
            console.log('✅ Users fetched:', users.length);
            
            res.json({ success: true, users, count: users.length });
        } catch (error) {
            console.error('❌ Users fetch error:', error);
            res.status(500).json({ success: false, message: 'Error fetching users' });
        }
    });

    app.get('/api/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id).select('-password');
            
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            
            res.json({ success: true, user });
        } catch (error) {
            console.error('❌ User fetch error:', error);
            res.status(500).json({ success: false, message: 'Error fetching user' });
        }
    });

    app.put('/api/users/:id/skills', async (req, res) => {
        try {
            const { id } = req.params;
            const { teachSkills, learnSkills } = req.body;

            console.log('🔄 Updating skills for user:', id);

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { teachSkills: teachSkills || [], learnSkills: learnSkills || [] },
                { new: true }
            ).select('-password');

            if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });
            
            console.log('✅ Skills updated successfully for:', updatedUser.email);
            
            res.json({ success: true, message: 'Skills updated successfully!', user: updatedUser });
        } catch (error) {
            console.error('❌ Skills update error:', error);
            res.status(500).json({ success: false, message: 'Error updating skills' });
        }
    });

   app.get('/api/matching/users', async (req, res) => {
    try {
        const { userId } = req.query;  // Current user ID pass karo
        
        // Get completed skills for current user
        const completedProgress = await SkillProgress.find({
            $or: [{ teacherId: userId }, { learnerId: userId }],
            status: 'completed'
        });
        
        const completedSkills = completedProgress.map(p => p.skill);
        
        console.log('✅ Completed skills for user:', completedSkills);
        
        const allUsers = await User.find({}).select('-password');
        
        // Filter users
        const filteredUsers = allUsers.filter(user => {
            // Skip current user and admin
            if (user._id.toString() === userId || user.role === 'admin') return false;
            
            // Check if user has any non-completed skills
            const availableTeachSkills = user.teachSkills.filter(
                skill => !completedSkills.includes(skill)
            );
            const availableLearnSkills = user.learnSkills.filter(
                skill => !completedSkills.includes(skill)
            );
            
            return availableTeachSkills.length > 0 || availableLearnSkills.length > 0;
        });
        
        res.json({ success: true, count: filteredUsers.length, users: filteredUsers });
    } catch (error) {
        console.error('❌ Matching users fetch error:', error);
        res.json({ success: false, message: 'Error fetching users for matching' });
    }
});

    // ============================================
    // SWAP REQUEST ROUTES
    // ============================================

    app.post('/api/matching/request', async (req, res) => {
        try {
            const { fromUserId, toUserId, proposedSkills, message } = req.body;

            console.log('🔄 Processing swap request:', { fromUserId, toUserId, proposedSkills });

            const fromUser = await User.findById(fromUserId);
            const toUser = await User.findById(toUserId);

            if (!fromUser || !toUser) return res.status(404).json({ success: false, message: 'User not found' });

            const existingRequest = await SwapRequest.findOne({
                fromUser: fromUserId,
                toUser: toUserId,
                status: 'pending'
            });

            if (existingRequest) {
                return res.json({ success: false, message: 'You already have a pending request with this user' });
            }

            const swapRequest = new SwapRequest({
                fromUser: fromUserId,
                toUser: toUserId,
                proposedSkills: proposedSkills || [],
                message: message || `Hi! I'd like to learn ${proposedSkills?.join(', ')} from you.`
            });

            await swapRequest.save();
            await swapRequest.populate('fromUser', 'name email teachSkills learnSkills');
            await swapRequest.populate('toUser', 'name email teachSkills learnSkills');

            console.log('✅ Swap request created:', swapRequest._id);

            res.json({ success: true, message: 'Swap request sent successfully!', request: swapRequest });
        } catch (error) {
            console.error('❌ Swap request error:', error);
            res.status(500).json({ success: false, message: 'Error sending swap request: ' + error.message });
        }
    });

    app.get('/api/users/:userId/swap-requests', async (req, res) => {
        try {
            const { userId } = req.params;
            console.log('📩 Fetching swap requests for user:', userId);

            const sentRequests = await SwapRequest.find({ fromUser: userId })
                .populate('toUser', 'name email teachSkills')
                .sort({ createdAt: -1 });

            const receivedRequests = await SwapRequest.find({ toUser: userId })
                .populate('fromUser', 'name email teachSkills')
                .sort({ createdAt: -1 });

            console.log('✅ Sent requests:', sentRequests.length);
            console.log('✅ Received requests:', receivedRequests.length);

            res.json({ success: true, sentRequests, receivedRequests });
        } catch (error) {
            console.error('❌ Get swap requests error:', error);
            res.status(500).json({ success: false, message: 'Error fetching swap requests' });
        }
    });

    app.put('/api/swap-requests/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        const validStatuses = ['accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use "accepted" or "rejected"' });
        }

        const swapRequest = await SwapRequest.findByIdAndUpdate(
            requestId,
            { status, updatedAt: new Date() },
            { new: true }
        ).populate('fromUser', 'name email teachSkills')
         .populate('toUser', 'name email learnSkills');

        if (!swapRequest) return res.status(404).json({ success: false, message: 'Swap request not found' });

        if (status === 'accepted') {
            // ============================================
            // ONLY UPDATE REPUTATION SCORES, NO CREDITS TRANSFER
            // Credits will transfer only when sessions are completed
            // ============================================
            
            // Update reputation scores only
            await User.findByIdAndUpdate(swapRequest.fromUser._id, {
                $inc: { reputationScore: 5 }
            });
            
            await User.findByIdAndUpdate(swapRequest.toUser._id, {
                $inc: { reputationScore: 10 }
            });

            // Create or get existing chat for users
            let chat = await Chat.findOne({
                participants: { $all: [swapRequest.fromUser._id, swapRequest.toUser._id], $size: 2 }
            });

            if (!chat) {
                chat = new Chat({
                    participants: [swapRequest.fromUser._id, swapRequest.toUser._id],
                    swapRequestId: swapRequest._id
                });
                await chat.save();
                
                const welcomeMessage = new Message({
                    chatId: chat._id,
                    senderId: swapRequest.fromUser._id,
                    content: `🎉 Swap request accepted! Let's discuss the ${swapRequest.proposedSkills.join(', ')} session.`,
                    readBy: [swapRequest.fromUser._id]
                });
                await welcomeMessage.save();
                
                await Chat.findByIdAndUpdate(chat._id, { lastMessage: welcomeMessage._id });
                
                console.log(`💬 Chat created for swap request: ${swapRequest._id}`);
            }

            console.log(`✅ Swap request ACCEPTED: ${swapRequest._id} - No credits transferred. Credits will transfer after session completion.`);
            
        } else if (status === 'rejected') {
            console.log(`❌ Swap request REJECTED: ${requestId}`);
        }

        res.json({ success: true, message: `Swap request ${status} successfully!`, request: swapRequest });
        
    } catch (error) {
        console.error('❌ Update swap request error:', error);
        res.status(500).json({ success: false, message: 'Error updating swap request: ' + error.message });
    }
});

    // ============================================
    // CREDIT SYSTEM ROUTES
    // ============================================

    app.get('/api/users/:userId/transactions', async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log('💰 Fetching transactions for user:', userId);
            
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            
            const transactions = await Transaction.find({ userId })
                .populate('relatedUser', 'name email')
                .sort({ createdAt: -1 })
                .limit(50);

            console.log(`✅ Found ${transactions.length} transactions for user ${userId}`);
            
            res.json({ success: true, transactions, count: transactions.length });
        } catch (error) {
            console.error('❌ Get transactions error:', error);
            res.status(500).json({ success: false, message: 'Error fetching transactions' });
        }
    });

    app.get('/api/users/:userId/credit-stats', async (req, res) => {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            
            const transactions = await Transaction.find({ userId });
            const transactionCount = transactions.length;
            
            let totalEarned = 0, totalSpent = 0;
            
            transactions.forEach(transaction => {
                if (transaction.type === 'earned' || transaction.type === 'bonus') totalEarned += transaction.amount;
                else if (transaction.type === 'spent') totalSpent += Math.abs(transaction.amount);
            });
            
            const netChange = totalEarned - totalSpent;
            
            res.json({
                success: true,
                stats: {
                    currentBalance: user.skillCredits,
                    totalEarned,
                    totalSpent,
                    netChange,
                    transactionCount,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Get credit stats error:', error);
            res.status(500).json({ success: false, message: 'Error fetching credit statistics' });
        }
    });

    // ============================================
    // CHAT ROUTES
    // ============================================

    app.post('/api/chats', async (req, res) => {
        try {
            const { userId1, userId2, swapRequestId } = req.body;
            
            console.log('💬 Creating/finding chat between:', userId1, 'and', userId2);
            
            let chat = await Chat.findOne({
                participants: { $all: [userId1, userId2], $size: 2 }
            }).populate('participants', 'name email');

            if (!chat) {
                chat = new Chat({ participants: [userId1, userId2], swapRequestId });
                await chat.save();
                await chat.populate('participants', 'name email');
                console.log('✅ New chat created:', chat._id);
            }

            res.json({ success: true, chat });
        } catch (error) {
            console.error('❌ Chat creation error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/api/users/:userId/chats', async (req, res) => {
        try {
            const { userId } = req.params;
            
            const chats = await Chat.find({ participants: userId })
                .populate('participants', 'name email')
                .populate('lastMessage')
                .populate({ path: 'swapRequestId', populate: { path: 'fromUser toUser', select: 'name email' } })
                .sort({ updatedAt: -1 });

            const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
                const unreadCount = await Message.countDocuments({
                    chatId: chat._id,
                    senderId: { $ne: userId },
                    readBy: { $ne: userId }
                });
                return { ...chat.toObject(), unreadCount };
            }));

            res.json({ success: true, chats: chatsWithUnread });
        } catch (error) {
            console.error('❌ Fetch chats error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/api/chats/:chatId/messages', async (req, res) => {
        try {
            const { chatId } = req.params;
            const { userId } = req.query;
            
            const messages = await Message.find({ chatId })
                .populate('senderId', 'name email')
                .sort({ createdAt: 1 });

            if (userId) {
                await Message.updateMany(
                    { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
                    { $addToSet: { readBy: userId } }
                );
            }

            res.json({ success: true, messages });
        } catch (error) {
            console.error('❌ Fetch messages error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.post('/api/chats/:chatId/messages', async (req, res) => {
        try {
            const { chatId } = req.params;
            const { senderId, content } = req.body;
            
            const message = new Message({ chatId, senderId, content, readBy: [senderId] });
            await message.save();
            
            await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() });
            await message.populate('senderId', 'name email');
            
            res.json({ success: true, message });
        } catch (error) {
            console.error('❌ Send message error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // SKILL PROGRESS ROUTES
    // ============================================

    app.get('/api/skill-progress/check', async (req, res) => {
        try {
            const { swapRequestId, skill, learnerId } = req.query;
            
            const progress = await SkillProgress.findOne({
                swapRequestId,
                skill,
                learnerId,
                status: 'in-progress'
            });

            if (progress) {
                res.json({
                    exists: true,
                    totalSessions: progress.totalSessions,
                    completedSessions: progress.completedSessions,
                    status: progress.status
                });
            } else {
                const completed = await SkillProgress.findOne({
                    swapRequestId,
                    skill,
                    learnerId,
                    status: 'completed'
                });
                
                if (completed) {
                    res.json({
                        exists: true,
                        totalSessions: completed.totalSessions,
                        completedSessions: completed.totalSessions,
                        status: 'completed'
                    });
                } else {
                    res.json({ exists: false });
                }
            }
        } catch (error) {
            console.error('❌ Skill progress check error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/api/skill-progress/:swapRequestId', async (req, res) => {
        try {
            const { swapRequestId } = req.params;
            const progress = await SkillProgress.find({ swapRequestId })
                .populate('teacherId', 'name email')
                .populate('learnerId', 'name email');
            res.json({ success: true, progress });
        } catch (error) {
            console.error('❌ Skill progress fetch error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // SESSION ROUTES
    // ============================================

    app.post('/api/sessions', async (req, res) => {
        try {
            const { chatId, teacherId, learnerId, skill, scheduledTime, duration, notes, sessionNumber, totalSessions, swapRequestId } = req.body;
            
            const meetingLink = `https://meet.google.com/new`;
            
            let progress = await SkillProgress.findOne({
                swapRequestId,
                skill,
                learnerId,
                teacherId
            });

            if (!progress) {
                progress = new SkillProgress({
                    swapRequestId,
                    skill,
                    teacherId,
                    learnerId,
                    totalSessions: totalSessions || 1,
                    completedSessions: 0,
                    completedSessionIds: [],
                    creditsTransferred: false,
                    status: 'in-progress'
                });
                await progress.save();
            }

            const session = new Session({
                chatId,
                teacherId,
                learnerId,
                skill,
                scheduledTime,
                duration: duration || 60,
                meetingLink,
                notes,
                sessionNumber: sessionNumber || progress.completedSessions + 1,
                totalSessions: progress.totalSessions,
                skillRequestId: swapRequestId,
                status: 'scheduled',
                verifiedBy: []
            });
            
            await session.save();
            await session.populate('teacherId', 'name email');
            await session.populate('learnerId', 'name email');
            
            const systemMessage = new Message({
                chatId,
                senderId: teacherId,
                content: `📅 Session #${sessionNumber} of ${progress.totalSessions} scheduled for ${new Date(scheduledTime).toLocaleString()} - Skill: ${skill}`,
                readBy: [teacherId]
            });
            await systemMessage.save();
            
            await Chat.findByIdAndUpdate(chatId, { lastMessage: systemMessage._id, updatedAt: new Date() });
            
            console.log(`📅 Session #${sessionNumber}/${progress.totalSessions} scheduled: ${skill}`);
            
            res.json({ success: true, session, progress });
        } catch (error) {
            console.error('❌ Schedule session error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/api/users/:userId/sessions', async (req, res) => {
        try {
            const { userId } = req.params;
            const { activeOnly } = req.query;
            
            let query = { $or: [{ teacherId: userId }, { learnerId: userId }] };
            
            if (activeOnly === 'true') {
                query.status = { $ne: 'completed' };
            }
            
            const sessions = await Session.find(query)
                .populate('teacherId', 'name email')
                .populate('learnerId', 'name email')
                .populate('chatId')
                .sort({ scheduledTime: 1 });
            
            const progress = await SkillProgress.find({ $or: [{ teacherId: userId }, { learnerId: userId }] })
                .sort({ updatedAt: -1 });
            
            console.log(`📊 Fetched ${sessions.length} sessions for user ${userId}`);
            
            res.json({ success: true, sessions, progress });
        } catch (error) {
            console.error('❌ Fetch sessions error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // FIXED: COMPLETE SESSION ROUTE - CREDITS ONLY ON FINAL SESSION
    // ============================================
   app.put('/api/sessions/:sessionId/complete', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId, role } = req.body;
        
        console.log('🟡 COMPLETING SESSION:', { sessionId, userId, role });
        
        const session = await Session.findById(sessionId)
            .populate('teacherId')
            .populate('learnerId');
        
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.status === 'completed') return res.status(400).json({ success: false, message: 'Session already completed' });

        // Check if session time has passed
        const sessionTime = new Date(session.scheduledTime);
        const now = new Date();
        if (sessionTime > now) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot complete session before scheduled time: ${sessionTime.toLocaleString()}` 
            });
        }

        if (!session.verifiedBy) session.verifiedBy = [];
        
        if (!session.verifiedBy.includes(userId)) {
            session.verifiedBy.push(userId);
            await session.save();
            console.log('✅ User verified:', userId);
        }

        const bothVerified = session.verifiedBy.includes(session.teacherId._id.toString()) && 
                           session.verifiedBy.includes(session.learnerId._id.toString());

        if (!bothVerified) {
            console.log('⏳ Waiting for other party to verify');
            return res.json({
                success: true,
                message: `${role === 'teacher' ? 'Teacher' : 'Learner'} verification received. Waiting for other party.`,
                waitingForOther: true
            });
        }

        console.log('✅ Both users verified - completing session');

        session.status = 'completed';
        await session.save();

        let progress = await SkillProgress.findOne({
            swapRequestId: session.skillRequestId,
            skill: session.skill,
            learnerId: session.learnerId._id,
            teacherId: session.teacherId._id
        });

        if (!progress) {
            progress = new SkillProgress({
                swapRequestId: session.skillRequestId,
                skill: session.skill,
                teacherId: session.teacherId._id,
                learnerId: session.learnerId._id,
                totalSessions: session.totalSessions || 1,
                completedSessions: 0,
                completedSessionIds: [],
                creditsTransferred: false,
                status: 'in-progress'
            });
            await progress.save();
        }

        // Check if this session was already completed
        if (progress.completedSessionIds && progress.completedSessionIds.includes(sessionId)) {
            return res.json({
                success: true,
                message: 'Session already marked as completed',
                alreadyCompleted: true
            });
        }

        // Mark this session as completed
        if (!progress.completedSessionIds) progress.completedSessionIds = [];
        progress.completedSessionIds.push(sessionId);
        progress.completedSessions = (progress.completedSessions || 0) + 1;
        progress.updatedAt = new Date();
        
        console.log('📊 Progress after increment:', {
            completedSessions: progress.completedSessions,
            totalSessions: progress.totalSessions
        });
        
        const isFinalSession = progress.completedSessions >= progress.totalSessions;
        
        if (isFinalSession) {
            progress.status = 'completed';
            progress.creditsTransferred = true;
            
            // ============================================
            // 🔴🔴🔴 FIX: REMOVE COMPLETED SKILL FROM USERS 🔴🔴🔴
            // ============================================
            
            // Remove skill from teacher's teachSkills (kyunki ab teacher ye skill nahi sikha sakta)
            await User.findByIdAndUpdate(session.teacherId._id, {
                $pull: { teachSkills: session.skill }
            });
            
            // Remove skill from learner's learnSkills (kyunki ab learner ye skill seekh chuka)
            await User.findByIdAndUpdate(session.learnerId._id, {
                $pull: { learnSkills: session.skill }
            });
            
            console.log(`🗑️ Skill "${session.skill}" removed from both users' lists`);
            console.log(`   📌 Removed from ${session.teacherId.name}'s teachSkills`);
            console.log(`   📌 Removed from ${session.learnerId.name}'s learnSkills`);
            
            // ============================================
            // CREDITS TRANSFER (SIRF FINAL SESSION PAR)
            // ============================================
            
            if (!progress.creditsTransferred) {
                const creditAmount = progress.totalSessions * 10;
                
                console.log(`💰 FINAL SESSION! Transferring ${creditAmount} credits...`);
                
                // Transfer credits from learner to teacher
                const learner = await User.findById(session.learnerId._id);
                const teacher = await User.findById(session.teacherId._id);
                
                if (learner.skillCredits < creditAmount) {
                    return res.status(400).json({
                        success: false,
                        message: `${learner.name} has insufficient credits (${learner.skillCredits}/${creditAmount})`
                    });
                }
                
                learner.skillCredits -= creditAmount;
                teacher.skillCredits += creditAmount;
                
                await learner.save();
                await teacher.save();
                
                // Mark credits as transferred
                progress.creditsTransferred = true;
                
                // Create transaction records
                await createTransaction(
                    session.learnerId._id, 'spent', -creditAmount,
                    `Paid ${creditAmount} credits for completing ${progress.totalSessions} sessions of ${session.skill} with ${teacher.name}`,
                    session.teacherId._id, session._id
                );
                
                await createTransaction(
                    session.teacherId._id, 'earned', creditAmount,
                    `Earned ${creditAmount} credits for teaching ${progress.totalSessions} sessions of ${session.skill} to ${learner.name}`,
                    session.learnerId._id, session._id
                );
                
                const completionMessage = new Message({
                    chatId: session.chatId,
                    senderId: session.teacherId._id,
                    content: `🎉 SKILL COMPLETED! ${session.skill} - All ${progress.totalSessions} sessions done! ${creditAmount} credits transferred.\n\n⭐ Skill has been removed from your lists. Please leave a review!`,
                    readBy: [session.teacherId._id]
                });
                await completionMessage.save();
                await Chat.findByIdAndUpdate(session.chatId, { lastMessage: completionMessage._id });
                
                console.log(`💰 CREDITS TRANSFERRED: ${creditAmount} credits from ${learner.name} to ${teacher.name}`);
                
                await progress.save();
                
                res.json({
                    success: true,
                    message: `🎉 Skill "${session.skill}" completed! All ${progress.totalSessions} sessions done. ${creditAmount} credits transferred. Skill removed from both users.`,
                    isFinalSession: true,
                    creditAmount,
                    progress
                });
            } else {
                await progress.save();
                res.json({
                    success: true,
                    message: `🎉 Skill "${session.skill}" completed! (Credits already transferred)`,
                    isFinalSession: true,
                    progress
                });
            }
        } else {
            await progress.save();
            
            const progressMessage = new Message({
                chatId: session.chatId,
                senderId: session.teacherId._id,
                content: `✅ Session #${session.sessionNumber} of ${progress.totalSessions} completed for ${session.skill}. ${progress.completedSessions}/${progress.totalSessions} sessions done. ${progress.totalSessions - progress.completedSessions} sessions remaining.`,
                readBy: [session.teacherId._id]
            });
            await progressMessage.save();
            await Chat.findByIdAndUpdate(session.chatId, { lastMessage: progressMessage._id });
            
            console.log(`📊 Progress: ${progress.completedSessions}/${progress.totalSessions} sessions for ${session.skill}`);
            
            res.json({
                success: true,
                message: `✅ Session #${session.sessionNumber} completed! ${progress.completedSessions}/${progress.totalSessions} sessions done. ${progress.totalSessions - progress.completedSessions} sessions remaining.`,
                isFinalSession: false,
                progress: {
                    completedSessions: progress.completedSessions,
                    totalSessions: progress.totalSessions,
                    remainingSessions: progress.totalSessions - progress.completedSessions
                }
            });
        }
    } catch (error) {
        console.error('❌ Complete session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
    // ============================================
    // REVIEW ROUTES
    // ============================================

    app.post('/api/reviews', async (req, res) => {
        try {
            const { fromUser, toUser, sessionId, swapRequestId, rating, comment, tags } = req.body;
            
            console.log('⭐ Submitting review:', {
                fromUser,
                toUser,
                sessionId,
                rating,
                comment: comment?.substring(0, 30)
            });

            if (!fromUser || !toUser || !rating) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required fields' 
                });
            }

            const fromUserExists = await User.findById(fromUser);
            const toUserExists = await User.findById(toUser);
            
            if (!fromUserExists || !toUserExists) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            const existingReview = await Review.findOne({ 
                fromUser, 
                toUser, 
                $or: [{ sessionId }, { swapRequestId }] 
            });
            
            if (existingReview) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'You have already reviewed this session' 
                });
            }

            if (sessionId) {
                const session = await Session.findById(sessionId);
                if (!session) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Session not found' 
                    });
                }
                if (session.status !== 'completed') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'You can only review completed sessions' 
                    });
                }
            }
            
            const review = new Review({ 
                fromUser, 
                toUser, 
                sessionId, 
                swapRequestId, 
                rating, 
                comment: comment || '', 
                tags: tags || [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await review.save();
            await review.populate('fromUser', 'name email');
            await review.populate('toUser', 'name email');
            if (sessionId) {
                await review.populate('sessionId');
            }
            
            const reviewsToUser = await Review.find({ toUser });
            const avgRating = reviewsToUser.reduce((sum, r) => sum + r.rating, 0) / reviewsToUser.length;
            const reputationScore = Math.round(avgRating * 20);
            
            await User.findByIdAndUpdate(toUser, { 
                reputationScore,
                $inc: { 
                    skillCredits: reviewsToUser.length === 1 ? 5 : 0 
                }
            });
            
            const userReviews = await Review.find({ fromUser });
            if (userReviews.length === 1) {
                await createTransaction(
                    fromUser, 
                    'bonus', 
                    5, 
                    `🎁 Bonus for submitting your first review!`
                );
            }

            if (sessionId) {
                const session = await Session.findById(sessionId).populate('chatId');
                if (session && session.chatId) {
                    const reviewMessage = new Message({
                        chatId: session.chatId._id,
                        senderId: fromUser,
                        content: `⭐ Left a ${rating}-star review for ${toUserExists.name}`,
                        readBy: [fromUser]
                    });
                    await reviewMessage.save();
                }
            }
            
            console.log(`✅ Review submitted: ${rating} stars for user ${toUser}`);
            
            res.json({ 
                success: true, 
                message: 'Review submitted successfully!',
                review 
            });
            
        } catch (error) {
            console.error('❌ Review creation error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    app.get('/api/users/:userId/reviews', async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log(`📊 Fetching reviews for user: ${userId}`);
            
            const reviews = await Review.find({ toUser: userId })
                .populate('fromUser', 'name email')
                .populate('sessionId')
                .populate('swapRequestId')
                .sort({ createdAt: -1 });
            
            const totalReviews = reviews.length;
            const avgRating = totalReviews > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
                : 0;
            
            const ratingDistribution = {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            };
            
            const commonTags = reviews
                .flatMap(r => r.tags || [])
                .reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
            
            const user = await User.findById(userId).select('reputationScore skillCredits');
            
            console.log(`✅ Found ${totalReviews} reviews for user ${userId}`);
            
            res.json({
                success: true,
                reviews,
                stats: {
                    totalReviews,
                    avgRating: Number(avgRating.toFixed(1)),
                    ratingDistribution,
                    commonTags,
                    reputationScore: user?.reputationScore || 0,
                    skillCredits: user?.skillCredits || 0
                }
            });
            
        } catch (error) {
            console.error('❌ Fetch reviews error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    app.get('/api/reviews/all', async (req, res) => {
        try {
            console.log('🌍 Fetching ALL platform reviews...');
            
            const reviews = await Review.find({})
                .populate('fromUser', 'name email')
                .populate('toUser', 'name email')
                .populate('sessionId')
                .populate('swapRequestId')
                .sort({ createdAt: -1 });
            
            console.log(`✅ Found ${reviews.length} total reviews`);
            
            res.json({
                success: true,
                reviews
            });
            
        } catch (error) {
            console.error('❌ Fetch all reviews error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    app.get('/api/users/:userId/given-reviews', async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log(`📤 Fetching reviews given by user: ${userId}`);
            
            const reviews = await Review.find({ fromUser: userId })
                .populate('toUser', 'name email')
                .populate('sessionId')
                .populate('swapRequestId')
                .sort({ createdAt: -1 });
            
            console.log(`✅ Found ${reviews.length} reviews given by user ${userId}`);
            
            res.json({
                success: true,
                reviews
            });
            
        } catch (error) {
            console.error('❌ Fetch given reviews error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    app.get('/api/users/:userId/can-review/:targetUserId', async (req, res) => {
        try {
            const { userId, targetUserId } = req.params;
            const { sessionId, swapRequestId } = req.query;
            
            console.log('\n========== CAN REVIEW DEBUG ==========');
            console.log('1️⃣ Request params:', { userId, targetUserId });
            console.log('2️⃣ Query params:', { sessionId, swapRequestId });
            console.log('========================================\n');

            if (userId === targetUserId) {
                return res.json({ 
                    success: true, 
                    canReview: false, 
                    reason: 'You cannot review yourself' 
                });
            }

            const [fromUserExists, toUserExists] = await Promise.all([
                User.findById(userId),
                User.findById(targetUserId)
            ]);

            if (!fromUserExists) {
                return res.json({ 
                    success: true, 
                    canReview: false, 
                    reason: 'Reviewer user not found' 
                });
            }

            if (!toUserExists) {
                return res.json({ 
                    success: true, 
                    canReview: false, 
                    reason: 'User to review not found' 
                });
            }

            let canReview = false;
            let reason = '';

            if (sessionId) {
                console.log('🔍 Checking session review eligibility...');
                
                const session = await Session.findById(sessionId)
                    .populate('teacherId', 'name email')
                    .populate('learnerId', 'name email');
                
                if (!session) {
                    console.log('❌ Session not found:', sessionId);
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'Session not found' 
                    });
                }

                console.log('📅 Session found:', {
                    id: session._id,
                    skill: session.skill,
                    status: session.status,
                    teacherId: session.teacherId?._id || session.teacherId,
                    learnerId: session.learnerId?._id || session.learnerId
                });

                if (session.status !== 'completed') {
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You can only review completed sessions' 
                    });
                }

                const teacherId = session.teacherId?._id?.toString() || session.teacherId?.toString();
                const learnerId = session.learnerId?._id?.toString() || session.learnerId?.toString();
                
                const isTeacher = teacherId === userId;
                const isLearner = learnerId === userId;
                const isTargetTeacher = teacherId === targetUserId;
                const isTargetLearner = learnerId === targetUserId;
                
                const isValidPair = (isTeacher && isTargetLearner) || (isLearner && isTargetTeacher);
                
                if (!isValidPair) {
                    console.log('❌ Invalid participant pair:', {
                        user: { isTeacher, isLearner },
                        target: { isTargetTeacher, isTargetLearner }
                    });
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You can only review users you completed a session with' 
                    });
                }

                const existingReview = await Review.findOne({
                    fromUser: userId,
                    toUser: targetUserId,
                    sessionId: sessionId
                });

                if (existingReview) {
                    console.log('✅ Already reviewed this session');
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You have already reviewed this session' 
                    });
                }

                console.log('✅ User is eligible to review this session');
                canReview = true;
                reason = '';
            }
            
            else if (swapRequestId) {
                console.log('🔄 Checking swap request review eligibility...');
                
                const swapRequest = await SwapRequest.findById(swapRequestId)
                    .populate('fromUser', 'name email')
                    .populate('toUser', 'name email');
                
                if (!swapRequest) {
                    console.log('❌ Swap request not found:', swapRequestId);
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'Swap request not found' 
                    });
                }

                console.log('📨 Swap request found:', {
                    id: swapRequest._id,
                    status: swapRequest.status,
                    fromUser: swapRequest.fromUser?._id || swapRequest.fromUser,
                    toUser: swapRequest.toUser?._id || swapRequest.toUser
                });

                if (swapRequest.status !== 'accepted') {
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You can only review accepted swaps' 
                    });
                }

                const fromUserId = swapRequest.fromUser?._id?.toString() || swapRequest.fromUser?.toString();
                const toUserId = swapRequest.toUser?._id?.toString() || swapRequest.toUser?.toString();
                
                const isValidPair = (fromUserId === userId && toUserId === targetUserId) ||
                                  (toUserId === userId && fromUserId === targetUserId);

                if (!isValidPair) {
                    console.log('❌ Invalid swap pair');
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You can only review users you swapped with' 
                    });
                }

                const existingReview = await Review.findOne({
                    fromUser: userId,
                    toUser: targetUserId,
                    swapRequestId: swapRequestId
                });

                if (existingReview) {
                    console.log('✅ Already reviewed this swap');
                    return res.json({ 
                        success: true, 
                        canReview: false, 
                        reason: 'You have already reviewed this swap' 
                    });
                }

                console.log('✅ User is eligible to review this swap');
                canReview = true;
                reason = '';
            }
            
            else {
                console.log('❌ No session or swap ID provided');
                return res.json({ 
                    success: true, 
                    canReview: false, 
                    reason: 'No session or swap specified' 
                });
            }

            console.log('📝 Final canReview result:', { canReview, reason });
            
            res.json({ 
                success: true, 
                canReview, 
                reason 
            });
            
        } catch (error) {
            console.error('❌❌❌ Can review check error:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // ============================================
    // ADMIN ROUTES - SKILL MANAGEMENT
    // ============================================

    app.get('/api/admin/skills/all', async (req, res) => {
        try {
            console.log('📊 Fetching all skills for admin...');
            
            const users = await User.find({});
            
            const skillMap = new Map();
            
            users.forEach(user => {
                user.teachSkills?.forEach(skill => {
                    if (!skillMap.has(skill)) {
                        skillMap.set(skill, { name: skill, teachCount: 0, learnCount: 0, count: 0 });
                    }
                    const data = skillMap.get(skill);
                    data.teachCount++;
                    data.count++;
                });
                
                user.learnSkills?.forEach(skill => {
                    if (!skillMap.has(skill)) {
                        skillMap.set(skill, { name: skill, teachCount: 0, learnCount: 0, count: 0 });
                    }
                    const data = skillMap.get(skill);
                    data.learnCount++;
                    data.count++;
                });
            });
            
            const skills = Array.from(skillMap.values()).sort((a, b) => b.count - a.count);
            
            const stats = {
                totalSkills: skills.length,
                mostTaught: skills.sort((a, b) => b.teachCount - a.teachCount)[0]?.name || 'None',
                mostLearned: skills.sort((a, b) => b.learnCount - a.learnCount)[0]?.name || 'None'
            };
            
            console.log(`✅ Found ${skills.length} unique skills`);
            
            res.json({ success: true, skills, stats });
        } catch (error) {
            console.error('❌ Fetch skills error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.post('/api/admin/skills/remove', async (req, res) => {
        try {
            const { skill } = req.body;
            
            if (!skill) {
                return res.status(400).json({ success: false, message: 'Skill name is required' });
            }
            
            console.log(`🗑️ Removing skill "${skill}" from all users...`);
            
            await User.updateMany(
                { teachSkills: skill },
                { $pull: { teachSkills: skill } }
            );
            
            await User.updateMany(
                { learnSkills: skill },
                { $pull: { learnSkills: skill } }
            );
            
            console.log(`✅ Skill "${skill}" removed successfully`);
            
            res.json({ success: true, message: `Skill "${skill}" removed from all users` });
        } catch (error) {
            console.error('❌ Remove skill error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // ADMIN ROUTES - TRANSACTIONS
    // ============================================

    app.get('/api/admin/transactions/all', async (req, res) => {
        try {
            console.log('💰 Fetching all transactions for admin...');
            
            const transactions = await Transaction.find({})
                .populate('userId', 'name email')
                .populate('relatedUser', 'name email')
                .sort({ createdAt: -1 })
                .limit(500);
            
            let totalCredits = 0;
            let totalEarned = 0;
            let totalSpent = 0;
            
            const users = await User.find({});
            users.forEach(user => {
                totalCredits += user.skillCredits || 0;
            });
            
            transactions.forEach(t => {
                if (t.type === 'earned' || t.type === 'bonus') {
                    totalEarned += t.amount;
                } else if (t.type === 'spent') {
                    totalSpent += Math.abs(t.amount);
                }
            });
            
            const formattedTransactions = transactions.map(t => ({
                _id: t._id,
                userName: t.userId?.name || 'Unknown',
                userId: t.userId?._id,
                type: t.type,
                amount: t.amount,
                description: t.description,
                relatedUserName: t.relatedUser?.name || null,
                createdAt: t.createdAt
            }));
            
            console.log(`✅ Found ${transactions.length} transactions`);
            
            res.json({
                success: true,
                transactions: formattedTransactions,
                stats: {
                    totalTransactions: transactions.length,
                    totalCredits,
                    totalEarned,
                    totalSpent
                }
            });
        } catch (error) {
            console.error('❌ Fetch all transactions error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // ADMIN ROUTES - REPORTS
    // ============================================

    app.get('/api/admin/reports', async (req, res) => {
        try {
            const { range } = req.query;
            
            console.log(`📈 Generating reports for range: ${range}`);
            
            const now = new Date();
            let startDate = new Date();
            
            switch(range) {
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    startDate = new Date(0);
            }
            
            console.log(`📅 Date range: ${startDate} to ${now}`);
            
            const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
            const totalUsers = await User.countDocuments();
            
            const newSwaps = await SwapRequest.countDocuments({ createdAt: { $gte: startDate } });
            const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });
            
            const completedSessions = await Session.countDocuments({ 
                status: 'completed',
                createdAt: { $gte: startDate }
            });
            const totalSessions = await Session.countDocuments({ status: 'completed' });
            const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
            
            const users = await User.find({});
            
            const teachSkillMap = new Map();
            const learnSkillMap = new Map();
            const allSkillMap = new Map();
            
            users.forEach(user => {
                user.teachSkills?.forEach(skill => {
                    teachSkillMap.set(skill, (teachSkillMap.get(skill) || 0) + 1);
                    allSkillMap.set(skill, (allSkillMap.get(skill) || 0) + 1);
                });
                
                user.learnSkills?.forEach(skill => {
                    learnSkillMap.set(skill, (learnSkillMap.get(skill) || 0) + 1);
                    allSkillMap.set(skill, (allSkillMap.get(skill) || 0) + 1);
                });
            });
            
            const topTaughtSkills = Array.from(teachSkillMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([skill, count]) => ({ label: skill, value: count }));
            
            const topLearnedSkills = Array.from(learnSkillMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([skill, count]) => ({ label: skill, value: count }));
            
            const topSkills = Array.from(allSkillMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([skill, count]) => ({ label: skill, value: count }));
            
            const mostTaught = topTaughtSkills[0]?.label || 'None';
            const mostLearned = topLearnedSkills[0]?.label || 'None';
            
            const allReviews = await Review.find({})
                .populate('fromUser', 'name')
                .populate('toUser', 'name');
            
            const totalReviews = allReviews.length;
            
            const reviewsInRange = await Review.find({ 
                createdAt: { $gte: startDate } 
            });
            const newReviews = reviewsInRange.length;
            
            const avgRating = totalReviews > 0 
                ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                : '0.0';
            
            const ratingCounts = {
                5: allReviews.filter(r => r.rating === 5).length,
                4: allReviews.filter(r => r.rating === 4).length,
                3: allReviews.filter(r => r.rating === 3).length,
                2: allReviews.filter(r => r.rating === 2).length,
                1: allReviews.filter(r => r.rating === 1).length
            };
            
            console.log(`⭐ Review stats - Total: ${totalReviews}, New: ${newReviews}, Avg: ${avgRating}`);
            
            let totalEarned = 0;
            let totalSpent = 0;
            
            const transactions = await Transaction.find({});
            transactions.forEach(t => {
                if (t.type === 'earned' || t.type === 'bonus') {
                    totalEarned += t.amount;
                } else if (t.type === 'spent') {
                    totalSpent += Math.abs(t.amount);
                }
            });
            
            const userGrowth = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);
                
                const count = await User.countDocuments({
                    createdAt: { $gte: date, $lt: nextDate }
                });
                
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                userGrowth.push({
                    label: days[date.getDay()],
                    value: count
                });
            }
            
            const sessionData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);
                
                const count = await Session.countDocuments({
                    status: 'completed',
                    createdAt: { $gte: date, $lt: nextDate }
                });
                
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                sessionData.push({
                    label: days[date.getDay()],
                    value: count
                });
            }
            
            res.json({
                success: true,
                newUsers,
                totalUsers,
                newSwaps,
                pendingSwaps,
                completedSessions,
                totalSessions,
                completionRate,
                totalReviews,
                newReviews,
                avgRating,
                totalEarned,
                totalSpent,
                mostTaught,
                mostLearned,
                userGrowth,
                sessionData,
                creditFlow: [
                    { label: 'Earned', value: totalEarned },
                    { label: 'Spent', value: totalSpent }
                ],
                popularSkills: topSkills,
                topTaughtSkills,
                topLearnedSkills,
                ratingDistribution: [
                    { label: '5 Stars', value: ratingCounts[5] },
                    { label: '4 Stars', value: ratingCounts[4] },
                    { label: '3 Stars', value: ratingCounts[3] },
                    { label: '2 Stars', value: ratingCounts[2] },
                    { label: '1 Star', value: ratingCounts[1] }
                ]
            });
            
        } catch (error) {
            console.error('❌ Generate reports error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // ADMIN ROUTES - SETTINGS
    // ============================================

    let systemSettings = {
        creditPerSession: 10,
        maxSessionsPerSkill: 20,
        minReputationForAdmin: 50,
        enableReviews: true,
        enableChat: true,
        maintenanceMode: false,
        sessionDurationMin: 30,
        sessionDurationMax: 120,
        creditBonusFirstReview: 5
    };

    app.get('/api/admin/settings', async (req, res) => {
        try {
            console.log('⚙️ Fetching system settings');
            res.json({ success: true, settings: systemSettings });
        } catch (error) {
            console.error('❌ Fetch settings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.put('/api/admin/settings', async (req, res) => {
        try {
            const newSettings = req.body;
            console.log('⚙️ Updating system settings:', newSettings);
            
            if (newSettings.creditPerSession < 1) {
                return res.status(400).json({ success: false, message: 'Credit per session must be at least 1' });
            }
            
            systemSettings = { ...systemSettings, ...newSettings };
            
            console.log('✅ Settings updated successfully');
            res.json({ success: true, message: 'Settings updated successfully', settings: systemSettings });
        } catch (error) {
            console.error('❌ Update settings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // ADMIN ROUTES - USERS (EXISTING)
    // ============================================

    app.get('/api/admin/users', async (req, res) => {
        try {
            console.log('📊 Admin users endpoint hit');
            
            const users = await User.find({}).select('-password');
            console.log('✅ Admin users fetched:', users.length);
            
            res.json({ success: true, count: users.length, users });
        } catch (error) {
            console.error('❌ Admin users error:', error);
            res.status(500).json({ success: false, message: 'Error fetching users' });
        }
    });

    app.put('/api/admin/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { role, skillCredits, reputationScore } = req.body;

            console.log('✏️ Admin updating user:', id);

            const updateData = {};
            if (role) updateData.role = role;
            if (skillCredits !== undefined) updateData.skillCredits = skillCredits;
            if (reputationScore !== undefined) updateData.reputationScore = reputationScore;

            const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
            if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });
            
            console.log(`✅ User updated: ${updatedUser.email}`);
            
            res.json({ success: true, message: 'User updated successfully', user: updatedUser });
        } catch (error) {
            console.error('❌ Update user error:', error);
            res.status(500).json({ success: false, message: 'Error updating user' });
        }
    });

    app.delete('/api/admin/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { currentUserId } = req.body;

            console.log('🗑️ Admin deleting user:', id);

            if (id === currentUserId) {
                console.log('❌ Cannot delete own account');
                return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
            }

            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) return res.status(404).json({ success: false, message: 'User not found' });

            await SwapRequest.deleteMany({ $or: [{ fromUser: id }, { toUser: id }] });

            console.log(`✅ User deleted: ${deletedUser.email}`);
            
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('❌ Delete user error:', error);
            res.status(500).json({ success: false, message: 'Error deleting user' });
        }
    });

    app.put('/api/admin/users/:id/skills', async (req, res) => {
        try {
            const { id } = req.params;
            const { teachSkills, learnSkills } = req.body;

            console.log('🎯 Admin updating user skills:', id);

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { teachSkills: teachSkills || [], learnSkills: learnSkills || [] },
                { new: true }
            ).select('-password');

            if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });
            
            console.log(`✅ User skills updated: ${updatedUser.email}`);
            
            res.json({ success: true, message: 'User skills updated successfully', user: updatedUser });
        } catch (error) {
            console.error('❌ Update user skills error:', error);
            res.status(500).json({ success: false, message: 'Error updating user skills' });
        }
    });

    app.get('/api/admin/stats', async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const adminUsers = await User.countDocuments({ role: 'admin' });
            const regularUsers = await User.countDocuments({ role: 'user' });
            const activeUsers = await User.countDocuments({
                $or: [
                    { teachSkills: { $exists: true, $not: { $size: 0 } } },
                    { learnSkills: { $exists: true, $not: { $size: 0 } } }
                ]
            });

            const totalSwapRequests = await SwapRequest.countDocuments();
            const pendingRequests = await SwapRequest.countDocuments({ status: 'pending' });
            const acceptedRequests = await SwapRequest.countDocuments({ status: 'accepted' });
            const rejectedRequests = await SwapRequest.countDocuments({ status: 'rejected' });

            const totalChats = await Chat.countDocuments();
            const totalMessages = await Message.countDocuments();
            const totalSessions = await Session.countDocuments();
            const totalReviews = await Review.countDocuments();
            const totalSkillProgress = await SkillProgress.countDocuments();

            console.log('📊 Admin stats fetched');

            res.json({
                success: true,
                stats: {
                    totalUsers, adminUsers, regularUsers, activeUsers,
                    totalSwapRequests, pendingRequests, acceptedRequests, rejectedRequests,
                    totalChats, totalMessages, totalSessions, totalReviews, totalSkillProgress,
                    platformHealth: 'excellent',
                    database: 'MongoDB Atlas',
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Admin stats error:', error);
            res.status(500).json({ success: false, message: 'Error fetching platform stats' });
        }
    });

    // ============================================
    // CATCH-ALL ROUTE
    // ============================================

    app.use('*', (req, res) => {
        console.log('❌ Route not found:', req.method, req.originalUrl);
        res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
    });

    // ============================================
    // START SERVER
    // ============================================

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 MongoDB: Connected to Atlas`);
        createDefaultAdmin();
        console.log(`✅ COMPLETE SYSTEM READY`);
        console.log(`\n📚 API Endpoints:`);
        console.log(`   🔐 Auth: POST /api/register, POST /api/login`);
        console.log(`   🔑 Password: PUT /api/admin/users/:id/password (admin reset)`);
        console.log(`   🔑 Password: PUT /api/users/:id/change-password (user change)`);
        console.log(`   👥 Users: GET /api/users, PUT /api/users/:id/skills`);
        console.log(`   🤝 Matching: GET /api/matching/users, POST /api/matching/request`);
        console.log(`   🔄 Swap: GET /api/users/:userId/swap-requests, PUT /api/swap-requests/:requestId`);
        console.log(`   💰 Credits: GET /api/users/:userId/transactions, GET /api/users/:userId/credit-stats`);
        console.log(`   💬 Chat: GET /api/users/:userId/chats, POST /api/chats, GET /api/chats/:chatId/messages, POST /api/chats/:chatId/messages`);
        console.log(`   📅 Sessions: POST /api/sessions, GET /api/users/:userId/sessions, PUT /api/sessions/:sessionId/complete`);
        console.log(`   📊 Progress: GET /api/skill-progress/check, GET /api/skill-progress/:swapRequestId`);
        console.log(`   🔗 Meeting Link: https://meet.google.com/new`);
        console.log(`   ⭐ Reviews: POST /api/reviews, GET /api/users/:userId/reviews, GET /api/reviews/all, GET /api/users/:userId/given-reviews, GET /api/users/:userId/can-review/:targetUserId`);
        console.log(`   👑 Admin: GET /api/admin/users, GET /api/admin/stats, PUT /api/admin/users/:id, DELETE /api/admin/users/:id, PUT /api/admin/users/:id/skills, GET /api/admin/skills/all, POST /api/admin/skills/remove, GET /api/admin/transactions/all, GET /api/admin/reports, GET /api/admin/settings, PUT /api/admin/settings`);
    });
}