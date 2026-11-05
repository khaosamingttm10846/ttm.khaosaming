import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Traditional Thai Medicine Service Records
export const serviceRecords = pgTable('service_records', {
  id: text('id').primaryKey(),
  hn: text('hn').notNull(),
  patientName: text('patient_name').notNull(),
  gender: text('gender').notNull(),
  age: integer('age').notNull(),
  ageGroup: text('age_group'),
  serviceDate: text('service_date').notNull(), // YYYY-MM-DD
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  coverageType: text('coverage_type').notNull(),
  procedureType: text('procedure_type').notNull(),
  diagnosis: text('diagnosis'),
  practitionerName: text('practitioner_name'),
  fee: integer('fee').default(0),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Financial Income & Expense Records
export const financialRecords = pgTable('financial_records', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  category: text('category').notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  referenceNo: text('reference_no'),
  payerPayee: text('payer_payee'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Clinic Events & Activities
export const clinicEvents = pgTable('clinic_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  category: text('category').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  location: text('location'),
  practitioner: text('practitioner'),
  targetPatients: integer('target_patients'),
  notes: text('notes'),
  color: text('color'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});
