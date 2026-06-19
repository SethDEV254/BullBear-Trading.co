const mongoose = require('mongoose');

const checklistLeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    enum: ['index', 'checklist-page', 'checklist-signup-page'],
    default: 'index',
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

checklistLeadSchema.index({ email: 1 });

module.exports = mongoose.model('ChecklistLead', checklistLeadSchema);
