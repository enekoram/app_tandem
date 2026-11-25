import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';

/** Token de Expo Push de un dispositivo (doc 02 · device_tokens). */
@Schema({ collection: 'device_tokens' })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  expo_push_token!: string;

  @Prop({ type: String, enum: ['ios', 'android'], required: true })
  platform!: 'ios' | 'android';

  @Prop({ required: true, default: () => new Date() })
  last_seen_at!: Date;
}

export type DeviceTokenDocument = HydratedDocument<DeviceToken>;
export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
