import mongoose from 'mongoose';

const NegotiationSchema = new mongoose.Schema({
    userId: {
        // Mixed type taaki ObjectId aur "anonymous" string dono accept ho sakein
        type: mongoose.Schema.Types.Mixed,
        required: true,
        index: true // Searching fast karne ke liye index zaroori hai
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    items: {
        type: [String], // Array format for better data structure
        default: ["Negotiated Items"]
    },
    totalMsrp: {
        type: Number,
        required: true,
        min: 0
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    floorPrice: {
        type: Number,
        required: true,
        min: 0
    },
    efficiencyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100 // Bargaining efficiency percentage mein hoti hai
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // updatedAt automatically manage hoga
});

// ✅ Optimized Indexes for Leaderboard performance
NegotiationSchema.index({ efficiencyScore: -1, createdAt: -1 });
NegotiationSchema.index({ userId: 1 });

const negotiationModel = mongoose.model('negotiation', NegotiationSchema);
export default negotiationModel;