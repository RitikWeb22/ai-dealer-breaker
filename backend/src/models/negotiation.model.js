import mongoose from 'mongoose';

const NegotiationSchema = new mongoose.Schema({
    userId: {
        type: String, // 👈 Change this to String to accept "anonymous"
        required: true
    },
    username: { type: String, required: true },
    items: [String], // ✅ Controller mein split(", ") use karke array bhejna
    totalMsrp: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    floorPrice: { type: Number, required: true },
    efficiencyScore: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

NegotiationSchema.index({ efficiencyScore: -1 });

const negotiationModel = mongoose.model('negotiation', NegotiationSchema);
export default negotiationModel;