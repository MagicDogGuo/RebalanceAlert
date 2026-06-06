import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const holdingSchema = new Schema(
  {
    shares: { type: Number, required: true },
    costPerShare: { type: Number, required: true },
  },
  { _id: false },
);

const portfolioHoldingsSchema = new Schema(
  {
    profileId: { type: String, required: true, unique: true, index: true },
    holdings: {
      '0050': { type: holdingSchema, required: true },
      '00631L': { type: holdingSchema, required: true },
    },
  },
  { timestamps: true },
);

export type PortfolioHoldingsDocument = InferSchemaType<typeof portfolioHoldingsSchema>;

export const PortfolioHoldingsModel =
  mongoose.models.PortfolioHoldings ??
  mongoose.model('PortfolioHoldings', portfolioHoldingsSchema);
