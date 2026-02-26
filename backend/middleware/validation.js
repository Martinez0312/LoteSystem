// backend/middleware/validation.js
// Middleware de validación con express-validator

const { body, param, validationResult } = require('express-validator');

// Manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Errores de validación',
            errors: errors.array() 
        });
    }
    next();
};

// Validaciones para registro de usuario
const validateRegister = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
    body('apellido').trim().notEmpty().withMessage('El apellido es requerido').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe tener mayúsculas, minúsculas y números'),
    body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
    body('cedula').optional().trim().notEmpty(),
    handleValidationErrors
];

// Validaciones para login
const validateLogin = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    handleValidationErrors
];

// Validaciones para lotes
const validateLot = [
    body('codigo').trim().notEmpty().withMessage('El código es requerido'),
    body('area').isFloat({ min: 100, max: 200 }).withMessage('El área debe estar entre 100 y 200 m²'),
    body('ubicacion').trim().notEmpty().withMessage('La ubicación es requerida'),
    body('valor').isFloat({ min: 1 }).withMessage('El valor debe ser positivo'),
    body('num_cuotas').isInt({ min: 1, max: 120 }).withMessage('Número de cuotas inválido'),
    handleValidationErrors
];

// Validaciones para pagos
const validatePayment = [
    body('compra_id').isInt().withMessage('ID de compra inválido'),
    body('monto').isFloat({ min: 1 }).withMessage('El monto debe ser positivo'),
    body('metodo_pago').isIn(['Efectivo','Transferencia','Tarjeta','Cheque']).withMessage('Método de pago inválido'),
    handleValidationErrors
];

// Validaciones para PQRS
const validatePQRS = [
    body('tipo').isIn(['Peticion','Queja','Reclamo','Sugerencia']).withMessage('Tipo de PQRS inválido'),
    body('asunto').trim().notEmpty().withMessage('El asunto es requerido').isLength({ max: 255 }),
    body('descripcion').trim().notEmpty().withMessage('La descripción es requerida'),
    handleValidationErrors
];

module.exports = { validateRegister, validateLogin, validateLot, validatePayment, validatePQRS, handleValidationErrors };
