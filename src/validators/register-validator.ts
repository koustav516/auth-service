import { checkSchema } from 'express-validator';

export default checkSchema({
    email: {
        errorMessage: 'Email is required',
        notEmpty: true,
        trim: true,
    },

    firstName: {
        errorMessage: 'First Name is required',
        notEmpty: true,
        trim: true,
    },

    lastName: {
        errorMessage: 'Last Name is required',
        notEmpty: true,
        trim: true,
    },
});
