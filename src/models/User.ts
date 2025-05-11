import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  hubspotAccessToken?: string;
  hubspotRefreshToken?: string;
  hubspotExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  hubspotAccessToken: String,
  hubspotRefreshToken: String,
  hubspotExpiresAt: Date,
});

export default mongoose.model<IUser>('User', UserSchema);
