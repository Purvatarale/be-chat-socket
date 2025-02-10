const mongoose = require('mongoose');

const sourceInboxMapSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    sourceId: {
        type: String,
        required: true
    },
    inboxId: {
        type: String,
        required: true
    },
    pubSubToken: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('SourceInboxMap', sourceInboxMapSchema);