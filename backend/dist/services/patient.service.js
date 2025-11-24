"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const uuid_1 = require("uuid");
const models_1 = require("../models");
class PatientService {
    /**
     * Create a new patient
     */
    static createPatient(patientData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify doctor exists
                const doctor = yield models_1.Doctor.findOne({ id: patientData.doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                // Check if patient already exists with same phone for this doctor
                const existingPatient = yield models_1.Patient.findOne({
                    doctorId: patientData.doctorId,
                    phone: patientData.phone,
                    isActive: true
                });
                if (existingPatient) {
                    throw new Error('Patient with this phone number already exists for this doctor');
                }
                // Create patient
                const patient = new models_1.Patient(Object.assign({ id: (0, uuid_1.v4)() }, patientData));
                yield patient.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'patient',
                    action: 'patient_created',
                    userId: patientData.doctorId,
                    userType: 'doctor',
                    resourceId: patient.id,
                    resourceType: 'patient',
                    details: { name: patient.name, phone: patient.phone }
                });
                return {
                    id: patient.id,
                    doctorId: patient.doctorId,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    address: patient.address,
                    emergencyContact: patient.emergencyContact,
                    medicalHistory: patient.medicalHistory,
                    communicationPreferences: patient.communicationPreferences,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to create patient: ${error}`);
            }
        });
    }
    /**
     * Get patient by ID
     */
    static getPatientById(patientId, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: true });
                if (!patient)
                    return null;
                return {
                    id: patient.id,
                    doctorId: patient.doctorId,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    address: patient.address,
                    emergencyContact: patient.emergencyContact,
                    medicalHistory: patient.medicalHistory,
                    communicationPreferences: patient.communicationPreferences,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to get patient: ${error}`);
            }
        });
    }
    /**
     * Get patient by phone number
     */
    static getPatientByPhone(phone, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ phone, doctorId, isActive: true });
                if (!patient)
                    return null;
                return {
                    id: patient.id,
                    doctorId: patient.doctorId,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    address: patient.address,
                    emergencyContact: patient.emergencyContact,
                    medicalHistory: patient.medicalHistory,
                    communicationPreferences: patient.communicationPreferences,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to get patient by phone: ${error}`);
            }
        });
    }
    /**
     * Get all patients for a doctor
     */
    static getPatientsByDoctor(doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, page = 1, limit = 20) {
            try {
                const skip = (page - 1) * limit;
                const [patients, total] = yield Promise.all([
                    models_1.Patient.find({ doctorId, isActive: true })
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Patient.countDocuments({ doctorId, isActive: true })
                ]);
                const totalPages = Math.ceil(total / limit);
                return {
                    patients: patients.map(patient => ({
                        id: patient.id,
                        doctorId: patient.doctorId,
                        name: patient.name,
                        phone: patient.phone,
                        email: patient.email,
                        dateOfBirth: patient.dateOfBirth,
                        gender: patient.gender,
                        address: patient.address,
                        emergencyContact: patient.emergencyContact,
                        medicalHistory: patient.medicalHistory,
                        communicationPreferences: patient.communicationPreferences,
                        isActive: patient.isActive,
                        createdAt: patient.createdAt,
                        updatedAt: patient.updatedAt
                    })),
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get patients: ${error}`);
            }
        });
    }
    /**
     * Search patients by name or phone
     */
    static searchPatients(doctorId_1, searchTerm_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, searchTerm, page = 1, limit = 20) {
            try {
                const skip = (page - 1) * limit;
                const searchQuery = {
                    doctorId,
                    isActive: true,
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { phone: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } }
                    ]
                };
                const [patients, total] = yield Promise.all([
                    models_1.Patient.find(searchQuery)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Patient.countDocuments(searchQuery)
                ]);
                const totalPages = Math.ceil(total / limit);
                return {
                    patients: patients.map(patient => ({
                        id: patient.id,
                        doctorId: patient.doctorId,
                        name: patient.name,
                        phone: patient.phone,
                        email: patient.email,
                        dateOfBirth: patient.dateOfBirth,
                        gender: patient.gender,
                        address: patient.address,
                        emergencyContact: patient.emergencyContact,
                        medicalHistory: patient.medicalHistory,
                        communicationPreferences: patient.communicationPreferences,
                        isActive: patient.isActive,
                        createdAt: patient.createdAt,
                        updatedAt: patient.updatedAt
                    })),
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to search patients: ${error}`);
            }
        });
    }
    /**
     * Update patient profile
     */
    static updatePatient(patientId, doctorId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: true });
                if (!patient) {
                    throw new Error('Patient not found');
                }
                // Update basic fields
                if (updateData.name)
                    patient.name = updateData.name;
                if (updateData.phone)
                    patient.phone = updateData.phone;
                if (updateData.email !== undefined)
                    patient.email = updateData.email;
                if (updateData.dateOfBirth !== undefined)
                    patient.dateOfBirth = updateData.dateOfBirth;
                if (updateData.gender !== undefined)
                    patient.gender = updateData.gender;
                if (updateData.address !== undefined)
                    patient.address = updateData.address;
                // Update emergency contact
                if (updateData.emergencyContact) {
                    patient.emergencyContact = updateData.emergencyContact;
                }
                // Update communication preferences
                if (updateData.communicationPreferences) {
                    if (updateData.communicationPreferences.preferredLanguage !== undefined) {
                        patient.communicationPreferences.preferredLanguage = updateData.communicationPreferences.preferredLanguage;
                    }
                    if (updateData.communicationPreferences.whatsappEnabled !== undefined) {
                        patient.communicationPreferences.whatsappEnabled = updateData.communicationPreferences.whatsappEnabled;
                    }
                    if (updateData.communicationPreferences.emailEnabled !== undefined) {
                        patient.communicationPreferences.emailEnabled = updateData.communicationPreferences.emailEnabled;
                    }
                    if (updateData.communicationPreferences.smsEnabled !== undefined) {
                        patient.communicationPreferences.smsEnabled = updateData.communicationPreferences.smsEnabled;
                    }
                    if (updateData.communicationPreferences.reminderPreferences) {
                        Object.assign(patient.communicationPreferences.reminderPreferences, updateData.communicationPreferences.reminderPreferences);
                    }
                }
                yield patient.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'patient',
                    action: 'patient_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: patientId,
                    resourceType: 'patient',
                    details: { updatedFields: Object.keys(updateData) }
                });
                return {
                    id: patient.id,
                    doctorId: patient.doctorId,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    address: patient.address,
                    emergencyContact: patient.emergencyContact,
                    medicalHistory: patient.medicalHistory,
                    communicationPreferences: patient.communicationPreferences,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to update patient: ${error}`);
            }
        });
    }
    /**
     * Add medical note to patient history
     */
    static addMedicalNote(patientId, doctorId, noteData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: true });
                if (!patient) {
                    throw new Error('Patient not found');
                }
                // Add note to medical history
                patient.medicalHistory.push(Object.assign({}, noteData));
                yield patient.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'patient',
                    action: 'medical_note_added',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: patientId,
                    resourceType: 'patient',
                    details: { noteType: noteData.type, date: noteData.date }
                });
                return {
                    id: patient.id,
                    doctorId: patient.doctorId,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    address: patient.address,
                    emergencyContact: patient.emergencyContact,
                    medicalHistory: patient.medicalHistory,
                    communicationPreferences: patient.communicationPreferences,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to add medical note: ${error}`);
            }
        });
    }
    /**
     * Get patient medical history
     */
    static getMedicalHistory(patientId_1, doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (patientId, doctorId, page = 1, limit = 50) {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: true });
                if (!patient) {
                    throw new Error('Patient not found');
                }
                const skip = (page - 1) * limit;
                const notes = patient.medicalHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(skip, skip + limit);
                const total = patient.medicalHistory.length;
                const totalPages = Math.ceil(total / limit);
                return {
                    notes,
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get medical history: ${error}`);
            }
        });
    }
    /**
     * Deactivate patient
     */
    static deactivatePatient(patientId, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: true });
                if (!patient) {
                    throw new Error('Patient not found');
                }
                patient.isActive = false;
                yield patient.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'warning',
                    category: 'patient',
                    action: 'patient_deactivated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: patientId,
                    resourceType: 'patient',
                    details: {}
                });
                return { success: true, message: 'Patient deactivated successfully' };
            }
            catch (error) {
                throw new Error(`Failed to deactivate patient: ${error}`);
            }
        });
    }
    /**
     * Reactivate patient
     */
    static reactivatePatient(patientId, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, doctorId, isActive: false });
                if (!patient) {
                    throw new Error('Patient not found or already active');
                }
                patient.isActive = true;
                yield patient.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'patient',
                    action: 'patient_reactivated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: patientId,
                    resourceType: 'patient',
                    details: {}
                });
                return { success: true, message: 'Patient reactivated successfully' };
            }
            catch (error) {
                throw new Error(`Failed to reactivate patient: ${error}`);
            }
        });
    }
    /**
     * Get patient statistics
     */
    static getPatientStatistics(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const [totalPatients, activePatients, newPatientsThisMonth, patientsByGender] = yield Promise.all([
                    models_1.Patient.countDocuments({ doctorId }),
                    models_1.Patient.countDocuments({ doctorId, isActive: true }),
                    models_1.Patient.countDocuments({
                        doctorId,
                        createdAt: { $gte: startOfMonth }
                    }),
                    models_1.Patient.aggregate([
                        { $match: { doctorId, isActive: true } },
                        { $group: { _id: '$gender', count: { $sum: 1 } } }
                    ])
                ]);
                const genderStats = {};
                patientsByGender.forEach((item) => {
                    genderStats[item._id || 'unknown'] = item.count;
                });
                return {
                    totalPatients,
                    activePatients,
                    newPatientsThisMonth,
                    patientsByGender: genderStats
                };
            }
            catch (error) {
                throw new Error(`Failed to get patient statistics: ${error}`);
            }
        });
    }
    /**
     * Find doctor by phone number
     */
    static findDoctorByPhone(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Clean phone number (remove spaces, dashes, plus sign)
                const cleanPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
                const doctor = yield models_1.Doctor.findOne({
                    phone: { $regex: cleanPhone, $options: 'i' },
                    isActive: true
                });
                if (!doctor) {
                    return null;
                }
                return {
                    id: doctor.id,
                    name: doctor.name,
                    phone: doctor.phone,
                    email: doctor.email,
                    specialization: doctor.specialization,
                    licenseNumber: doctor.licenseNumber
                };
            }
            catch (error) {
                throw new Error(`Failed to find doctor by phone: ${error}`);
            }
        });
    }
}
exports.PatientService = PatientService;
