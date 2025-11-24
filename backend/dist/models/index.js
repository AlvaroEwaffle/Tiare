"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLog = exports.Billing = exports.Appointment = exports.Patient = exports.Doctor = void 0;
// Export all models
var doctor_model_1 = require("./doctor.model");
Object.defineProperty(exports, "Doctor", { enumerable: true, get: function () { return doctor_model_1.Doctor; } });
var patient_model_1 = require("./patient.model");
Object.defineProperty(exports, "Patient", { enumerable: true, get: function () { return patient_model_1.Patient; } });
var appointment_model_1 = require("./appointment.model");
Object.defineProperty(exports, "Appointment", { enumerable: true, get: function () { return appointment_model_1.Appointment; } });
var billing_model_1 = require("./billing.model");
Object.defineProperty(exports, "Billing", { enumerable: true, get: function () { return billing_model_1.Billing; } });
var eventLog_model_1 = require("./eventLog.model");
Object.defineProperty(exports, "EventLog", { enumerable: true, get: function () { return eventLog_model_1.EventLog; } });
