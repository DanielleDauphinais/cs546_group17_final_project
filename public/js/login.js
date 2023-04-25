import { validationsForCheckUser, validationsForCreateUser } from './validators/user.js';

(function ($) {
    let loginForm = $('#login-form');
    let registerForm = $('#registration-form');
    let error = $('#error');
    let firstNameInput = $('#firstNameInput');
    let lastNameInput = $('#lastNameInput');
    let emailAddressInput = $('#emailAddressInput');
    let passwordInput = $('#passwordInput');
    let confirmPasswordInput = $('#confirmPasswordInput');
    let ageInput = $('#ageInput');
    let userNameInput = $('#userNameInput');

    loginForm.submit(function (event) {
        let email = emailAddressInput.val();
        let password = passwordInput.val();

        try {
            validationsForCheckUser(email, password);
            error.text('');
        } catch (err) {
            if ((typeof err === "string") && err.startsWith("VError")) {
                err = err.substr(1);
            }
            error.text(err);
            event.preventDefault();
        }
    });

    registerForm.submit(function (event) {
        let email = emailAddressInput.val();
        let password = passwordInput.val();
        let firstName = firstNameInput.val();
        let lastName = lastNameInput.val();
        let confirmPassword = confirmPasswordInput.val();
        let age = ageInput.val();
        let userName = userNameInput.val();

        try {
            validationsForCreateUser(firstName.trim(), lastName.trim(), email.trim(), password, Number(age), userName.trim());

            if (password !== confirmPassword) throw "Error: Password and confirm password are not same";

            error.text('');
        } catch (err) {
            if ((typeof err === "string") && err.startsWith("VError")) {
                err = err.substr(1);
            }
            error.text(err);
            event.preventDefault();
        }
    });
})(window.jQuery);