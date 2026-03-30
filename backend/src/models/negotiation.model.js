import mongoose from 'mongoose';

const NegotiationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    username: { type: String, required: true },
    items: [String],
    totalMsrp: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    floorPrice: { type: Number, required: true },
    efficiencyScore: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Indexing for Leaderboard Performance
NegotiationSchema.index({ efficiencyScore: -1 });

const negotiationModel = mongoose.model('negotiation', NegotiationSchema);

export default negotiationModel;