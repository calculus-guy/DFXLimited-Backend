const registrationFormService = require('../services/registrationFormService');

const getForm = async (req, res, next) => {
  try {
    const form = await registrationFormService.getPublicForm(req.params.slug);
    res.status(200).json({ success: true, data: { form } });
  } catch (error) {
    next(error);
  }
};

const submitForm = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const submission = await registrationFormService.submitForm(req.params.slug, req.body, ip);
    res.status(201).json({ success: true, data: { submission }, message: 'Submission received successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getForm, submitForm };
