import mongoose from 'mongoose';

const NegotiationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: false },
    callId: { type: String, unique: true },
    username: {
        type: String,
        required: true,
        trim: true
    },
    items: {
        type: [String],
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
        max: 100
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
    timestamps: true
});

// ✅ Ye kaafi hai! Isme userId aur efficiencyScore dono cover ho rahe hain.
NegotiationSchema.index({ efficiencyScore: -1, createdAt: -1 });
NegotiationSchema.index({ userId: 1 });

const negotiationModel = mongoose.model('negotiation', NegotiationSchema);
export default negotiationModel;