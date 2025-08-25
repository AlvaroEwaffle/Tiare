import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarOAuth extends Document {
  doctorId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  scope: string;
  tokenType: string;
  calendarId?: string;
  calendarName?: string;
  lastSync?: Date;
  nextSync?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const calendarOAuthSchema = new Schema<ICalendarOAuth>({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  scope: {
    type: String,
    required: true,
    default: 'https://www.googleapis.com/auth/calendar'
  },
  tokenType: {
    type: String,
    required: true,
    default: 'Bearer'
  },
  calendarId: {
    type: String,
    required: false
  },
  calendarName: {
    type: String,
    required: false
  },
  lastSync: {
    type: Date,
    required: false
  },
  nextSync: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true,
  collection: 'doctors'
});

// Crear un subdocumento para el calendario OAuth
const calendarOAuthSubSchema = new Schema({
  calendar: {
    oauth: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Date,
      scope: {
        type: String,
        default: 'https://www.googleapis.com/auth/calendar'
      },
      tokenType: {
        type: String,
        default: 'Bearer'
      },
      calendarId: String,
      calendarName: String,
      lastSync: Date,
      nextSync: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }
  }
});

// Agregar el subdocumento al schema del doctor
const doctorSchema = mongoose.models.Doctor?.schema;
if (doctorSchema) {
  doctorSchema.add(calendarOAuthSubSchema);
}

export const CalendarOAuth = mongoose.model<ICalendarOAuth>('CalendarOAuth', calendarOAuthSchema);

export default CalendarOAuth;
