const registrationFormService = require('../../services/registrationFormService');

const listForms = async (req, res, next) => {
  try {
    const forms = await registrationFormService.listForms();
    res.status(200).json({ success: true, data: { forms } });
  } catch (error) {
    next(error);
  }
};

const createForm = async (req, res, next) => {
  try {
    const { title, description, fields, closedMessage, emailNotification } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Form title is required' });
    }
    const form = await registrationFormService.createForm({ title, description, fields, closedMessage, emailNotification });
    res.status(201).json({ success: true, data: { form }, message: 'Form created successfully' });
  } catch (error) {
    next(error);
  }
};

const getForm = async (req, res, next) => {
  try {
    const form = await registrationFormService.getFormById(req.params.id);
    res.status(200).json({ success: true, data: { form } });
  } catch (error) {
    next(error);
  }
};

const updateForm = async (req, res, next) => {
  try {
    const form = await registrationFormService.updateForm(req.params.id, req.body);
    res.status(200).json({ success: true, data: { form }, message: 'Form updated successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleForm = async (req, res, next) => {
  try {
    const form = await registrationFormService.toggleForm(req.params.id);
    res.status(200).json({
      success: true,
      data: { form },
      message: `Form ${form.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const deleteForm = async (req, res, next) => {
  try {
    await registrationFormService.deleteForm(req.params.id);
    res.status(200).json({ success: true, message: 'Form and all submissions deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await registrationFormService.getSubmissions(req.params.id, { page, limit });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { listForms, createForm, getForm, updateForm, toggleForm, deleteForm, getSubmissions };
