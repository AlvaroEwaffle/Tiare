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
exports.SearchService = void 0;
const models_1 = require("../models");
class SearchService {
    /**
     * Search user by phone number
     * Returns doctor or patient information if found
     */
    static searchByPhoneNumber(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Clean phone number (remove spaces, dashes, parentheses, plus sign)
                const cleanPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
                // Search in doctors first
                const doctor = yield models_1.Doctor.findOne({
                    phone: { $regex: cleanPhone, $options: 'i' },
                    isActive: true
                });
                if (doctor) {
                    return {
                        type: 'doctor',
                        user: {
                            id: doctor.id,
                            name: doctor.name,
                            phone: doctor.phone,
                            email: doctor.email,
                            specialization: doctor.specialization,
                            licenseNumber: doctor.licenseNumber,
                            address: doctor.address,
                            isActive: doctor.isActive,
                            createdAt: doctor.createdAt,
                            updatedAt: doctor.updatedAt
                        }
                    };
                }
                // Search in patients if not found in doctors
                const patient = yield models_1.Patient.findOne({
                    phone: { $regex: cleanPhone, $options: 'i' },
                    isActive: true
                });
                if (patient) {
                    return {
                        type: 'patient',
                        user: {
                            id: patient.id,
                            name: patient.name,
                            phone: patient.phone,
                            email: patient.email,
                            doctorId: patient.doctorId,
                            dateOfBirth: patient.dateOfBirth,
                            gender: patient.gender,
                            address: patient.address,
                            emergencyContact: patient.emergencyContact,
                            medicalHistory: patient.medicalHistory,
                            communicationPreferences: patient.communicationPreferences,
                            isActive: patient.isActive,
                            createdAt: patient.createdAt,
                            updatedAt: patient.updatedAt
                        }
                    };
                }
                return null;
            }
            catch (error) {
                throw new Error(`Failed to search by phone number: ${error}`);
            }
        });
    }
    /**
     * Search multiple users by partial phone number
     * Returns array of matching doctors and patients
     */
    static searchByPartialPhone(partialPhone_1) {
        return __awaiter(this, arguments, void 0, function* (partialPhone, limit = 10) {
            try {
                const cleanPartialPhone = partialPhone.replace(/[\s\-\(\)\+]/g, '');
                const results = [];
                // Search doctors
                const doctors = yield models_1.Doctor.find({
                    phone: { $regex: cleanPartialPhone, $options: 'i' },
                    isActive: true
                }).limit(limit);
                for (const doctor of doctors) {
                    results.push({
                        type: 'doctor',
                        user: {
                            id: doctor.id,
                            name: doctor.name,
                            phone: doctor.phone,
                            email: doctor.email,
                            specialization: doctor.specialization,
                            licenseNumber: doctor.licenseNumber,
                            address: doctor.address,
                            isActive: doctor.isActive,
                            createdAt: doctor.createdAt,
                            updatedAt: doctor.updatedAt
                        }
                    });
                }
                // Search patients (remaining limit)
                const remainingLimit = limit - results.length;
                if (remainingLimit > 0) {
                    const patients = yield models_1.Patient.find({
                        phone: { $regex: cleanPartialPhone, $options: 'i' },
                        isActive: true
                    }).limit(remainingLimit);
                    for (const patient of patients) {
                        results.push({
                            type: 'patient',
                            user: {
                                id: patient.id,
                                name: patient.name,
                                phone: patient.phone,
                                email: patient.email,
                                doctorId: patient.doctorId,
                                dateOfBirth: patient.dateOfBirth,
                                gender: patient.gender,
                                address: patient.address,
                                emergencyContact: patient.emergencyContact,
                                medicalHistory: patient.medicalHistory,
                                communicationPreferences: patient.communicationPreferences,
                                isActive: patient.isActive,
                                createdAt: patient.createdAt,
                                updatedAt: patient.updatedAt
                            }
                        });
                    }
                }
                return results;
            }
            catch (error) {
                throw new Error(`Failed to search by partial phone: ${error}`);
            }
        });
    }
}
exports.SearchService = SearchService;
