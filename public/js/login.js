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

    let updateForm = $('#update-form');
    let cancelChanges = $('#cancel-changes')
    let confirmChanges = $('.confirm-changes')

    cancelChanges.click(function() {
            $("#userNameInput, #emailAddressInput, #ageInput, #firstNameInput, #lastNameInput").prop("disabled", false);
            $(confirmChanges).hide();
    });

    updateForm.submit(function (event) {
        let userName = userNameInput.val();
        let firstName = firstNameInput.val();
        let lastName = lastNameInput.val();
        let email = emailAddressInput.val();
        let age = ageInput.val();
        let password;

        let same = true
        $('input').each(function () {
            if ($(this).val() !== $(this)[0].defaultValue) same = false;
        })

        try {
            if (same) throw "No changes have been made."
            if ($(confirmChanges).is(":visible")) {
                password = passwordInput.val()
                validationsForCreateUser(firstName.trim(), lastName.trim(), email.trim(), password, Number(age), userName.trim());
                $("#userNameInput, #emailAddressInput, #ageInput, #firstNameInput, #lastNameInput").prop("disabled", false);
                error.text('')
            } else {
                validationsForCreateUser(firstName.trim(), lastName.trim(), email.trim(), "T3mpPassw0rd!", Number(age), userName.trim());
                $("#userNameInput, #emailAddressInput, #ageInput, #firstNameInput, #lastNameInput").prop("disabled", true);
                $(confirmChanges).show();
                event.preventDefault();
                error.text('')   
            }
        } catch (err) {
            if ((typeof err === "string") && err.startsWith("VError")) {
                err = err.substr(1);
            }
            error.text(err);
            event.preventDefault();
        }
    })
})(window.jQuery);