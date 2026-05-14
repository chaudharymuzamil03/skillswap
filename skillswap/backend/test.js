import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://chaudharymuzamil03_db_user:BNE5t6QiwqYnKtUG@cluster0.fiou20r.mongodb.net/skillswap?retryWrites=true&w=majority';

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully!');
        process.exit(0);
    } catch (error) {
        console.log('❌ MongoDB Connection Failed:');
        console.log(error.message);
        process.exit(1);
    }
}

testConnection();