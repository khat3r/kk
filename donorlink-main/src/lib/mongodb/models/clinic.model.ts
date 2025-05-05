// // // src/lib/mongodb/models/clinic.model.ts
// // import mongoose, { Schema, Document, models, model } from 'mongoose';

// // export interface IClinic extends Document {
// //   name: string;
// //   latitude: number;
// //   longitude: number;
// //   email: string;
// //   phone: string;
// //   licenseNumber: string;
// //   password: string;
// //   createdAt: Date;
// //   updatedAt: Date;
// // }

// // const ClinicSchema: Schema = new Schema(
// //   {
// //     name: { type: String, required: true },
// //     latitude: { type: Number, required: true },
// //     longitude: { type: Number, required: true },
// //     email: { type: String, required: true, unique: true },
// //     phone: { type: String, required: true },
// //     licenseNumber: { type: String, required: true, unique: true },
// //     password: { type: String, required: true },
// //   },
// //   { timestamps: true }
// // );

// // // Use a different pattern to check for existing models that works in server components
// // const Clinic = models.Clinic || model<IClinic>('Clinic', ClinicSchema);

// // export default Clinic;


// // src/lib/mongodb/models/clinic.model.ts

// import mongoose, { Schema, Document } from 'mongoose';
// import bcrypt from 'bcrypt';

// export interface IClinic extends Document {
//   name: string;
//   email: string;
//   password: string;
//   licenseNumber: string;
//   location: {
//     type: string;
//     coordinates: [number, number]; // [longitude, latitude]
//   };
//   address: string;
//   phoneNumber: string;
//   createdAt: Date;
//   updatedAt: Date;
//   comparePassword(candidatePassword: string): Promise<boolean>;
// }

// const ClinicSchema = new Schema<IClinic>(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     licenseNumber: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     location: {
//       type: {
//         type: String,
//         enum: ['Point'],
//         default: 'Point',
//       },
//       coordinates: {
//         type: [Number], // [longitude, latitude]
//         required: true,
//       },
//     },
//     address: {
//       type: String,
//       required: true,
//     },
//     phoneNumber: {
//       type: String,
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Create a geospatial index for location-based queries
// ClinicSchema.index({ location: '2dsphere' });

// // Password comparison method
// ClinicSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Hash password before saving
// ClinicSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error: any) {
//     next(error);
//   }
// });

// // Prevent duplicate model creation during hot reloading
// const Clinic = mongoose.models.Clinic as mongoose.Model<IClinic> || 
//   mongoose.model<IClinic>('Clinic', ClinicSchema);

// export default Clinic;



import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IClinic extends Document {
  name: string;
  email: string;
  password: string;
  licenseNumber: string;
  location: {
    type: string;
    coordinates: [number, number]; // [latitude, longitude]
  };
  address: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ClinicSchema = new Schema<IClinic>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index for location-based queries
ClinicSchema.index({ location: '2dsphere' });

// Password comparison method
ClinicSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
ClinicSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Prevent duplicate model creation during hot reloading
const Clinic = mongoose.models.Clinic as mongoose.Model<IClinic> || 
  mongoose.model<IClinic>('Clinic', ClinicSchema);

export default Clinic;