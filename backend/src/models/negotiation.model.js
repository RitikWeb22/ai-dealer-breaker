import mongoose from 'mongoose';


const NegotiationSchema = new mongoose.Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    username: String,
    item: [String],
    totalMsrp: Number,
    finalPrice: Number,
    floorPrice: Number,
    efficiencyScore: Number,
    createdAt: { type: Date, default: Date.now }

})

const negotiationModel = mongoose.model('negotiation', NegotiationSchema);

export default negotiationModel;